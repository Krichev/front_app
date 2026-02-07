export enum GamePhase {
  LOBBY = 'LOBBY',
  READING = 'READING',
  DISCUSSION = 'DISCUSSION',
  ANSWERING = 'ANSWERING',
  FEEDBACK = 'FEEDBACK',
  COMPLETED = 'COMPLETED'
}

export enum PlayerRole {
  HOST = 'HOST',
  PLAYER = 'PLAYER',
  PRESENTER = 'PRESENTER'
}

export interface RoomPlayer {
  userId: number;
  username: string;
  role: PlayerRole;
  connected: boolean;
  score: number;
  lastAnswer?: string;
  avatarUrl?: string;
}

export interface GameState {
  roomCode: string;
  phase: GamePhase;
  currentQuestionId?: number;
  timerEndTime?: string; // ISO string
}

export interface MultiplayerRoomState {
  isConnected: boolean;
  connectionStatus: 'CONNECTING' | 'CONNECTED' | 'DISCONNECTED' | 'ERROR';
  gameState: GameState | null;
  players: RoomPlayer[];
  error: string | null;
}
