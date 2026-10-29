export type Role = 'WEREWOLF' | 'VILLAGER' | 'SEER' | 'BODYGUARD' | 'WITCH';

export type Team = 'WEREWOLVES' | 'VILLAGERS';

export type GamePhase =
  | 'LOBBY'
  | 'ROLE_REVEAL'
  | 'NIGHT_START'
  | 'NIGHT_WOLVES'
  | 'NIGHT_SEER'
  | 'NIGHT_GUARD'
  | 'NIGHT_WITCH'
  | 'NIGHT_RESOLUTION'
  | 'DAY_ANNOUNCEMENT'
  | 'DAY_DISCUSSION'
  | 'DAY_VOTING'
  | 'VOTE_RESOLUTION'
  | 'GAME_OVER';

export interface RoomSettings {
  maxPlayers: number;
  dayDiscussionDuration: number; // in seconds (e.g. 90)
  votingDuration: number; // in seconds (e.g. 45)
  nightActionDuration: number; // in seconds (e.g. 30)
  allowBlankVote: boolean; // Cho phép bỏ phiếu trắng
  revealRoleOnDeath: boolean; // Tiết lộ vai trò khi chết
  allowSelfGuard: boolean; // Bảo vệ được tự bảo vệ bản thân
  witchCanUseBothSameNight: boolean; // Phù thủy dùng 2 bình cùng đêm
}

export interface Player {
  id: string; // unique UUID (session id)
  name: string;
  avatarSeed: string;
  isHost: boolean;
  isAlive: boolean;
  isConnected: boolean;
  seatNumber: number;
  role?: Role; // only revealed to self or at game over / death if allowed
  knownTeam?: Team; // known team for self / other werewolves
  witchPotions?: {
    heal: boolean;
    poison: boolean;
  };
  lastProtectedTargetId?: string | null;
  joinedAt: string;
}

export interface Room {
  id: string; // UUID or room code
  code: string; // 6-character room code (e.g. "SOIVIP")
  hostId: string;
  phase: GamePhase;
  dayCount: number; // Ngày 1, Ngày 2...
  nightCount: number; // Đêm 1, Đêm 2...
  settings: RoomSettings;
  roleDistribution: Record<Role, number>;
  players: Player[];
  phaseEndsAt?: string | null; // ISO timestamp
  activeNightTarget?: string | null; // Current victim target selected by wolves
  witchSavedTarget?: boolean;
  witchPoisonedTargetId?: string | null;
  lastDeadPlayerIds: string[]; // List of players killed in the previous transition
  winnerTeam?: Team | null;
  winReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface GameAction {
  id: string;
  roomId: string;
  phase: GamePhase;
  actorId: string;
  targetId?: string | null;
  actionType: 'WOLF_KILL' | 'SEER_INSPECT' | 'GUARD_PROTECT' | 'WITCH_HEAL' | 'WITCH_POISON' | 'WITCH_SKIP' | 'VOTE_EXECUTE' | 'VOTE_BLANK';
  result?: string;
  createdAt: string;
}

export interface ChatMessage {
  id: string;
  roomId: string;
  senderId: string;
  senderName: string;
  senderRole?: Role;
  channel: 'PUBLIC' | 'WEREWOLVES' | 'SYSTEM' | 'SEER_PRIVATE';
  content: string;
  timestamp: string;
}

export interface GameLogEntry {
  id: string;
  roomId: string;
  day: number;
  phase: GamePhase;
  content: string;
  isPublic: boolean;
  timestamp: string;
}

export interface RolePreset {
  playerCount: number;
  roles: Record<Role, number>;
}
