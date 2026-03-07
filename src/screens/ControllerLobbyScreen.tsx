import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, FlatList, TouchableOpacity, TextInput, Alert, ActivityIndicator } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTranslation } from 'react-i18next';
import { RootStackParamList } from '../navigation/AppNavigator';
import { useMultiplayerRoomService } from '../features/MultiplayerRoom/services/MultiplayerRoomService';
import { GamePhase } from '../features/MultiplayerRoom/types';
import { useClaimTvDisplayMutation } from '../entities/TvDisplayState/model/slice/tvDisplayApi';
import { Modal } from '../shared/ui/Modal/Modal';

type ControllerLobbyRouteProp = RouteProp<RootStackParamList, 'ControllerLobby'>;
type ControllerLobbyNavigationProp = NativeStackNavigationProp<RootStackParamList>;

const ControllerLobbyScreen: React.FC = () => {
    const { t } = useTranslation();
    const route = useRoute<ControllerLobbyRouteProp>();
    const navigation = useNavigation<ControllerLobbyNavigationProp>();
    const { roomCode } = route.params;

    const { players, connectionStatus, gameState } = useMultiplayerRoomService(roomCode);
    const [claimTv, { isLoading: isClaiming }] = useClaimTvDisplayMutation();

    const [pairingModalVisible, setPairingModalVisible] = React.useState(false);
    const [pairingCode, setPairingCode] = React.useState('');
    const [claimError, setClaimError] = React.useState<string | null>(null);

    // Navigate to game screen when phase changes
    React.useEffect(() => {
        if (gameState?.phase && gameState.phase !== GamePhase.LOBBY) {
            navigation.navigate('ControllerGame', { roomCode });
        }
    }, [gameState?.phase, navigation, roomCode]);

    const handleClaimTv = async () => {
        if (pairingCode.length !== 6) return;
        
        setClaimError(null);
        try {
            await claimTv({ 
                pairingCode: pairingCode.toUpperCase(), 
                roomCode 
            }).unwrap();
            
            setPairingModalVisible(false);
            setPairingCode('');
            Alert.alert(t('common.success'), t('tvDisplay.connect.success'));
        } catch (err: any) {
            console.error('Failed to claim TV:', err);
            const errorMsg = err?.status === 410 
                ? t('tvDisplay.connect.error.expired') 
                : err?.status === 409
                ? t('tvDisplay.connect.error.alreadyClaimed')
                : t('tvDisplay.connect.error.invalid');
            setClaimError(errorMsg);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.roomLabel}>ROOM CODE</Text>
                <Text style={styles.roomCode}>{roomCode}</Text>
                
                <TouchableOpacity 
                    style={styles.connectTvButton}
                    onPress={() => setPairingModalVisible(true)}
                >
                    <MaterialCommunityIcons name="television" size={24} color="#fff" />
                    <Text style={styles.connectTvButtonText}>{t('tvDisplay.connect.title').toUpperCase()}</Text>
                </TouchableOpacity>
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

            <Modal
                isOpen={pairingModalVisible}
                onClose={() => {
                    setPairingModalVisible(false);
                    setPairingCode('');
                    setClaimError(null);
                }}
                title={t('tvDisplay.connect.title')}
            >
                <View style={styles.modalContent}>
                    <Text style={styles.modalInstruction}>
                        {t('tvDisplay.connect.instruction')}
                    </Text>
                    
                    <TextInput
                        style={styles.pairingInput}
                        value={pairingCode}
                        onChangeText={(text) => setPairingCode(text.toUpperCase())}
                        placeholder={t('tvDisplay.connect.placeholder')}
                        placeholderTextColor="#666"
                        maxLength={6}
                        autoCapitalize="characters"
                        autoCorrect={false}
                    />
                    
                    {claimError && <Text style={styles.errorText}>{claimError}</Text>}
                    
                    <TouchableOpacity 
                        style={[
                            styles.modalButton, 
                            (pairingCode.length !== 6 || isClaiming) && styles.modalButtonDisabled
                        ]}
                        onPress={handleClaimTv}
                        disabled={pairingCode.length !== 6 || isClaiming}
                    >
                        {isClaiming ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Text style={styles.modalButtonText}>{t('tvDisplay.connect.button').toUpperCase()}</Text>
                        )}
                    </TouchableOpacity>
                </View>
            </Modal>
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
        paddingVertical: 30,
        backgroundColor: '#16213e',
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30,
    },
    roomLabel: {
        color: '#ccc',
        fontSize: 14,
        letterSpacing: 2,
    },
    roomCode: {
        color: '#fff',
        fontSize: 54,
        fontWeight: '900',
        letterSpacing: 4,
        marginBottom: 10,
    },
    connectTvButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#0f3460',
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 25,
        borderWidth: 1,
        borderColor: '#e94560',
        gap: 8,
    },
    connectTvButtonText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: 'bold',
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
        zIndex: 1,
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
        fontSize: 22,
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
        fontSize: 16,
        fontStyle: 'italic',
        marginBottom: 15,
    },
    leaveButton: {
        padding: 12,
    },
    leaveButtonText: {
        color: '#e94560',
        fontSize: 16,
        fontWeight: 'bold',
    },
    modalContent: {
        padding: 20,
        alignItems: 'center',
    },
    modalInstruction: {
        color: '#333',
        fontSize: 16,
        textAlign: 'center',
        marginBottom: 20,
    },
    pairingInput: {
        width: '100%',
        backgroundColor: '#f5f5f5',
        borderRadius: 12,
        padding: 15,
        fontSize: 28,
        color: '#1a1a2e',
        textAlign: 'center',
        letterSpacing: 6,
        borderWidth: 1,
        borderColor: '#ddd',
        marginBottom: 20,
    },
    errorText: {
        color: '#e94560',
        fontSize: 14,
        marginBottom: 15,
        textAlign: 'center',
    },
    modalButton: {
        width: '100%',
        backgroundColor: '#e94560',
        padding: 15,
        borderRadius: 12,
        alignItems: 'center',
    },
    modalButtonDisabled: {
        opacity: 0.5,
    },
    modalButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    }
});

export default ControllerLobbyScreen;
