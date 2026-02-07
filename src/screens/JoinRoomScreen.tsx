import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, SafeAreaView, KeyboardAvoidingView, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';

type JoinRoomNavigationProp = NativeStackNavigationProp<RootStackParamList>;

const JoinRoomScreen: React.FC = () => {
    const navigation = useNavigation<JoinRoomNavigationProp>();
    const [roomCode, setRoomCode] = useState('');

    const handleJoin = () => {
        if (roomCode.length === 6) {
            navigation.navigate('ControllerLobby', { roomCode: roomCode.toUpperCase() });
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView 
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.content}
            >
                <Text style={styles.title}>Join Room</Text>
                <Text style={styles.subtitle}>Enter the 6-character code shown on the TV</Text>
                
                <TextInput
                    style={styles.input}
                    placeholder="ABC123"
                    placeholderTextColor="#666"
                    value={roomCode}
                    onChangeText={(text) => setRoomCode(text.toUpperCase())}
                    maxLength={6}
                    autoCapitalize="characters"
                    autoCorrect={false}
                />

                <TouchableOpacity 
                    style={[styles.button, roomCode.length !== 6 && styles.buttonDisabled]}
                    onPress={handleJoin}
                    disabled={roomCode.length !== 6}
                >
                    <Text style={styles.buttonText}>JOIN GAME</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                    style={styles.scanButton}
                    onPress={() => navigation.navigate('QRScanner')}
                >
                    <Text style={styles.scanButtonText}>SCAN QR CODE</Text>
                </TouchableOpacity>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#1a1a2e',
    },
    content: {
        flex: 1,
        padding: 24,
        alignItems: 'center',
        justifyContent: 'center',
    },
    title: {
        fontSize: 42,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 18,
        color: '#ccc',
        textAlign: 'center',
        marginBottom: 40,
    },
    input: {
        width: '100%',
        backgroundColor: '#16213e',
        borderRadius: 12,
        padding: 20,
        fontSize: 32,
        color: '#fff',
        textAlign: 'center',
        letterSpacing: 8,
        borderWidth: 2,
        borderColor: '#0f3460',
        marginBottom: 24,
    },
    button: {
        width: '100%',
        backgroundColor: '#e94560',
        padding: 20,
        borderRadius: 12,
        alignItems: 'center',
        marginBottom: 16,
    },
    buttonDisabled: {
        opacity: 0.5,
    },
    buttonText: {
        color: '#fff',
        fontSize: 20,
        fontWeight: 'bold',
    },
    scanButton: {
        padding: 16,
    },
    scanButtonText: {
        color: '#e94560',
        fontSize: 18,
    }
});

export default JoinRoomScreen;
