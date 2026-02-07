import React, { useRef, useState, useEffect } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { 
  Camera, 
  useCameraDevice, 
  useCameraFormat, 
  PhotoFile, 
  VideoFile,
  CameraPermissionStatus
} from 'react-native-vision-camera';
import { useAppState } from '@react-native-community/hooks';
import styles from './CameraView.styles';
import { CameraControls } from './CameraControls';
import { CapturedMedia } from '../../services/camera/CameraService';

export interface CameraViewProps {
  mode: 'photo' | 'video';
  cameraPosition?: 'front' | 'back';
  enableFlash?: boolean;
  maxVideoDuration?: number; // seconds
  onPhotoCapture?: (photo: CapturedMedia) => void;
  onVideoCapture?: (video: CapturedMedia) => void;
  onError?: (error: Error) => void;
  onClose?: () => void;
}

const CameraView: React.FC<CameraViewProps> = ({
  mode,
  cameraPosition = 'back',
  enableFlash = false,
  maxVideoDuration = 300,
  onPhotoCapture,
  onVideoCapture,
  onError,
  onClose,
}) => {
  const camera = useRef<Camera>(null);
  const appState = useAppState();
  const [position, setPosition] = useState<'front' | 'back'>(cameraPosition);
  const [flash, setFlash] = useState<'on' | 'off'>(enableFlash ? 'on' : 'off');
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  
  const device = useCameraDevice(position);
  const format = useCameraFormat(device, [
    { videoResolution: { width: 1280, height: 720 } },
    { fps: 30 }
  ]);

  const isActive = appState === 'active';

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRecording) {
      interval = setInterval(() => {
        setRecordingDuration((prev) => {
          if (prev >= maxVideoDuration) {
            stopRecording();
            return prev;
          }
          return prev + 1;
        });
      }, 1000);
    } else {
      setRecordingDuration(0);
    }
    return () => clearInterval(interval);
  }, [isRecording]);

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const takePhoto = async () => {
    try {
      if (camera.current) {
        const photo = await camera.current.takePhoto({
          flash: flash,
          enableShutterSound: true,
        });
        
        onPhotoCapture?.({
          uri: `file://${photo.path}`,
          path: photo.path,
          name: photo.path.split('/').pop() || 'photo.jpg',
          type: 'image/jpeg',
          width: photo.width,
          height: photo.height,
        });
      }
    } catch (e) {
      console.error('📷 [CameraView] Photo capture error:', e);
      onError?.(e as Error);
    }
  };

  const startRecording = async () => {
    try {
      if (camera.current) {
        setIsRecording(true);
        camera.current.startRecording({
          flash: flash,
          onRecordingFinished: (video) => {
            setIsRecording(false);
            onVideoCapture?.({
              uri: `file://${video.path}`,
              path: video.path,
              name: video.path.split('/').pop() || 'video.mp4',
              type: 'video/mp4',
              duration: video.duration,
              size: 0, // vision-camera v4 doesn't provide size here directly
            });
          },
          onRecordingError: (error) => {
            setIsRecording(false);
            console.error('📷 [CameraView] Recording error:', error);
            onError?.(error);
          },
        });
      }
    } catch (e) {
      setIsRecording(false);
      console.error('📷 [CameraView] Start recording error:', e);
      onError?.(e as Error);
    }
  };

  const stopRecording = async () => {
    try {
      if (camera.current) {
        await camera.current.stopRecording();
      }
    } catch (e) {
      console.error('📷 [CameraView] Stop recording error:', e);
    }
  };

  const handleCapture = () => {
    if (mode === 'photo') {
      takePhoto();
    } else {
      if (isRecording) {
        stopRecording();
      } else {
        startRecording();
      }
    }
  };

  const toggleFlip = () => {
    setPosition((p) => (p === 'back' ? 'front' : 'back'));
  };

  const toggleFlash = () => {
    setFlash((f) => (f === 'on' ? 'off' : 'on'));
  };

  if (device == null) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>No camera device found</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Camera
        ref={camera}
        style={StyleSheet.absoluteFill}
        device={device}
        format={format}
        isActive={isActive}
        photo={mode === 'photo'}
        video={mode === 'video'}
        audio={mode === 'video'}
      />
      
      <CameraControls
        mode={mode}
        isRecording={isRecording}
        flash={flash}
        onCapture={handleCapture}
        onFlip={toggleFlip}
        onFlashToggle={toggleFlash}
        onClose={onClose || (() => {})}
        timer={formatTimer(recordingDuration)}
      />
    </View>
  );
};

export default CameraView;
