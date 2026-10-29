import { SupabaseClient } from '@supabase/supabase-js';
import type {
  GameAction,
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
import { getOrCreateSessionId, getSupabaseClient } from './supabaseClient';

export class SupabaseGameService {
  private activeChannel: ReturnType<SupabaseClient['channel']> | null = null;
  private currentRoomId: string | null = null;
  private subscribers: {
    onRoomUpdate: (room: Room) => void;
    onMessage: (msg: ChatMessage) => void;
    onAction: (action: GameAction) => void;
  }[] = [];

  public getCurrentRoomId(): string | null {
    return this.currentRoomId;
  }

  private getClient(): SupabaseClient {
    const client = getSupabaseClient();
    if (!client) {
      throw new Error('Supabase client chưa được cấu hình. Vui lòng kiểm tra URL và Anon Key trong cài đặt.');
    }
    return client;
  }

  private notifyRoomUpdate(room: Room) {
    this.subscribers.forEach((s) => s.onRoomUpdate(room));
  }

  private notifyMessage(msg: ChatMessage) {
    this.subscribers.forEach((s) => s.onMessage(msg));
  }

  protected notifyAction(action: GameAction) {
    this.subscribers.forEach((s) => s.onAction(action));
  }

  // Lấy dữ liệu phòng hoàn chỉnh
  public async fetchRoom(roomIdOrCode: string): Promise<Room | null> {
    const supabase = this.getClient();
    let query = supabase.from('rooms').select('*');

    if (roomIdOrCode.length === 6 && !roomIdOrCode.includes('-')) {
      query = query.eq('code', roomIdOrCode.toUpperCase());
    } else {
      query = query.eq('id', roomIdOrCode);
    }

    const { data: roomData, error: roomError } = await query.single();
    if (roomError || !roomData) return null;

    // Lấy danh sách người chơi
    const { data: playersData, error: playersError } = await supabase
      .from('players')
      .select('*')
      .eq('room_id', roomData.id)
      .order('seat_number', { ascending: true });

    if (playersError) return null;

    const myId = getOrCreateSessionId();

    // Mask secret roles according to rules:
    // Only see my own role, or if I am a werewolf I see fellow werewolves.
    // When dead (if revealRoleOnDeath) or GAME_OVER, all roles can be revealed.
    const myPlayer = playersData.find((p) => p.id === myId);
    const myRole = myPlayer?.role;
    const isGameOver = roomData.phase === 'GAME_OVER';

    const mappedPlayers: Player[] = playersData.map((p) => {
      let visibleRole: Role | undefined = undefined;

      if (isGameOver) {
        visibleRole = p.role;
      } else if (p.id === myId) {
        visibleRole = p.role;
      } else if (myRole === 'WEREWOLF' && p.role === 'WEREWOLF') {
        visibleRole = 'WEREWOLF';
      } else if (!p.is_alive && roomData.settings?.revealRoleOnDeath) {
        visibleRole = p.role;
      }

      return {
        id: p.id,
        name: p.name,
        avatarSeed: p.avatar_seed,
        isHost: p.is_host,
        isAlive: p.is_alive,
        isConnected: p.is_connected,
        seatNumber: p.seat_number,
        role: visibleRole,
        knownTeam: visibleRole === 'WEREWOLF' ? 'WEREWOLVES' : visibleRole ? 'VILLAGERS' : undefined,
        witchPotions: p.id === myId ? p.witch_potions : undefined,
        lastProtectedTargetId: p.id === myId ? p.last_protected_target_id : undefined,
        joinedAt: p.joined_at,
      };
    });

    return {
      id: roomData.id,
      code: roomData.code,
      hostId: roomData.host_id,
      phase: roomData.phase,
      dayCount: roomData.day_count,
      nightCount: roomData.night_count,
      settings: roomData.settings,
      roleDistribution: roomData.role_distribution,
      players: mappedPlayers,
      phaseEndsAt: roomData.phase_ends_at,
      activeNightTarget: roomData.active_night_target,
      witchSavedTarget: roomData.witch_saved_target,
      witchPoisonedTargetId: roomData.witch_poisoned_target_id,
      lastDeadPlayerIds: roomData.last_dead_player_ids || [],
      winnerTeam: roomData.winner_team,
      winReason: roomData.win_reason,
      createdAt: roomData.created_at,
      updatedAt: roomData.updated_at,
    };
  }

  // Tạo phòng mới trên Supabase
  public async createRoom(
    hostName: string,
    settings: RoomSettings,
    roleDistribution: Record<Role, number>
  ): Promise<Room> {
    const supabase = this.getClient();
    const myId = getOrCreateSessionId();
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();

    const { data: newRoomData, error: roomError } = await supabase
      .from('rooms')
      .insert({
        code,
        host_id: myId,
        phase: 'LOBBY',
        day_count: 0,
        night_count: 0,
        settings,
        role_distribution: roleDistribution,
      })
      .select()
      .single();

    if (roomError) {
      throw new Error(`Lỗi tạo phòng Supabase: ${roomError.message}`);
    }

    // Thêm host vào players
    const { error: playerError } = await supabase.from('players').insert({
      id: myId,
      room_id: newRoomData.id,
      name: hostName.trim() || 'Chủ Làng',
      avatar_seed: 'host_' + Math.floor(Math.random() * 8),
      is_host: true,
      is_alive: true,
      is_connected: true,
      seat_number: 1,
    });

    if (playerError) {
      throw new Error(`Lỗi khởi tạo ghế chủ phòng: ${playerError.message}`);
    }

    const room = await this.fetchRoom(newRoomData.id);
    if (!room) throw new Error('Không thể tải lại thông tin phòng vừa tạo.');

    this.currentRoomId = room.id;
    return room;
  }

  // Tham gia phòng
  public async joinRoom(roomCode: string, playerName: string): Promise<{ room: Room; player: Player }> {
    const supabase = this.getClient();
    const cleanCode = roomCode.trim().toUpperCase();

    const { data: roomData, error: roomError } = await supabase
      .from('rooms')
      .select('*')
      .eq('code', cleanCode)
      .single();

    if (roomError || !roomData) {
      throw new Error(`Không tìm thấy phòng chơi với mã "${cleanCode}".`);
    }

    if (roomData.phase !== 'LOBBY') {
      const myId = getOrCreateSessionId();
      const { data: existingPlayer } = await supabase
        .from('players')
        .select('*')
        .eq('room_id', roomData.id)
        .eq('id', myId)
        .single();

      if (existingPlayer) {
        await supabase
          .from('players')
          .update({ is_connected: true })
          .eq('room_id', roomData.id)
          .eq('id', myId);

        const room = await this.fetchRoom(roomData.id);
        const player = room?.players.find((p) => p.id === myId);
        if (room && player) return { room, player };
      }
      throw new Error('Ván chơi đã bắt đầu, không thể nhận thêm người mới.');
    }

    // Đếm số người hiện tại
    const { count } = await supabase
      .from('players')
      .select('*', { count: 'exact', head: true })
      .eq('room_id', roomData.id);

    const max = roomData.settings?.maxPlayers || 8;
    if ((count || 0) >= max) {
      throw new Error('Phòng chơi đã đủ người.');
    }

    const myId = getOrCreateSessionId();

    // Check if player already exists
    const { data: existing } = await supabase
      .from('players')
      .select('*')
      .eq('room_id', roomData.id)
      .eq('id', myId)
      .maybeSingle();

    if (existing) {
      await supabase
        .from('players')
        .update({
          name: playerName.trim() || existing.name,
          is_connected: true,
        })
        .eq('room_id', roomData.id)
        .eq('id', myId);
    } else {
      const nextSeat = (count || 0) + 1;
      await supabase.from('players').insert({
        id: myId,
        room_id: roomData.id,
        name: playerName.trim() || `Dân làng #${nextSeat}`,
        avatar_seed: 'player_' + Math.floor(Math.random() * 8),
        is_host: false,
        is_alive: true,
        is_connected: true,
        seat_number: nextSeat,
      });
    }

    const room = await this.fetchRoom(roomData.id);
    if (!room) throw new Error('Không thể tải dữ liệu phòng.');
    const player = room.players.find((p) => p.id === myId);
    if (!player) throw new Error('Không tìm thấy danh tính người chơi.');

    this.currentRoomId = room.id;
    return { room, player };
  }

  // Kết nối lại
  public async reconnectRoom(roomCode: string): Promise<{ room: Room; player: Player } | null> {
    try {
      const room = await this.fetchRoom(roomCode);
      if (!room) return null;
      const myId = getOrCreateSessionId();
      const player = room.players.find((p) => p.id === myId);
      if (!player) return null;

      const supabase = this.getClient();
      await supabase
        .from('players')
        .update({ is_connected: true })
        .eq('room_id', room.id)
        .eq('id', myId);

      this.currentRoomId = room.id;
      return { room, player };
    } catch {
      return null;
    }
  }

  // Cập nhật cài đặt
  public async updateRoomSettings(
    roomId: string,
    settings: RoomSettings,
    roleDistribution: Record<Role, number>
  ): Promise<void> {
    const supabase = this.getClient();
    await supabase
      .from('rooms')
      .update({
        settings,
        role_distribution: roleDistribution,
        updated_at: new Date().toISOString(),
      })
      .eq('id', roomId);
  }

  // Bắt đầu game
  public async startGame(roomId: string): Promise<void> {
    const supabase = this.getClient();
    const room = await this.fetchRoom(roomId);
    if (!room) throw new Error('Phòng không tồn tại.');

    const totalRoles = Object.values(room.roleDistribution).reduce((a, b) => a + b, 0);
    if (totalRoles !== room.players.length) {
      throw new Error(`Tổng số vai trò (${totalRoles}) phải bằng số người trong phòng (${room.players.length})!`);
    }

    // Phân phát vai trò
    const assignedPlayers = assignSecretRoles(room.players, room.roleDistribution);

    // Cập nhật vào DB
    for (const p of assignedPlayers) {
      await supabase
        .from('players')
        .update({
          role: p.role,
          is_alive: true,
          witch_potions: p.witchPotions || { heal: true, poison: true },
          last_protected_target_id: null,
        })
        .eq('room_id', roomId)
        .eq('id', p.id);
    }

    await supabase
      .from('rooms')
      .update({
        phase: 'ROLE_REVEAL',
        day_count: 0,
        night_count: 1,
        active_night_target: null,
        witch_saved_target: false,
        witch_poisoned_target_id: null,
        last_dead_player_ids: [],
        winner_team: null,
        win_reason: null,
      })
      .eq('id', roomId);

    await this.sendMessage(roomId, 'Ván chơi bắt đầu! Hãy ghi nhớ vai trò bí mật của mình!', 'SYSTEM');
  }

  // Chuyển giai đoạn
  public async advancePhase(roomId: string): Promise<void> {
    const supabase = this.getClient();
    const room = await this.fetchRoom(roomId);
    if (!room) return;

    switch (room.phase) {
      case 'ROLE_REVEAL':
        await supabase
          .from('rooms')
          .update({ phase: 'NIGHT_START' })
          .eq('id', roomId);

        await this.sendMessage(
          roomId,
          `Đêm thứ ${room.nightCount} bắt đầu. Ngôi làng chìm vào bóng tối!`,
          'SYSTEM'
        );

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
        if (nextPhase === 'NIGHT_RESOLUTION') {
          await this.resolveNight(roomId);
        } else {
          await supabase.from('rooms').update({ phase: nextPhase }).eq('id', roomId);
        }
        break;
      }

      case 'DAY_ANNOUNCEMENT':
        const discussionEnds = new Date(Date.now() + room.settings.dayDiscussionDuration * 1000).toISOString();
        await supabase
          .from('rooms')
          .update({
            phase: 'DAY_DISCUSSION',
            phase_ends_at: discussionEnds,
          })
          .eq('id', roomId);

        await this.sendMessage(
          roomId,
          `Dân làng có ${room.settings.dayDiscussionDuration} giây thảo luận để tìm ra kẻ tình nghi!`,
          'PUBLIC'
        );
        break;

      case 'DAY_DISCUSSION':
        const votingEnds = new Date(Date.now() + room.settings.votingDuration * 1000).toISOString();
        await supabase
          .from('rooms')
          .update({
            phase: 'DAY_VOTING',
            phase_ends_at: votingEnds,
          })
          .eq('id', roomId);

        await this.sendMessage(
          roomId,
          'Giờ phán quyết đã tới! Tất cả người sống hãy bỏ phiếu treo cổ!',
          'PUBLIC'
        );
        break;

      case 'DAY_VOTING':
        await this.resolveVoting(roomId);
        break;

      case 'VOTE_RESOLUTION': {
        const win = checkWinCondition(room.players);
        if (win.winner) {
          await supabase
            .from('rooms')
            .update({
              phase: 'GAME_OVER',
              winner_team: win.winner,
              win_reason: win.reason,
            })
            .eq('id', roomId);

          await this.sendMessage(
            roomId,
            `Ván chơi kết thúc! ${win.winner === 'WEREWOLVES' ? 'PHE MA SÓI' : 'PHE DÂN LÀNG'} CHIẾN THẮNG! ${win.reason}`,
            'SYSTEM'
          );
        } else {
          await supabase
            .from('rooms')
            .update({
              night_count: room.nightCount + 1,
              phase: 'NIGHT_START',
              active_night_target: null,
              witch_saved_target: false,
              witch_poisoned_target_id: null,
              last_dead_player_ids: [],
            })
            .eq('id', roomId);

          setTimeout(() => {
            this.advancePhase(roomId);
          }, 2500);
        }
        break;
      }
    }
  }

  // Giải quyết kết quả đêm
  private async resolveNight(roomId: string) {
    const supabase = this.getClient();
    const room = await this.fetchRoom(roomId);
    if (!room) return;

    const { data: actionsData } = await supabase
      .from('game_actions')
      .select('*')
      .eq('room_id', roomId);

    const nightActions = (actionsData || []).filter((a: any) => a.phase.startsWith('NIGHT_'));

    // Tally wolf targets
    const wolfVotes: Record<string, number> = {};
    nightActions
      .filter((a: any) => a.action_type === 'WOLF_KILL' && a.target_id)
      .forEach((a: any) => {
        wolfVotes[a.target_id] = (wolfVotes[a.target_id] || 0) + 1;
      });

    let wolfTargetId: string | null = null;
    let maxWolf = 0;
    let tie = false;

    Object.entries(wolfVotes).forEach(([tid, cnt]) => {
      if (cnt > maxWolf) {
        maxWolf = cnt;
        wolfTargetId = tid;
        tie = false;
      } else if (cnt === maxWolf && cnt > 0) {
        tie = true;
      }
    });

    if (tie) wolfTargetId = null;

    // Guard protect
    const guardAction = nightActions.reverse().find((a: any) => a.action_type === 'GUARD_PROTECT');
    const protectedId = guardAction?.target_id;

    const deadIds = new Set<string>();

    if (wolfTargetId) {
      if (wolfTargetId === protectedId) {
        // Safe
      } else if (room.witchSavedTarget && wolfTargetId === room.activeNightTarget) {
        // Saved by witch
      } else {
        deadIds.add(wolfTargetId);
      }
    }

    if (room.witchPoisonedTargetId) {
      deadIds.add(room.witchPoisonedTargetId);
    }

    for (const deadId of Array.from(deadIds)) {
      await supabase
        .from('players')
        .update({ is_alive: false })
        .eq('room_id', roomId)
        .eq('id', deadId);
    }

    const updatedPlayers = room.players.map((p) => ({
      ...p,
      isAlive: deadIds.has(p.id) ? false : p.isAlive,
    }));

    const win = checkWinCondition(updatedPlayers);

    if (win.winner) {
      await supabase
        .from('rooms')
        .update({
          phase: 'GAME_OVER',
          winner_team: win.winner,
          win_reason: win.reason,
          last_dead_player_ids: Array.from(deadIds),
        })
        .eq('id', roomId);
    } else {
      await supabase
        .from('rooms')
        .update({
          phase: 'DAY_ANNOUNCEMENT',
          day_count: room.dayCount + 1,
          last_dead_player_ids: Array.from(deadIds),
        })
        .eq('id', roomId);

      let msg = `Bình minh ngày thứ ${room.dayCount + 1} đã đến! `;
      if (deadIds.size === 0) {
        msg += 'Đêm qua không có ai chết, một đêm kỳ diệu và bình an!';
      } else {
        const deadNames = Array.from(deadIds)
          .map((id) => room.players.find((p) => p.id === id)?.name || 'Người dân')
          .join(', ');
        msg += `Đau buồn thay, đêm qua có người đã ngã xuống: [${deadNames}]!`;
      }
      await this.sendMessage(roomId, msg, 'PUBLIC');
    }
  }

  // Giải quyết bỏ phiếu
  private async resolveVoting(roomId: string) {
    const supabase = this.getClient();
    const room = await this.fetchRoom(roomId);
    if (!room) return;

    const { data: actionsData } = await supabase
      .from('game_actions')
      .select('*')
      .eq('room_id', roomId)
      .eq('phase', 'DAY_VOTING');

    const votes: Record<string, number> = {};
    let blankVotes = 0;

    (actionsData || []).forEach((a: any) => {
      if (a.action_type === 'VOTE_BLANK' || !a.target_id) {
        blankVotes += 1;
      } else {
        votes[a.target_id] = (votes[a.target_id] || 0) + 1;
      }
    });

    let topTargetId: string | null = null;
    let topVotes = 0;
    let isTie = false;

    Object.entries(votes).forEach(([tid, cnt]) => {
      if (cnt > topVotes) {
        topVotes = cnt;
        topTargetId = tid;
        isTie = false;
      } else if (cnt === topVotes && cnt > 0) {
        isTie = true;
      }
    });

    if (topVotes === 0 || isTie || (room.settings.allowBlankVote && blankVotes >= topVotes)) {
      await supabase
        .from('rooms')
        .update({
          phase: 'VOTE_RESOLUTION',
          last_dead_player_ids: [],
        })
        .eq('id', roomId);

      await this.sendMessage(
        roomId,
        `Kết quả hòa hoặc đa số phiếu trắng (${isTie ? 'Hòa phiếu' : 'Phiếu trắng'}). Chiều nay không ai bị treo cổ!`,
        'PUBLIC'
      );
    } else if (topTargetId) {
      await supabase
        .from('players')
        .update({ is_alive: false })
        .eq('room_id', roomId)
        .eq('id', topTargetId);

      const executed = room.players.find((p) => p.id === topTargetId);

      await supabase
        .from('rooms')
        .update({
          phase: 'VOTE_RESOLUTION',
          last_dead_player_ids: [topTargetId],
        })
        .eq('id', roomId);

      let reveal = '';
      if (room.settings.revealRoleOnDeath && executed?.role) {
        reveal = ` Danh tính của họ là: [${ROLE_DETAILS[executed.role].name} - ${ROLE_DETAILS[executed.role].teamName}]!`;
      }

      await this.sendMessage(
        roomId,
        `Với ${topVotes} phiếu, làng đã đưa [${executed?.name || 'Mục tiêu'}] lên đoạn đầu đài!${reveal}`,
        'PUBLIC'
      );
    }
  }

  // Hành động đêm
  public async submitNightAction(
    roomId: string,
    actionType: GameAction['actionType'],
    targetId?: string | null,
    _extraData?: any
  ): Promise<{ success: boolean; result?: string; message?: string }> {
    const supabase = this.getClient();
    const myId = getOrCreateSessionId();
    const room = await this.fetchRoom(roomId);
    if (!room) throw new Error('Không tìm thấy phòng.');

    const player = room.players.find((p) => p.id === myId);
    if (!player || !player.isAlive) throw new Error('Người chơi không còn sống.');

    if (actionType === 'WOLF_KILL') {
      await supabase
        .from('rooms')
        .update({ active_night_target: targetId })
        .eq('id', roomId);
    } else if (actionType === 'SEER_INSPECT') {
      const target = room.players.find((p) => p.id === targetId);
      const isWolf = target?.role === 'WEREWOLF';
      const result = isWolf ? 'Thuộc phe Ma Sói' : 'Không thuộc phe Ma Sói';

      await this.sendMessage(
        roomId,
        `Kết quả soi [${target?.name}]: ${result}`,
        'SEER_PRIVATE'
      );
      return { success: true, result, message: `Kết quả: ${result}` };
    } else if (actionType === 'GUARD_PROTECT') {
      await supabase
        .from('players')
        .update({ last_protected_target_id: targetId })
        .eq('room_id', roomId)
        .eq('id', myId);
    } else if (actionType === 'WITCH_HEAL') {
      await supabase
        .from('players')
        .update({
          witch_potions: { heal: false, poison: player.witchPotions?.poison ?? true },
        })
        .eq('room_id', roomId)
        .eq('id', myId);

      await supabase
        .from('rooms')
        .update({ witch_saved_target: true })
        .eq('id', roomId);
    } else if (actionType === 'WITCH_POISON') {
      await supabase
        .from('players')
        .update({
          witch_potions: { heal: player.witchPotions?.heal ?? true, poison: false },
        })
        .eq('room_id', roomId)
        .eq('id', myId);

      await supabase
        .from('rooms')
        .update({ witch_poisoned_target_id: targetId })
        .eq('id', roomId);
    }

    await supabase.from('game_actions').insert({
      room_id: roomId,
      phase: room.phase,
      actor_id: myId,
      target_id: targetId,
      action_type: actionType,
    });

    return { success: true, message: 'Thực hiện hành động thành công.' };
  }

  // Bỏ phiếu
  public async submitVote(roomId: string, targetId: string | null): Promise<void> {
    const supabase = this.getClient();
    const myId = getOrCreateSessionId();

    await supabase.from('game_actions').insert({
      room_id: roomId,
      phase: 'DAY_VOTING',
      actor_id: myId,
      target_id: targetId,
      action_type: targetId ? 'VOTE_EXECUTE' : 'VOTE_BLANK',
    });
  }

  // Gửi chat
  public async sendMessage(
    roomId: string,
    content: string,
    channel: ChatMessage['channel'] = 'PUBLIC'
  ): Promise<void> {
    const supabase = this.getClient();
    const myId = getOrCreateSessionId();
    const room = await this.fetchRoom(roomId);
    const player = room?.players.find((p) => p.id === myId);

    await supabase.from('game_messages').insert({
      room_id: roomId,
      sender_id: myId,
      sender_name: player ? player.name : 'Quản trò Làng Sói',
      sender_role: player?.role,
      channel,
      content: content.trim(),
    });
  }

  // Đăng ký Supabase Realtime channel
  public subscribeToRoom(
    roomId: string,
    callbacks: {
      onRoomUpdate: (room: Room) => void;
      onMessage: (msg: ChatMessage) => void;
      onAction: (action: GameAction) => void;
    }
  ): () => void {
    const supabase = this.getClient();
    this.currentRoomId = roomId;
    this.subscribers.push(callbacks);

    // Initial fetch
    this.fetchRoom(roomId).then((room) => {
      if (room) callbacks.onRoomUpdate(room);
    });

    // Fetch initial messages
    supabase
      .from('game_messages')
      .select('*')
      .eq('room_id', roomId)
      .order('created_at', { ascending: true })
      .then(({ data }) => {
        (data || []).forEach((m: any) => {
          callbacks.onMessage({
            id: m.id,
            roomId: m.room_id,
            senderId: m.sender_id,
            senderName: m.sender_name,
            senderRole: m.sender_role,
            channel: m.channel,
            content: m.content,
            timestamp: m.created_at,
          });
        });
      });

    // Setup Realtime Channel
    const channel = supabase.channel(`langsoi_room_${roomId}`);

    channel
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'rooms', filter: `id=eq.${roomId}` },
        async () => {
          const room = await this.fetchRoom(roomId);
          if (room) this.notifyRoomUpdate(room);
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'players', filter: `room_id=eq.${roomId}` },
        async () => {
          const room = await this.fetchRoom(roomId);
          if (room) this.notifyRoomUpdate(room);
        }
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'game_messages', filter: `room_id=eq.${roomId}` },
        (payload) => {
          const m = payload.new;
          this.notifyMessage({
            id: m.id,
            roomId: m.room_id,
            senderId: m.sender_id,
            senderName: m.sender_name,
            senderRole: m.sender_role,
            channel: m.channel,
            content: m.content,
            timestamp: m.created_at,
          });
        }
      )
      .subscribe();

    this.activeChannel = channel;

    return () => {
      this.subscribers = this.subscribers.filter((s) => s !== callbacks);
      if (this.activeChannel) {
        supabase.removeChannel(this.activeChannel);
        this.activeChannel = null;
      }
    };
  }

  // Rời phòng
  public async leaveRoom(roomId: string): Promise<void> {
    const supabase = this.getClient();
    const myId = getOrCreateSessionId();

    await supabase
      .from('players')
      .delete()
      .eq('room_id', roomId)
      .eq('id', myId);
  }
}

export const supabaseGameService = new SupabaseGameService();
