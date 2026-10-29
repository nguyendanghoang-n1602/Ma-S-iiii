import type {
  GameAction,
  GamePhase,
  ChatMessage,
  Player,
  Role,
  Room,
  RoomSettings,
} from '../types/werewolf';
import {
  assignSecretRoles,
  checkWinCondition,
  getNextNightPhase,
  ROLE_DETAILS,
} from './werewolfLogic';
import { getOrCreateSessionId } from './supabaseClient';

const BOT_NAMES = ['An Nhiên', 'Quang Huy', 'Minh Triết', 'Khánh Vy', 'Hoàng Nam', 'Bảo Ngọc', 'Đăng Khoa', 'Thanh Trúc', 'Hải Đăng', 'Cẩm Tú'];
const BOT_AVATARS = ['wolf1', 'wolf2', 'seer', 'witch', 'guard', 'villager1', 'villager2', 'villager3'];

export class LocalGameService {
  private channel: BroadcastChannel | null = null;
  private currentRoomId: string | null = null;
  private subscribers: {
    onRoomUpdate: (room: Room) => void;
    onMessage: (msg: ChatMessage) => void;
    onAction: (action: GameAction) => void;
  }[] = [];

  constructor() {
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      this.channel = new BroadcastChannel('langsoi_local_multiplayer');
      this.channel.onmessage = (event) => {
        const { type, roomId, data } = event.data;
        if (this.currentRoomId && roomId === this.currentRoomId) {
          if (type === 'ROOM_UPDATE') {
            this.notifyRoomUpdate(data);
          } else if (type === 'CHAT_MESSAGE') {
            this.notifyMessage(data);
          } else if (type === 'ACTION') {
            this.notifyAction(data);
          }
        }
      };
    }
  }

  private notifyRoomUpdate(room: Room) {
    this.subscribers.forEach((s) => s.onRoomUpdate(room));
  }

  private notifyMessage(msg: ChatMessage) {
    this.subscribers.forEach((s) => s.onMessage(msg));
  }

  private notifyAction(action: GameAction) {
    this.subscribers.forEach((s) => s.onAction(action));
  }

  private getStorageRoom(roomIdOrCode: string): Room | null {
    const raw = localStorage.getItem(`langsoi_room_${roomIdOrCode.toUpperCase()}`);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as Room;
    } catch {
      return null;
    }
  }

  private saveStorageRoom(room: Room) {
    localStorage.setItem(`langsoi_room_${room.id}`, JSON.stringify(room));
    localStorage.setItem(`langsoi_room_${room.code.toUpperCase()}`, JSON.stringify(room));
    if (this.channel) {
      this.channel.postMessage({ type: 'ROOM_UPDATE', roomId: room.id, data: room });
    }
    this.notifyRoomUpdate(room);
  }

  private getRoomMessages(roomId: string): ChatMessage[] {
    const raw = localStorage.getItem(`langsoi_msgs_${roomId}`);
    return raw ? JSON.parse(raw) : [];
  }

  private saveRoomMessage(roomId: string, msg: ChatMessage) {
    const list = this.getRoomMessages(roomId);
    list.push(msg);
    localStorage.setItem(`langsoi_msgs_${roomId}`, JSON.stringify(list));
    if (this.channel) {
      this.channel.postMessage({ type: 'CHAT_MESSAGE', roomId, data: msg });
    }
    this.notifyMessage(msg);
  }

  private getRoomActions(roomId: string): GameAction[] {
    const raw = localStorage.getItem(`langsoi_actions_${roomId}`);
    return raw ? JSON.parse(raw) : [];
  }

  private saveRoomAction(roomId: string, action: GameAction) {
    const list = this.getRoomActions(roomId);
    list.push(action);
    localStorage.setItem(`langsoi_actions_${roomId}`, JSON.stringify(list));
    if (this.channel) {
      this.channel.postMessage({ type: 'ACTION', roomId, data: action });
    }
    this.notifyAction(action);
  }

  // Tạo phòng mới
  public async createRoom(
    hostName: string,
    settings: RoomSettings,
    roleDistribution: Record<Role, number>
  ): Promise<Room> {
    const myId = getOrCreateSessionId();
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    const roomId = 'room_' + code;

    const hostPlayer: Player = {
      id: myId,
      name: hostName.trim() || 'Chủ Làng',
      avatarSeed: 'host_' + Math.floor(Math.random() * 8),
      isHost: true,
      isAlive: true,
      isConnected: true,
      seatNumber: 1,
      joinedAt: new Date().toISOString(),
    };

    const newRoom: Room = {
      id: roomId,
      code,
      hostId: myId,
      phase: 'LOBBY',
      dayCount: 0,
      nightCount: 0,
      settings,
      roleDistribution,
      players: [hostPlayer],
      phaseEndsAt: null,
      lastDeadPlayerIds: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.currentRoomId = roomId;
    this.saveStorageRoom(newRoom);
    return newRoom;
  }

  // Tham gia phòng
  public async joinRoom(roomCode: string, playerName: string): Promise<{ room: Room; player: Player }> {
    const cleanCode = roomCode.trim().toUpperCase();
    const room = this.getStorageRoom(cleanCode);
    if (!room) {
      throw new Error(`Không tìm thấy phòng với mã "${cleanCode}".`);
    }

    if (room.phase !== 'LOBBY') {
      // Check if reconnecting
      const myId = getOrCreateSessionId();
      const existing = room.players.find((p) => p.id === myId);
      if (existing) {
        existing.isConnected = true;
        this.currentRoomId = room.id;
        this.saveStorageRoom(room);
        return { room, player: existing };
      }
      throw new Error('Ván chơi đã bắt đầu, không thể tham gia mới.');
    }

    if (room.players.length >= room.settings.maxPlayers) {
      throw new Error('Phòng chơi đã đủ số lượng người tối đa.');
    }

    const myId = getOrCreateSessionId();
    let player = room.players.find((p) => p.id === myId);

    if (player) {
      // Already in room, update name
      player.name = playerName.trim() || player.name;
      player.isConnected = true;
    } else {
      player = {
        id: myId,
        name: playerName.trim() || `Dân làng #${room.players.length + 1}`,
        avatarSeed: 'player_' + Math.floor(Math.random() * 8),
        isHost: false,
        isAlive: true,
        isConnected: true,
        seatNumber: room.players.length + 1,
        joinedAt: new Date().toISOString(),
      };
      room.players.push(player);
    }

    this.currentRoomId = room.id;
    this.saveStorageRoom(room);
    return { room, player };
  }

  // Thử kết nối lại
  public async reconnectRoom(roomCode: string): Promise<{ room: Room; player: Player } | null> {
    const cleanCode = roomCode.trim().toUpperCase();
    const room = this.getStorageRoom(cleanCode);
    if (!room) return null;

    const myId = getOrCreateSessionId();
    const player = room.players.find((p) => p.id === myId);
    if (!player) return null;

    player.isConnected = true;
    this.currentRoomId = room.id;
    this.saveStorageRoom(room);
    return { room, player };
  }

  // Cập nhật cài đặt phòng
  public async updateRoomSettings(
    roomId: string,
    settings: RoomSettings,
    roleDistribution: Record<Role, number>
  ): Promise<void> {
    const room = this.getStorageRoom(roomId);
    if (!room) return;
    room.settings = settings;
    room.roleDistribution = roleDistribution;
    room.updatedAt = new Date().toISOString();
    this.saveStorageRoom(room);
  }

  // Thêm Bot kiểm thử nhanh vào phòng
  public async addTestBot(roomId: string): Promise<void> {
    const room = this.getStorageRoom(roomId);
    if (!room || room.phase !== 'LOBBY') return;
    if (room.players.length >= room.settings.maxPlayers) return;

    const usedNames = new Set(room.players.map((p) => p.name));
    const availableName = BOT_NAMES.find((n) => !usedNames.has(n)) || `Người chơi #${room.players.length + 1}`;
    const botId = 'bot_' + Math.random().toString(36).substring(2, 8);

    const botPlayer: Player = {
      id: botId,
      name: availableName,
      avatarSeed: BOT_AVATARS[room.players.length % BOT_AVATARS.length],
      isHost: false,
      isAlive: true,
      isConnected: true,
      seatNumber: room.players.length + 1,
      joinedAt: new Date().toISOString(),
    };

    room.players.push(botPlayer);
    this.saveStorageRoom(room);
  }

  // Bắt đầu ván chơi
  public async startGame(roomId: string): Promise<void> {
    const room = this.getStorageRoom(roomId);
    if (!room) throw new Error('Không tìm thấy phòng.');

    const totalRoles = Object.values(room.roleDistribution).reduce((a, b) => a + b, 0);
    if (totalRoles !== room.players.length) {
      throw new Error(`Tổng số vai trò (${totalRoles}) phải bằng số người chơi trong phòng (${room.players.length})!`);
    }

    // Phân phát vai trò bí mật
    room.players = assignSecretRoles(room.players, room.roleDistribution);
    room.phase = 'ROLE_REVEAL';
    room.dayCount = 0;
    room.nightCount = 1;
    room.lastDeadPlayerIds = [];
    room.activeNightTarget = null;
    room.witchSavedTarget = false;
    room.witchPoisonedTargetId = null;
    room.winnerTeam = null;
    room.winReason = undefined;

    // Reset actions
    localStorage.removeItem(`langsoi_actions_${roomId}`);

    this.saveStorageRoom(room);

    this.saveRoomMessage(roomId, {
      id: 'sys_' + Date.now(),
      roomId,
      senderId: 'SYSTEM',
      senderName: 'Hệ thống Làng Sói',
      channel: 'SYSTEM',
      content: 'Ván chơi bắt đầu! Hãy ghi nhớ vai trò bí mật của mình và chuẩn bị tinh thần!',
      timestamp: new Date().toISOString(),
    });
  }

  // Chuyển giai đoạn tiếp theo
  public async advancePhase(roomId: string): Promise<void> {
    const room = this.getStorageRoom(roomId);
    if (!room) return;

    const myId = getOrCreateSessionId();
    // Only host or auto-trigger advances phase
    const isHost = room.hostId === myId;
    if (!isHost && !myId.startsWith('bot_') && room.players.some((p) => p.id === room.hostId && p.isConnected)) {
      // In multi-tab, let host drive phase transitions
    }

    switch (room.phase) {
      case 'ROLE_REVEAL':
        room.phase = 'NIGHT_START';
        this.saveStorageRoom(room);
        this.saveRoomMessage(roomId, {
          id: 'sys_' + Date.now(),
          roomId,
          senderId: 'SYSTEM',
          senderName: 'Quản trò Làng Sói',
          channel: 'SYSTEM',
          content: `Trời đã tối, ánh trăng tròn nhô lên đỉnh núi. Đêm thứ ${room.nightCount} bắt đầu. Cả làng hãy nhắm mắt đi ngủ!`,
          timestamp: new Date().toISOString(),
        });
        // Auto transition after 2 seconds to first active night role
        setTimeout(() => {
          this.advancePhase(roomId);
        }, 2500);
        break;

      case 'NIGHT_START':
      case 'NIGHT_WOLVES':
      case 'NIGHT_SEER':
      case 'NIGHT_GUARD':
      case 'NIGHT_WITCH': {
        const nextPhase = getNextNightPhase(room.phase, room.players);
        room.phase = nextPhase;
        if (nextPhase === 'NIGHT_RESOLUTION') {
          this.resolveNight(room);
        } else {
          // If bots need to act in this phase, simulate bot action
          this.simulateBotNightAction(room, nextPhase);
          this.saveStorageRoom(room);
        }
        break;
      }

      case 'DAY_ANNOUNCEMENT':
        // Move to Day discussion
        room.phase = 'DAY_DISCUSSION';
        const discussionEnds = new Date(Date.now() + room.settings.dayDiscussionDuration * 1000).toISOString();
        room.phaseEndsAt = discussionEnds;
        this.saveStorageRoom(room);

        this.saveRoomMessage(roomId, {
          id: 'sys_' + Date.now(),
          roomId,
          senderId: 'SYSTEM',
          senderName: 'Quản trò Làng Sói',
          channel: 'PUBLIC',
          content: `Mặt trời đã lên cao. Dân làng có ${room.settings.dayDiscussionDuration} giây để thảo luận và tìm ra manh mối!`,
          timestamp: new Date().toISOString(),
        });
        break;

      case 'DAY_DISCUSSION':
        // Move to voting
        room.phase = 'DAY_VOTING';
        const votingEnds = new Date(Date.now() + room.settings.votingDuration * 1000).toISOString();
        room.phaseEndsAt = votingEnds;
        this.saveStorageRoom(room);

        // Bots cast votes automatically after random delay
        this.simulateBotVotes(room);

        this.saveRoomMessage(roomId, {
          id: 'sys_' + Date.now(),
          roomId,
          senderId: 'SYSTEM',
          senderName: 'Quản trò Làng Sói',
          channel: 'PUBLIC',
          content: 'Đã hết giờ thảo luận! Giờ phán quyết đã điểm. Toàn bộ người dân còn sống hãy bỏ phiếu treo cổ kẻ tình nghi!',
          timestamp: new Date().toISOString(),
        });
        break;

      case 'DAY_VOTING':
        this.resolveVoting(room);
        break;

      case 'VOTE_RESOLUTION': {
        // Check win condition
        const win = checkWinCondition(room.players);
        if (win.winner) {
          room.phase = 'GAME_OVER';
          room.winnerTeam = win.winner;
          room.winReason = win.reason;
          this.saveStorageRoom(room);
          this.saveRoomMessage(roomId, {
            id: 'sys_' + Date.now(),
            roomId,
            senderId: 'SYSTEM',
            senderName: 'Kết quả ván chơi',
            channel: 'SYSTEM',
            content: `Ván chơi kết thúc! ${win.winner === 'WEREWOLVES' ? 'PHE MA SÓI' : 'PHE DÂN LÀNG'} CHIẾN THẮNG! ${win.reason}`,
            timestamp: new Date().toISOString(),
          });
        } else {
          // Go to next night
          room.nightCount += 1;
          room.phase = 'NIGHT_START';
          room.activeNightTarget = null;
          room.witchSavedTarget = false;
          room.witchPoisonedTargetId = null;
          room.lastDeadPlayerIds = [];
          this.saveStorageRoom(room);
          setTimeout(() => {
            this.advancePhase(roomId);
          }, 2500);
        }
        break;
      }
    }
  }

  // Xử lý kết quả ban đêm
  private resolveNight(room: Room) {
    const actions = this.getRoomActions(room.id);
    const nightActions = actions.filter((a) => a.phase.startsWith('NIGHT_'));

    // 1. Tìm mục tiêu bị Sói cắn
    const wolfVotes: Record<string, number> = {};
    nightActions
      .filter((a) => a.actionType === 'WOLF_KILL' && a.targetId)
      .forEach((a) => {
        if (a.targetId) {
          wolfVotes[a.targetId] = (wolfVotes[a.targetId] || 0) + 1;
        }
      });

    let wolfTargetId: string | null = null;
    let maxWolfVotes = 0;
    let tie = false;

    Object.entries(wolfVotes).forEach(([tid, count]) => {
      if (count > maxWolfVotes) {
        maxWolfVotes = count;
        wolfTargetId = tid;
        tie = false;
      } else if (count === maxWolfVotes && count > 0) {
        tie = true;
      }
    });

    if (tie) {
      wolfTargetId = null; // Hòa phiếu thì không ai bị cắn theo luật
    }

    // 2. Tìm người được Bảo vệ
    const guardAction = nightActions.reverse().find((a) => a.actionType === 'GUARD_PROTECT');
    const protectedId = guardAction ? guardAction.targetId : null;

    // Cập nhật bảo vệ lần cuối cho Bảo vệ
    const guardPlayer = room.players.find((p) => p.role === 'BODYGUARD');
    if (guardPlayer) {
      guardPlayer.lastProtectedTargetId = protectedId;
    }

    // 3. Phù thủy cứu và độc
    const witchSave = room.witchSavedTarget;
    const witchPoisonId = room.witchPoisonedTargetId;

    const deadIds = new Set<string>();

    if (wolfTargetId) {
      if (wolfTargetId === protectedId) {
        // Được bảo vệ an toàn
      } else if (witchSave && wolfTargetId === room.activeNightTarget) {
        // Được phù thủy cứu sống
      } else {
        deadIds.add(wolfTargetId);
      }
    }

    if (witchPoisonId) {
      deadIds.add(witchPoisonId);
    }

    // Cập nhật trạng thái người chết
    deadIds.forEach((id) => {
      const p = room.players.find((player) => player.id === id);
      if (p) {
        p.isAlive = false;
      }
    });

    room.lastDeadPlayerIds = Array.from(deadIds);
    room.dayCount += 1;
    room.phase = 'DAY_ANNOUNCEMENT';

    // Check win condition right after night
    const win = checkWinCondition(room.players);
    if (win.winner) {
      room.phase = 'GAME_OVER';
      room.winnerTeam = win.winner;
      room.winReason = win.reason;
      this.saveStorageRoom(room);
      return;
    }

    this.saveStorageRoom(room);

    let annMessage = `Bình minh ngày thứ ${room.dayCount} đã hé rạng trên làng Sói! `;
    if (deadIds.size === 0) {
      annMessage += 'Đêm qua là một đêm bình yên, kỳ diệu thay không ai bị thương tích hay ngã xuống!';
    } else {
      const deadNames = Array.from(deadIds)
        .map((id) => room.players.find((p) => p.id === id)?.name || 'Một người')
        .join(', ');
      annMessage += `Đau buồn thay, đêm qua có người đã ngã xuống vĩnh viễn: [${deadNames}]!`;
    }

    this.saveRoomMessage(room.id, {
      id: 'sys_' + Date.now(),
      roomId: room.id,
      senderId: 'SYSTEM',
      senderName: 'Quản trò Làng Sói',
      channel: 'PUBLIC',
      content: annMessage,
      timestamp: new Date().toISOString(),
    });
  }

  // Xử lý bỏ phiếu ban ngày
  private resolveVoting(room: Room) {
    const actions = this.getRoomActions(room.id);
    const voteActions = actions.filter((a) => a.phase === 'DAY_VOTING');

    const voteCount: Record<string, number> = {};
    let blankVotes = 0;

    voteActions.forEach((v) => {
      if (v.actionType === 'VOTE_BLANK' || !v.targetId) {
        blankVotes += 1;
      } else {
        voteCount[v.targetId] = (voteCount[v.targetId] || 0) + 1;
      }
    });

    let topTargetId: string | null = null;
    let topVotes = 0;
    let isTie = false;

    Object.entries(voteCount).forEach(([targetId, count]) => {
      if (count > topVotes) {
        topVotes = count;
        topTargetId = targetId;
        isTie = false;
      } else if (count === topVotes && count > 0) {
        isTie = true;
      }
    });

    room.phase = 'VOTE_RESOLUTION';

    if (topVotes === 0 || isTie || (room.settings.allowBlankVote && blankVotes >= topVotes)) {
      // Hòa hoặc phiếu trắng chiếm đa số -> Không ai bị treo cổ
      room.lastDeadPlayerIds = [];
      this.saveRoomMessage(room.id, {
        id: 'sys_' + Date.now(),
        roomId: room.id,
        senderId: 'SYSTEM',
        senderName: 'Kết quả Bỏ Phiếu',
        channel: 'PUBLIC',
        content: `Số phiếu phân tán hoặc hòa (${isTie ? 'Hòa phiếu' : 'Phiếu trắng chiếm đa số'}). Chiều nay không có ai bị treo cổ!`,
        timestamp: new Date().toISOString(),
      });
    } else if (topTargetId) {
      const executedPlayer = room.players.find((p) => p.id === topTargetId);
      if (executedPlayer) {
        executedPlayer.isAlive = false;
        room.lastDeadPlayerIds = [executedPlayer.id];

        let roleRevealMsg = '';
        if (room.settings.revealRoleOnDeath && executedPlayer.role) {
          roleRevealMsg = ` Danh tính thật của họ là: [${ROLE_DETAILS[executedPlayer.role].name} - ${ROLE_DETAILS[executedPlayer.role].teamName}]!`;
        }

        this.saveRoomMessage(room.id, {
          id: 'sys_' + Date.now(),
          roomId: room.id,
          senderId: 'SYSTEM',
          senderName: 'Kết quả Bỏ Phiếu',
          channel: 'PUBLIC',
          content: `Với ${topVotes} phiếu thuận, làng đã quyết định treo cổ [${executedPlayer.name}]!${roleRevealMsg}`,
          timestamp: new Date().toISOString(),
        });
      }
    }

    this.saveStorageRoom(room);
  }

  // Hành động trong đêm
  public async submitNightAction(
    roomId: string,
    actionType: GameAction['actionType'],
    targetId?: string | null,
    _extraData?: { witchPotionType?: 'HEAL' | 'POISON' }
  ): Promise<{ success: boolean; result?: string; message?: string }> {
    const room = this.getStorageRoom(roomId);
    if (!room) throw new Error('Không tìm thấy phòng.');

    const myId = getOrCreateSessionId();
    const player = room.players.find((p) => p.id === myId);
    if (!player || !player.isAlive) {
      throw new Error('Người chơi không tồn tại hoặc đã bị loại.');
    }

    const action: GameAction = {
      id: 'act_' + Math.random().toString(36).substring(2, 9),
      roomId,
      phase: room.phase,
      actorId: myId,
      targetId: targetId || null,
      actionType,
      createdAt: new Date().toISOString(),
    };

    if (actionType === 'WOLF_KILL') {
      room.activeNightTarget = targetId || null;
      this.saveRoomAction(roomId, action);
      this.saveStorageRoom(room);
      return { success: true, message: 'Đã chọn mục tiêu tấn công.' };
    }

    if (actionType === 'SEER_INSPECT') {
      if (!targetId) throw new Error('Cần chọn mục tiêu để soi.');
      const target = room.players.find((p) => p.id === targetId);
      if (!target) throw new Error('Mục tiêu không tồn tại.');
      const isWolf = target.role === 'WEREWOLF';
      const result = isWolf ? 'Thuộc phe Ma Sói (Kẻ thù nguy hiểm!)' : 'Không thuộc phe Ma Sói (Dân làng lương thiện)';
      action.result = result;
      this.saveRoomAction(roomId, action);

      // Gửi tin nhắn riêng chỉ cho Tiên Tri
      this.saveRoomMessage(roomId, {
        id: 'msg_' + Date.now(),
        roomId,
        senderId: 'SEER_VISION',
        senderName: 'Quả cầu Tiên Tri',
        channel: 'SEER_PRIVATE',
        content: `Kết quả soi [${target.name}]: ${result}`,
        timestamp: new Date().toISOString(),
      });

      return { success: true, result, message: `Kết quả soi: ${result}` };
    }

    if (actionType === 'GUARD_PROTECT') {
      if (targetId === myId && !room.settings.allowSelfGuard) {
        throw new Error('Cài đặt phòng không cho phép tự bảo vệ bản thân.');
      }
      if (targetId === player.lastProtectedTargetId) {
        throw new Error('Không thể bảo vệ cùng 1 người trong hai đêm liên tiếp.');
      }
      player.lastProtectedTargetId = targetId || null;
      this.saveRoomAction(roomId, action);
      this.saveStorageRoom(room);
      return { success: true, message: 'Đã kích hoạt khiên bảo vệ cho mục tiêu.' };
    }

    if (actionType === 'WITCH_HEAL') {
      if (!player.witchPotions?.heal) {
        throw new Error('Bình thuốc cứu đã hết.');
      }
      player.witchPotions.heal = false;
      room.witchSavedTarget = true;
      this.saveRoomAction(roomId, action);
      this.saveStorageRoom(room);
      return { success: true, message: 'Đã dùng bình thuốc cứu sống nạn nhân đêm nay.' };
    }

    if (actionType === 'WITCH_POISON') {
      if (!player.witchPotions?.poison) {
        throw new Error('Bình thuốc độc đã hết.');
      }
      if (!targetId) throw new Error('Cần chọn mục tiêu để đầu độc.');
      player.witchPotions.poison = false;
      room.witchPoisonedTargetId = targetId;
      this.saveRoomAction(roomId, action);
      this.saveStorageRoom(room);
      return { success: true, message: 'Đã rải độc dược lên mục tiêu.' };
    }

    if (actionType === 'WITCH_SKIP') {
      this.saveRoomAction(roomId, action);
      return { success: true, message: 'Phù thủy bỏ qua lượt đêm nay.' };
    }

    return { success: false, message: 'Hành động không hợp lệ.' };
  }

  // Bỏ phiếu ban ngày
  public async submitVote(roomId: string, targetId: string | null): Promise<void> {
    const room = this.getStorageRoom(roomId);
    if (!room || room.phase !== 'DAY_VOTING') {
      throw new Error('Hiện không phải giai đoạn bỏ phiếu.');
    }

    const myId = getOrCreateSessionId();
    const player = room.players.find((p) => p.id === myId);
    if (!player || !player.isAlive) {
      throw new Error('Bạn không thể bỏ phiếu khi đã chết.');
    }

    const action: GameAction = {
      id: 'vote_' + Math.random().toString(36).substring(2, 9),
      roomId,
      phase: 'DAY_VOTING',
      actorId: myId,
      targetId,
      actionType: targetId ? 'VOTE_EXECUTE' : 'VOTE_BLANK',
      createdAt: new Date().toISOString(),
    };

    this.saveRoomAction(roomId, action);

    const targetName = targetId ? room.players.find((p) => p.id === targetId)?.name : 'Phiếu trắng';
    this.saveRoomMessage(roomId, {
      id: 'vote_msg_' + Date.now(),
      roomId,
      senderId: 'SYSTEM',
      senderName: 'Hệ thống Bỏ Phiếu',
      channel: 'PUBLIC',
      content: `[${player.name}] đã bỏ phiếu cho [${targetName}].`,
      timestamp: new Date().toISOString(),
    });
  }

  // Gửi tin nhắn chat
  public async sendMessage(
    roomId: string,
    content: string,
    channel: ChatMessage['channel'] = 'PUBLIC'
  ): Promise<void> {
    const room = this.getStorageRoom(roomId);
    if (!room) return;

    const myId = getOrCreateSessionId();
    const player = room.players.find((p) => p.id === myId);
    const senderName = player ? player.name : 'Khách';

    const msg: ChatMessage = {
      id: 'msg_' + Math.random().toString(36).substring(2, 9),
      roomId,
      senderId: myId,
      senderName,
      senderRole: player?.role,
      channel,
      content: content.trim(),
      timestamp: new Date().toISOString(),
    };

    this.saveRoomMessage(roomId, msg);
  }

  // Đăng ký nhận cập nhật realtime
  public subscribeToRoom(
    roomId: string,
    callbacks: {
      onRoomUpdate: (room: Room) => void;
      onMessage: (msg: ChatMessage) => void;
      onAction: (action: GameAction) => void;
    }
  ): () => void {
    this.currentRoomId = roomId;
    this.subscribers.push(callbacks);

    // Initial load
    const current = this.getStorageRoom(roomId);
    if (current) callbacks.onRoomUpdate(current);

    const msgs = this.getRoomMessages(roomId);
    msgs.forEach((m) => callbacks.onMessage(m));

    return () => {
      this.subscribers = this.subscribers.filter((s) => s !== callbacks);
    };
  }

  // Rời phòng
  public async leaveRoom(roomId: string): Promise<void> {
    const room = this.getStorageRoom(roomId);
    if (!room) return;

    const myId = getOrCreateSessionId();
    room.players = room.players.filter((p) => p.id !== myId);

    if (room.players.length === 0) {
      localStorage.removeItem(`langsoi_room_${room.id}`);
      localStorage.removeItem(`langsoi_room_${room.code.toUpperCase()}`);
    } else {
      // Reassign host if host left
      if (room.hostId === myId) {
        room.hostId = room.players[0].id;
        room.players[0].isHost = true;
      }
      this.saveStorageRoom(room);
    }
  }

  // Tự động mô phỏng Bot trong đêm khi đến lượt
  private simulateBotNightAction(room: Room, phase: GamePhase) {
    const aliveBots = room.players.filter((p) => p.id.startsWith('bot_') && p.isAlive);
    const alivePlayers = room.players.filter((p) => p.isAlive);

    if (phase === 'NIGHT_WOLVES') {
      const wolfBots = aliveBots.filter((p) => p.role === 'WEREWOLF');
      const nonWolves = alivePlayers.filter((p) => p.role !== 'WEREWOLF');
      if (wolfBots.length > 0 && nonWolves.length > 0) {
        const target = nonWolves[Math.floor(Math.random() * nonWolves.length)];
        room.activeNightTarget = target.id;
        wolfBots.forEach((wb) => {
          this.saveRoomAction(room.id, {
            id: 'bot_act_' + Math.random().toString(36).substring(2, 8),
            roomId: room.id,
            phase,
            actorId: wb.id,
            targetId: target.id,
            actionType: 'WOLF_KILL',
            createdAt: new Date().toISOString(),
          });
        });
      }
    } else if (phase === 'NIGHT_SEER') {
      const seerBot = aliveBots.find((p) => p.role === 'SEER');
      if (seerBot) {
        const others = alivePlayers.filter((p) => p.id !== seerBot.id);
        if (others.length > 0) {
          const target = others[Math.floor(Math.random() * others.length)];
          this.saveRoomAction(room.id, {
            id: 'bot_act_' + Math.random().toString(36).substring(2, 8),
            roomId: room.id,
            phase,
            actorId: seerBot.id,
            targetId: target.id,
            actionType: 'SEER_INSPECT',
            result: target.role === 'WEREWOLF' ? 'Phe Sói' : 'Dân Làng',
            createdAt: new Date().toISOString(),
          });
        }
      }
    } else if (phase === 'NIGHT_GUARD') {
      const guardBot = aliveBots.find((p) => p.role === 'BODYGUARD');
      if (guardBot) {
        const targets = alivePlayers.filter((p) => p.id !== guardBot.lastProtectedTargetId);
        if (targets.length > 0) {
          const target = targets[Math.floor(Math.random() * targets.length)];
          guardBot.lastProtectedTargetId = target.id;
          this.saveRoomAction(room.id, {
            id: 'bot_act_' + Math.random().toString(36).substring(2, 8),
            roomId: room.id,
            phase,
            actorId: guardBot.id,
            targetId: target.id,
            actionType: 'GUARD_PROTECT',
            createdAt: new Date().toISOString(),
          });
        }
      }
    } else if (phase === 'NIGHT_WITCH') {
      const witchBot = aliveBots.find((p) => p.role === 'WITCH');
      if (witchBot && witchBot.witchPotions?.heal && room.activeNightTarget) {
        // Bot phù thủy có 75% khả năng cứu người
        if (Math.random() < 0.75) {
          witchBot.witchPotions.heal = false;
          room.witchSavedTarget = true;
          this.saveRoomAction(room.id, {
            id: 'bot_act_' + Math.random().toString(36).substring(2, 8),
            roomId: room.id,
            phase,
            actorId: witchBot.id,
            actionType: 'WITCH_HEAL',
            createdAt: new Date().toISOString(),
          });
        }
      }
    }
  }

  // Tự động mô phỏng Bot bỏ phiếu ban ngày
  private simulateBotVotes(room: Room) {
    const aliveBots = room.players.filter((p) => p.id.startsWith('bot_') && p.isAlive);
    const alivePlayers = room.players.filter((p) => p.isAlive);

    aliveBots.forEach((bot, idx) => {
      setTimeout(() => {
        const targets = alivePlayers.filter((p) => p.id !== bot.id);
        const target = targets[Math.floor(Math.random() * targets.length)];
        const action: GameAction = {
          id: 'bot_vote_' + Math.random().toString(36).substring(2, 8),
          roomId: room.id,
          phase: 'DAY_VOTING',
          actorId: bot.id,
          targetId: target ? target.id : null,
          actionType: target ? 'VOTE_EXECUTE' : 'VOTE_BLANK',
          createdAt: new Date().toISOString(),
        };
        this.saveRoomAction(room.id, action);
        this.saveRoomMessage(room.id, {
          id: 'bot_msg_' + Date.now(),
          roomId: room.id,
          senderId: 'SYSTEM',
          senderName: 'Hệ thống Bỏ Phiếu',
          channel: 'PUBLIC',
          content: `[${bot.name}] đã bỏ phiếu cho [${target ? target.name : 'Phiếu trắng'}].`,
          timestamp: new Date().toISOString(),
        });
      }, (idx + 1) * 800);
    });
  }
}

export const localGameService = new LocalGameService();
