import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View, SafeAreaView } from 'react-native';
import QRCodeScanner from 'react-native-qrcode-scanner';
import { RNCamera } from 'react-native-camera';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { parseJoinUrl } from '../features/MultiplayerRoom/utils/parseJoinUrl';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

type QRScannerNavigationProp = NativeStackNavigationProp<RootStackParamList>;

const QRScannerScreen: React.FC = () => {
    const navigation = useNavigation<QRScannerNavigationProp>();
    const [flashlight, setFlashlight] = useState(false);

    const onSuccess = (e: any) => {
        const roomCode = parseJoinUrl(e.data);
        if (roomCode) {
            navigation.navigate('ControllerLobby', { roomCode });
        } else {
            // Invalid QR code
            alert('Invalid QR Code. Please scan a room join code.');
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <MaterialCommunityIcons name="close" size={30} color="#fff" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Scan QR Code</Text>
                <TouchableOpacity onPress={() => setFlashlight(!flashlight)}>
                    <MaterialCommunityIcons 
                        name={flashlight ? "flash" : "flash-off"} 
                        size={30} 
                        color="#fff" 
                    />
                </TouchableOpacity>
            </View>

            <QRCodeScanner
                onRead={onSuccess}
                flashMode={flashlight ? RNCamera.Constants.FlashMode.torch : RNCamera.Constants.FlashMode.off}
                topContent={
                    <Text style={styles.centerText}>
                        Point your camera at the QR code on the TV
                    </Text>
                }
                containerStyle={styles.scannerContainer}
                cameraStyle={styles.camera}
                showMarker={true}
                markerStyle={styles.marker}
            />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        zIndex: 10,
    },
    headerTitle: {
        color: '#fff',
        fontSize: 20,
        fontWeight: 'bold',
    },
    scannerContainer: {
        flex: 1,
    },
    camera: {
        height: '100%',
    },
    centerText: {
        fontSize: 18,
        padding: 32,
        color: '#fff',
        textAlign: 'center',
    },
    marker: {
        borderColor: '#e94560',
        borderRadius: 20,
        borderWidth: 4,
    }
});

export default QRScannerScreen;
