import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Text, Alert, Linking } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { CameraView } from '../components/CameraView';
import CameraService, { CapturedMedia } from '../services/camera/CameraService';
import { RootStackParamList } from '../navigation/AppNavigator';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

type CameraScreenRouteProp = RouteProp<RootStackParamList, 'CameraScreen'>;
type CameraScreenNavigationProp = NativeStackNavigationProp<RootStackParamList>;

const CameraScreen: React.FC = () => {
  const navigation = useNavigation<CameraScreenNavigationProp>();
  const route = useRoute<CameraScreenRouteProp>();
  const { mode, maxDuration, onCapture } = route.params;
  
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);

  useEffect(() => {
    checkPermissions();
  }, []);

  const checkPermissions = async () => {
    const cameraStatus = await CameraService.requestCameraPermission();
    let microphoneStatus: 'granted' | 'denied' = 'granted';
    
    if (mode === 'video') {
      microphoneStatus = await CameraService.requestMicrophonePermission();
    }

    if (cameraStatus === 'granted' && microphoneStatus === 'granted') {
      setHasPermission(true);
    } else {
      setHasPermission(false);
      Alert.alert(
        'Permission Required',
        'Camera and Microphone permissions are required to use this feature.',
        [
          { text: 'Cancel', style: 'cancel', onPress: () => navigation.goBack() },
          { text: 'Settings', onPress: () => Linking.openSettings() }
        ]
      );
    }
  };

  const handlePhotoCapture = (photo: CapturedMedia) => {
    if (onCapture) {
      onCapture(photo);
    }
    navigation.goBack();
  };

  const handleVideoCapture = (video: CapturedMedia) => {
    if (onCapture) {
      onCapture(video);
    }
    navigation.goBack();
  };

  const handleError = (error: Error) => {
    Alert.alert('Camera Error', error.message);
    navigation.goBack();
  };

  if (hasPermission === null) {
    return <View style={styles.container}><Text style={styles.text}>Checking permissions...</Text></View>;
  }

  if (hasPermission === false) {
    return <View style={styles.container}><Text style={styles.text}>No camera access</Text></View>;
  }

  return (
    <View style={styles.container}>
      <CameraView
        mode={mode}
        maxVideoDuration={maxDuration}
        onPhotoCapture={handlePhotoCapture}
        onVideoCapture={handleVideoCapture}
        onError={handleError}
        onClose={() => navigation.goBack()}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    color: '#fff',
    fontSize: 16,
  }
});

export default CameraScreen;
