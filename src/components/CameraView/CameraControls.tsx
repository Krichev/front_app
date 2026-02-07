import React from 'react';
import { View, TouchableOpacity, Text } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import styles from './CameraView.styles';

interface CameraControlsProps {
  mode: 'photo' | 'video';
  isRecording: boolean;
  flash: 'on' | 'off';
  onCapture: () => void;
  onFlip: () => void;
  onFlashToggle: () => void;
  onClose: () => void;
  timer?: string;
}

export const CameraControls: React.FC<CameraControlsProps> = ({
  mode,
  isRecording,
  flash,
  onCapture,
  onFlip,
  onFlashToggle,
  onClose,
  timer,
}) => {
  return (
    <View style={styles.overlay}>
      <View style={styles.topControls}>
        <TouchableOpacity style={styles.iconButton} onPress={onClose}>
          <MaterialCommunityIcons name="close" size={30} color="#fff" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.iconButton} onPress={onFlashToggle}>
          <MaterialCommunityIcons 
            name={flash === 'on' ? "flash" : "flash-off"} 
            size={30} 
            color="#fff" 
          />
        </TouchableOpacity>
      </View>

      <View style={styles.bottomControls}>
        {isRecording && timer && (
          <View style={styles.timerContainer}>
            <Text style={styles.timerText}>{timer}</Text>
          </View>
        )}

        <View style={styles.captureRow}>
          <View style={{ width: 50 }} /> {/* Spacer */}

          <TouchableOpacity 
            style={styles.captureButton} 
            onPress={onCapture}
            activeOpacity={0.8}
          >
            <View style={[
              mode === 'photo' ? styles.captureButtonInner : styles.captureButtonVideoInner,
              isRecording && styles.captureButtonRecording
            ]} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.iconButton} onPress={onFlip}>
            <MaterialCommunityIcons name="camera-flip" size={30} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};
