import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, FlatList, TouchableOpacity } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { useMultiplayerRoomService } from '../features/MultiplayerRoom/services/MultiplayerRoomService';
import { GamePhase } from '../features/MultiplayerRoom/types';

type ControllerLobbyRouteProp = RouteProp<RootStackParamList, 'ControllerLobby'>;
type ControllerLobbyNavigationProp = NativeStackNavigationProp<RootStackParamList>;

const ControllerLobbyScreen: React.FC = () => {
    const route = useRoute<ControllerLobbyRouteProp>();
    const navigation = useNavigation<ControllerLobbyNavigationProp>();
    const { roomCode } = route.params;

    const { players, connectionStatus, gameState } = useMultiplayerRoomService(roomCode);

    // Navigate to game screen when phase changes
    React.useEffect(() => {
        if (gameState?.phase && gameState.phase !== GamePhase.LOBBY) {
            navigation.navigate('ControllerGame', { roomCode });
        }
    }, [gameState?.phase, navigation, roomCode]);

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.roomLabel}>ROOM CODE</Text>
                <Text style={styles.roomCode}>{roomCode}</Text>
            </View>

            <View style={styles.statusContainer}>
                <View style={[styles.statusIndicator, { backgroundColor: connectionStatus === 'CONNECTED' ? '#4CAF50' : '#FF9800' }]} />
                <Text style={styles.statusText}>{connectionStatus}</Text>
            </View>

            <View style={styles.playersList}>
                <Text style={styles.sectionTitle}>Players Joined ({players.length})</Text>
                <FlatList
                    data={players}
                    keyExtractor={(item) => item.userId.toString()}
                    renderItem={({ item }) => (
                        <View style={styles.playerItem}>
                            <View style={styles.avatarPlaceholder}>
                                <Text style={styles.avatarText}>{item.username.charAt(0).toUpperCase()}</Text>
                            </View>
                            <Text style={styles.playerName}>{item.username}</Text>
                            {item.connected && <View style={styles.connectedDot} />}
                        </View>
                    )}
                />
            </View>

            <View style={styles.footer}>
                <Text style={styles.waitingText}>Waiting for host to start...</Text>
                <TouchableOpacity 
                    style={styles.leaveButton}
                    onPress={() => navigation.navigate('Main', { screen: 'Home' })}
                >
                    <Text style={styles.leaveButtonText}>LEAVE ROOM</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#1a1a2e',
    },
    header: {
        alignItems: 'center',
        paddingVertical: 40,
        backgroundColor: '#16213e',
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30,
    },
    roomLabel: {
        color: '#ccc',
        fontSize: 18,
        letterSpacing: 2,
    },
    roomCode: {
        color: '#fff',
        fontSize: 64,
        fontWeight: '900',
        letterSpacing: 4,
    },
    statusContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: -15,
        backgroundColor: '#0f3460',
        alignSelf: 'center',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
    },
    statusIndicator: {
        width: 10,
        height: 10,
        borderRadius: 5,
        marginRight: 8,
    },
    statusText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: 'bold',
    },
    playersList: {
        flex: 1,
        padding: 24,
    },
    sectionTitle: {
        color: '#fff',
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 16,
    },
    playerItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#16213e',
        padding: 12,
        borderRadius: 12,
        marginBottom: 12,
    },
    avatarPlaceholder: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#e94560',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    avatarText: {
        color: '#fff',
        fontWeight: 'bold',
    },
    playerName: {
        color: '#fff',
        fontSize: 18,
        flex: 1,
    },
    connectedDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#4CAF50',
    },
    footer: {
        padding: 24,
        alignItems: 'center',
    },
    waitingText: {
        color: '#ccc',
        fontSize: 18,
        fontStyle: 'italic',
        marginBottom: 20,
    },
    leaveButton: {
        padding: 12,
    },
    leaveButtonText: {
        color: '#e94560',
        fontSize: 16,
        fontWeight: 'bold',
    }
});

export default ControllerLobbyScreen;
