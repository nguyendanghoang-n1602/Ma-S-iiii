import type {
  GameAction,
  ChatMessage,
  Player,
  Role,
  Room,
  RoomSettings,
} from '../types/werewolf';
import { isSupabaseConfigured } from './supabaseClient';
import { supabaseGameService } from './supabaseGameService';
import { localGameService } from './localGameService';

export type BackendMode = 'SUPABASE' | 'LOCAL';

class GameServiceDispatcher {
  private mode: BackendMode = 'LOCAL';

  constructor() {
    const saved = localStorage.getItem('langsoi_backend_mode') as BackendMode;
    if (saved === 'SUPABASE' && isSupabaseConfigured()) {
      this.mode = 'SUPABASE';
    } else if (saved === 'SUPABASE' && !isSupabaseConfigured()) {
      // Default to LOCAL until configured
      this.mode = 'LOCAL';
    } else if (saved === 'LOCAL') {
      this.mode = 'LOCAL';
    } else {
      this.mode = isSupabaseConfigured() ? 'SUPABASE' : 'LOCAL';
    }
  }

  public getMode(): BackendMode {
    return this.mode;
  }

  public setMode(mode: BackendMode) {
    if (mode === 'SUPABASE' && !isSupabaseConfigured()) {
      throw new Error('Supabase chưa được cấu hình. Vui lòng nhập URL và Anon Key trước.');
    }
    this.mode = mode;
    localStorage.setItem('langsoi_backend_mode', mode);
  }

  private getActiveService() {
    if (this.mode === 'SUPABASE' && isSupabaseConfigured()) {
      return supabaseGameService;
    }
    return localGameService;
  }

  public async createRoom(
    hostName: string,
    settings: RoomSettings,
    roleDistribution: Record<Role, number>
  ): Promise<Room> {
    return this.getActiveService().createRoom(hostName, settings, roleDistribution);
  }

  public async joinRoom(roomCode: string, playerName: string): Promise<{ room: Room; player: Player }> {
    return this.getActiveService().joinRoom(roomCode, playerName);
  }

  public async reconnectRoom(roomCode: string): Promise<{ room: Room; player: Player } | null> {
    return this.getActiveService().reconnectRoom(roomCode);
  }

  public async updateRoomSettings(
    roomId: string,
    settings: RoomSettings,
    roleDistribution: Record<Role, number>
  ): Promise<void> {
    return this.getActiveService().updateRoomSettings(roomId, settings, roleDistribution);
  }

  public async addTestBot(roomId: string): Promise<void> {
    // Only available in local mode or falls back
    if (this.mode === 'LOCAL') {
      return localGameService.addTestBot(roomId);
    }
  }

  public async startGame(roomId: string): Promise<void> {
    return this.getActiveService().startGame(roomId);
  }

  public async advancePhase(roomId: string): Promise<void> {
    return this.getActiveService().advancePhase(roomId);
  }

  public async submitNightAction(
    roomId: string,
    actionType: GameAction['actionType'],
    targetId?: string | null,
    extraData?: any
  ): Promise<{ success: boolean; result?: string; message?: string }> {
    return this.getActiveService().submitNightAction(roomId, actionType, targetId, extraData);
  }

  public async submitVote(roomId: string, targetId: string | null): Promise<void> {
    return this.getActiveService().submitVote(roomId, targetId);
  }

  public async sendMessage(
    roomId: string,
    content: string,
    channel: ChatMessage['channel'] = 'PUBLIC'
  ): Promise<void> {
    return this.getActiveService().sendMessage(roomId, content, channel);
  }

  public subscribeToRoom(
    roomId: string,
    callbacks: {
      onRoomUpdate: (room: Room) => void;
      onMessage: (msg: ChatMessage) => void;
      onAction: (action: GameAction) => void;
    }
  ): () => void {
    return this.getActiveService().subscribeToRoom(roomId, callbacks);
  }

  public async leaveRoom(roomId: string): Promise<void> {
    return this.getActiveService().leaveRoom(roomId);
  }
}

export const gameService = new GameServiceDispatcher();
