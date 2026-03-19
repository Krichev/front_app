export interface QuestWaypoint {
  id: number;
  questId: number;
  sequenceNumber: number;
  name: string;
  description?: string;
  latitude: number;
  longitude: number;
  radiusMeters: number;
  taskType: WaypointTaskType;
  task?: WaypointTask;
  estimatedMinutes?: number;
}

export type WaypointTaskType = 'QUIZ' | 'PHOTO' | 'LOCATION_CHECKIN' | 'CODE_ENTRY' | 'CUSTOM';

export interface WaypointTask {
  instructions: string;
  requiredProofType?: 'PHOTO' | 'TEXT' | 'CODE';
  correctAnswer?: string;
  hintText?: string;
}

export interface LocationQuest {
  id: number;
  title: string;
  description: string;
  city: string;
  latitude: number;
  longitude: number;
  estimatedDurationMinutes: number;
  estimatedDistanceMeters: number;
  timeLimitMinutes?: number;
  maxParticipants?: number;
  currentParticipantCount: number;
  waypointCount: number;
  status: QuestStatus;
  creatorId: number;
  creatorUsername: string;
  prizePool?: number;
  createdAt: string;
}

export type QuestStatus = 'DRAFT' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';

export interface QuestParticipation {
  id: number;
  questId: number;
  userId: number;
  username: string;
  status: ParticipationStatus;
  currentWaypointIndex: number;
  completedWaypoints: number;
  totalWaypoints: number;
  startedAt?: string;
  completedAt?: string;
}

export type ParticipationStatus = 'JOINED' | 'IN_PROGRESS' | 'COMPLETED' | 'ABANDONED';

export interface WaypointCompletion {
  waypointId: number;
  completedAt: string;
  proofUrl?: string;
  taskAnswer?: string;
}

export interface QuestProgressDTO {
  questId: number;
  participation: QuestParticipation;
  completedWaypoints: WaypointCompletion[];
  otherParticipants: ParticipantLocationDTO[];
}

export interface ParticipantLocationDTO {
  userId: number;
  username: string;
  latitude: number;
  longitude: number;
  currentWaypointIndex: number;
  updatedAt: string;
}

export interface LocationUpdateRequest {
  latitude: number;
  longitude: number;
  accuracy?: number;
}

export interface QuestDiscoverParams {
  city?: string;
  latitude: number;
  longitude: number;
  radiusKm?: number;
  page?: number;
  size?: number;
}
