// src/entities/verification/index.ts
export type {
    VerificationMethod,
    LocationData,
    CameraResult,
    VerificationState,
    VerificationResult,
    PermissionStatus,
    VerificationConfig,
} from './model/types';

export { verificationSlice, verificationActions } from './model/slice';
export { verificationSelectors } from './model/selectors';

export {
    requestCameraPermission,
    requestLocationPermission,
    requestMicrophonePermission,
    capturePhoto,
    getCurrentLocation,
    verifyChallenge,
} from './lib/verificationService';

export {
    checkPermissionStatus,
    requestAllPermissions,
    openAppSettings,
} from './lib/permissionService';

export {
    formatLocationData,
    formatVerificationResult,
    validateVerificationData,
} from './lib/utils';