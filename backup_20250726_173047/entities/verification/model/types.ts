// src/entities/verification/model/types.ts
export type VerificationMethod =
    | 'photo'
    | 'location'
    | 'audio'
    | 'video'
    | 'manual'
    | 'qr_code'
    | 'biometric';

export interface LocationData {
    latitude: number;
    longitude: number;
    accuracy: number;
    altitude?: number;
    heading?: number;
    speed?: number;
    timestamp: number;
    address?: string;
}

export interface CameraResult {
    uri: string;
    type: string;
    fileName: string;
    fileSize: number;
    width?: number;
    height?: number;
    timestamp: number;
}

export type PermissionStatus = 'granted' | 'denied' | 'blocked' | 'limited' | 'unavailable';

export interface PermissionState {
    camera: PermissionStatus;
    location: PermissionStatus;
    microphone: PermissionStatus;
    storage: PermissionStatus;
}

export interface VerificationConfig {
    methods: VerificationMethod[];
    requiresLocation: boolean;
    requiresPhoto: boolean;
    locationAccuracy?: number;
    photoQuality?: number;
    allowManualVerification: boolean;
    timeoutMs?: number;
}

export interface VerificationResult {
    id: string;
    challengeId: string;
    method: VerificationMethod;
    success: boolean;
    data: any;
    feedback?: string;
    timestamp: number;
    location?: LocationData;
    photos?: CameraResult[];
    error?: string;
}

export interface VerificationState {
    isVerifying: boolean;
    currentMethod: VerificationMethod | null;
    results: VerificationResult[];
    permissions: PermissionState;
    error: string | null;
    config: VerificationConfig | null;
    progress: number;
}