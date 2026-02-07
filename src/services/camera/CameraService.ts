import { Camera, CameraPermissionStatus } from 'react-native-vision-camera';
import { Platform, PermissionsAndroid } from 'react-native';

export interface CapturedMedia {
  uri: string;
  path: string;
  name: string;
  type: string;
  width?: number;
  height?: number;
  duration?: number;
  size?: number;
}

export class CameraService {
  /**
   * Request camera permission
   */
  static async requestCameraPermission(): Promise<'granted' | 'denied'> {
    console.log('📷 [CameraService] Requesting camera permission...');
    const status = await Camera.requestCameraPermission();
    console.log('📷 [CameraService] Camera permission status:', status);
    return status === 'granted' ? 'granted' : 'denied';
  }

  /**
   * Request microphone permission
   */
  static async requestMicrophonePermission(): Promise<'granted' | 'denied'> {
    console.log('📷 [CameraService] Requesting microphone permission...');
    const status = await Camera.requestMicrophonePermission();
    console.log('📷 [CameraService] Microphone permission status:', status);
    return status === 'granted' ? 'granted' : 'denied';
  }

  /**
   * Get current camera permission status
   */
  static getCameraPermissionStatus(): CameraPermissionStatus {
    return Camera.getCameraPermissionStatus();
  }

  /**
   * Get current microphone permission status
   */
  static getMicrophonePermissionStatus(): CameraPermissionStatus {
    return Camera.getMicrophonePermissionStatus();
  }

  /**
   * Check if camera is available
   */
  static async checkCameraAvailability(): Promise<boolean> {
    const status = this.getCameraPermissionStatus();
    if (status === 'granted') return true;
    if (status === 'not-determined') {
      const result = await this.requestCameraPermission();
      return result === 'granted';
    }
    return false;
  }

  /**
   * Generate a unique file name for captured media
   */
  static generateFileName(type: 'photo' | 'video'): string {
    const timestamp = new Date().getTime();
    const extension = type === 'photo' ? 'jpg' : 'mp4';
    return `${type}_${timestamp}.${extension}`;
  }

  /**
   * Get MIME type for file extension
   */
  static getMimeType(path: string): string {
    const extension = path.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'jpg':
      case 'jpeg':
        return 'image/jpeg';
      case 'png':
        return 'image/png';
      case 'mp4':
        return 'video/mp4';
      case 'mov':
        return 'video/quicktime';
      default:
        return 'application/octet-stream';
    }
  }
}

export default CameraService;
