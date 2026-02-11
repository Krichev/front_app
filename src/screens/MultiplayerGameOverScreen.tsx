import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, FlatList } from 'react-native';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { useMultiplayerRoomService } from '../features/MultiplayerRoom/services/MultiplayerRoomService';
import { useSelector } from 'react-redux';
import { RootState } from '../app/providers/StoreProvider/store';

type GameOverRouteProp = RouteProp<RootStackParamList, 'MultiplayerGameOver'>;
type GameOverNavigationProp = NativeStackNavigationProp<RootStackParamList>;

const MultiplayerGameOverScreen: React.FC = () => {
    const route = useRoute<GameOverRouteProp>();
    const navigation = useNavigation<GameOverNavigationProp>();
    const { roomCode } = route.params;
    const user = useSelector((state: RootState) => state.auth.user);

    const { players } = useMultiplayerRoomService(roomCode);
    const sortedPlayers = [...players].sort((a, b) => b.score - a.score);
    const myRank = sortedPlayers.findIndex(p => p.userId.toString() === user?.id) + 1;
    const me = players.find(p => p.userId.toString() === user?.id);

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.content}>
                <Text style={styles.title}>Game Over!</Text>
                
                <View style={styles.rankContainer}>
                    <Text style={styles.rankLabel}>YOUR RANK</Text>
                    <Text style={styles.rankValue}>#{myRank}</Text>
                    <Text style={styles.scoreValue}>{me?.score || 0} pts</Text>
                </View>

                <View style={styles.leaderboard}>
                    <Text style={styles.leaderboardTitle}>Leaderboard</Text>
                    <FlatList
                        data={sortedPlayers}
                        keyExtractor={(item) => item.userId.toString()}
                        renderItem={({ item, index }) => (
                            <View style={[styles.playerItem, item.userId.toString() === user?.id && styles.myPlayerItem]}>
                                <Text style={styles.playerRank}>{index + 1}</Text>
                                <Text style={styles.playerName}>{item.username}</Text>
                                <Text style={styles.playerScore}>{item.score}</Text>
                            </View>
                        )}
                    />
                </View>

                <TouchableOpacity 
                    style={styles.homeButton}
                    onPress={() => navigation.navigate('Main', { screen: 'Home' })}
                >
                    <Text style={styles.homeButtonText}>RETURN HOME</Text>
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
    content: {
        flex: 1,
        padding: 24,
        alignItems: 'center',
    },
    title: {
        fontSize: 48,
        fontWeight: 'bold',
        color: '#e94560',
        marginTop: 40,
        marginBottom: 24,
    },
    rankContainer: {
        backgroundColor: '#16213e',
        width: '100%',
        padding: 32,
        borderRadius: 20,
        alignItems: 'center',
        marginBottom: 32,
        borderWidth: 2,
        borderColor: '#0f3460',
    },
    rankLabel: {
        color: '#ccc',
        fontSize: 18,
        fontWeight: 'bold',
        letterSpacing: 2,
    },
    rankValue: {
        color: '#fff',
        fontSize: 80,
        fontWeight: '900',
    },
    scoreValue: {
        color: '#e94560',
        fontSize: 24,
        fontWeight: 'bold',
    },
    leaderboard: {
        flex: 1,
        width: '100%',
    },
    leaderboardTitle: {
        color: '#fff',
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 16,
    },
    playerItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#16213e',
        padding: 16,
        borderRadius: 12,
        marginBottom: 8,
    },
    myPlayerItem: {
        borderColor: '#e94560',
        borderWidth: 1,
    },
    playerRank: {
        color: '#ccc',
        fontSize: 18,
        fontWeight: 'bold',
        width: 30,
    },
    playerName: {
        color: '#fff',
        fontSize: 18,
        flex: 1,
    },
    playerScore: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
    homeButton: {
        width: '100%',
        backgroundColor: '#0f3460',
        padding: 20,
        borderRadius: 12,
        alignItems: 'center',
        marginTop: 24,
    },
    homeButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    }
});

export default MultiplayerGameOverScreen;
