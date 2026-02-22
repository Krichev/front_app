// Fixed src/screens/GamesHomeScreen.tsx with corrected navigation calls
import React from 'react';
import {Alert, Image, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View,} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {useSelector} from 'react-redux';
import {useTranslation} from 'react-i18next';
import {RootState} from '../app/providers/StoreProvider/store';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import {RootStackParamList} from '../navigation/AppNavigator';

// Define navigation parameter type
type GamesHomeScreenNavigationProp = NativeStackNavigationProp<RootStackParamList>;

const GamesHomeScreen: React.FC = () => {
    const navigation = useNavigation<GamesHomeScreenNavigationProp>();
    const { user } = useSelector((state: RootState) => state.auth);
    const { t } = useTranslation();

    // Game options to display
    const gameOptions = [
        {
            id: 'www',
            title: t('games.www.title'),
            description: t('games.www.description'),
            icon: 'brain',
            color: '#4CAF50',
            onPress: () => navigation.navigate('CreateWWWQuest'),
        },
        {
            id: 'vibration-quiz',
            title: t('games.vibration.title'),
            description: t('games.vibration.description'),
            icon: 'vibrate',
            color: '#9C27B0',
            onPress: () => navigation.navigate('VibrationQuiz', {}),
        },
        {
            id: 'rhythm',
            title: t('games.rhythm.title'),
            description: t('games.rhythm.description'),
            icon: 'music-note',
            color: '#2196F3',
            onPress: () =>  Alert.alert(t('games.comingSoonAlert')),
            comingSoon: true,
        },
        {
            id: 'quiz',
            title: t('games.quiz.title'),
            description: t('games.quiz.description'),
            icon: 'help-circle',
            color: '#FF9800',
            onPress: () =>  Alert.alert(t('games.comingSoonAlert')),
            comingSoon: true,
        },
    ];

    // Admin options
    const adminOptions = [
        {
            id: 'question-management',
            title: t('games.questionManagement.title'),
            description: t('games.questionManagement.description'),
            icon: 'playlist-edit',
            color: '#673AB7',
            onPress: () => navigation.navigate('QuestionManagement'),
        }
    ];

    // Render a game card for each option
    const renderGameCard = (game: any) => (
        <TouchableOpacity
            key={game.id}
            style={[styles.gameCard, game.comingSoon && styles.comingSoonCard]}
            onPress={game.onPress}
            disabled={game.comingSoon}
        >
            <View style={[styles.iconContainer, { backgroundColor: game.color }]}>
                <MaterialCommunityIcons name={game.icon} size={36} color="white" />
            </View>
            <View style={styles.gameInfo}>
                <Text style={styles.gameTitle}>{game.title}</Text>
                <Text style={styles.gameDescription}>{game.description}</Text>
                {game.comingSoon && (
                    <View style={styles.comingSoonTag}>
                        <Text style={styles.comingSoonText}>{t('games.comingSoon')}</Text>
                    </View>
                )}
            </View>
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>{t('games.title')}</Text>
                    <Text style={styles.headerSubtitle}>{t('games.subtitle')}</Text>
                </View>

                <View style={styles.gamesContainer}>
                    {gameOptions.map(renderGameCard)}
                </View>

                {/* Featured Game */}
                <View style={styles.featuredGameSection}>
                    <Text style={styles.sectionTitle}>{t('games.featuredGame')}</Text>
                    <TouchableOpacity
                        style={styles.featuredGameCard}
                        onPress={() => navigation.navigate('CreateWWWQuest')}
                    >
                        <Image
                            source={require('../../assets/www-game-banner.png')}
                            style={styles.featuredImage}
                            defaultSource={require('../../assets/www-game-banner.png')}
                        />
                        <View style={styles.featuredOverlay}>
                            <Text style={styles.featuredTitle}>{t('games.www.title')}</Text>
                            <Text style={styles.featuredDescription}>
                                {t('games.www.featuredDescription')}
                            </Text>
                            <View style={styles.playButtonContainer}>
                                <TouchableOpacity
                                    style={styles.playButton}
                                    onPress={() => navigation.navigate('CreateWWWQuest')}
                                >
                                    <Text style={styles.playButtonText}>{t('games.playNow')}</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </TouchableOpacity>
                </View>

                {/* Admin Tools Section */}
                <View style={styles.adminSection}>
                    <View style={styles.adminHeaderRow}>
                        <Text style={styles.sectionTitle}>{t('games.adminTools.title')}</Text>
                        <TouchableOpacity
                            style={styles.infoButton}
                            onPress={() => Alert.alert(
                                t('games.adminTools.title'),
                                t('games.adminTools.description')
                            )}
                        >
                            <MaterialCommunityIcons name="information-outline" size={20} color="#666" />
                        </TouchableOpacity>
                    </View>

                    {adminOptions.map(renderGameCard)}
                </View>

                {/* Recent Activity */}
                <View style={styles.recentActivitySection}>
                    <Text style={styles.sectionTitle}>{t('games.recentActivity.title')}</Text>
                    {/* Display a message when no activity is available */}
                    <View style={styles.emptyStateContainer}>
                        <MaterialCommunityIcons name="gamepad-variant" size={60} color="#e0e0e0" />
                        <Text style={styles.emptyStateText}>
                            {t('games.recentActivity.noActivity')}
                        </Text>
                    </View>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    // Styles remain unchanged
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    scrollContent: {
        padding: 16,
    },
    header: {
        marginBottom: 24,
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#333',
    },
    headerSubtitle: {
        fontSize: 16,
        color: '#666',
        marginTop: 4,
    },
    gamesContainer: {
        marginBottom: 32,
    },
    gameCard: {
        flexDirection: 'row',
        backgroundColor: 'white',
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    comingSoonCard: {
        opacity: 0.7,
    },
    iconContainer: {
        width: 70,
        height: 70,
        borderRadius: 35,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    gameInfo: {
        flex: 1,
        justifyContent: 'center',
    },
    gameTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 6,
    },
    gameDescription: {
        fontSize: 14,
        color: '#666',
        lineHeight: 20,
    },
    comingSoonTag: {
        backgroundColor: '#FF9800',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
        alignSelf: 'flex-start',
        marginTop: 8,
    },
    comingSoonText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 10,
    },
    featuredGameSection: {
        marginBottom: 32,
    },
    adminSection: {
        marginBottom: 32,
    },
    adminHeaderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    infoButton: {
        padding: 4,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 0,
    },
    featuredGameCard: {
        borderRadius: 12,
        overflow: 'hidden',
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 6,
    },
    featuredImage: {
        width: '100%',
        height: 200,
        resizeMode: 'cover',
        backgroundColor: '#4CAF50', // Fallback color
    },
    featuredOverlay: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        padding: 16,
    },
    featuredTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: 'white',
        marginBottom: 4,
    },
    featuredDescription: {
        fontSize: 14,
        color: 'rgba(255, 255, 255, 0.8)',
        marginBottom: 12,
    },
    playButtonContainer: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
    },
    playButton: {
        backgroundColor: '#4CAF50',
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 20,
    },
    playButtonText: {
        color: 'white',
        fontWeight: 'bold',
    },
    recentActivitySection: {
        marginBottom: 32,
    },
    emptyStateContainer: {
        backgroundColor: 'white',
        borderRadius: 12,
        padding: 24,
        alignItems: 'center',
        justifyContent: 'center',
    },
    emptyStateText: {
        textAlign: 'center',
        color: '#888',
        marginTop: 16,
        fontSize: 16,
        lineHeight: 24,
    },
});

export default GamesHomeScreen;