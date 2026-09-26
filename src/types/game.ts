export type GameRole = 'mafia' | 'villager';
export type GameTeam = 'mafia' | 'town';

export type GameStatus =
  | 'lobby'
  | 'role_reveal'
  | 'night'
  | 'day_announcement'
  | 'day_discussion'
  | 'voting'
  | 'game_over';

export interface RoomSettings {
  mafiaCount: number;
  discussionDurationSec: number;
  nightDurationSec: number;
  autoBotFill: boolean;
}

export interface RoomData {
  roomId: string;
  hostId: string;
  hostName: string;
  status: GameStatus;
  phaseNumber: number;
  dayNumber: number;
  phaseDeadline?: number;
  winner?: 'town' | 'mafia' | null;
  lastEliminatedName?: string;
  lastEliminatedRole?: GameRole;
  lastNightSummary?: string;
  mafiaCount: number;
  discussionDurationSec: number;
  nightDurationSec: number;
  createdAt: string;
  updatedAt: string;
}

export interface PlayerData {
  uid: string;
  displayName: string;
  photoURL?: string;
  isHost: boolean;
  isAlive: boolean;
  isBot?: boolean;
  role?: GameRole;
  team?: GameTeam;
  isReady?: boolean;
  nightTargetId?: string; // target UID chosen by mafia
  voteTargetId?: string; // target UID voted by player (or 'skip')
  joinedAt: string;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  channel: 'town' | 'mafia' | 'system';
  text: string;
  createdAt: string;
}

export interface RoleInfo {
  name: string;
  team: GameTeam;
  badgeColor: string;
  icon: string;
  tagline: string;
  description: string;
  nightActionDescription: string;
}
