// src/screens/HomeScreen.tsx - COMPLETE FINAL VERSION
import React from 'react';
import {ActivityIndicator, FlatList, SafeAreaView, Text, TouchableOpacity, View} from 'react-native';
import {useDispatch, useSelector} from 'react-redux';
import {CompositeNavigationProp, useNavigation} from '@react-navigation/native';
import {useTranslation} from 'react-i18next';
import {RootState} from "../app/providers/StoreProvider/store.ts";
import {logout} from "../entities/AuthState/model/slice/authSlice.ts";
import {BottomTabNavigationProp} from "@react-navigation/bottom-tabs";
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {MainTabParamList, RootStackParamList} from "../navigation/AppNavigator.tsx";
import {useGetChallengesQuery} from "../entities/ChallengeState/model/slice/challengeApi";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import QuizChallengeCard from "../entities/ChallengeState/ui/QuizChallengeCard.tsx";
import KeychainService from "../services/auth/KeychainService.ts";
import {useAppStyles} from '../shared/ui/hooks/useAppStyles';
import {createStyles} from '../shared/ui/theme';
import {ScreenTimeCountdown} from '../features/ScreenTime/ui/ScreenTimeCountdown';

// Correct navigation type for a screen inside bottom tabs
type HomeScreenNavigationProp = CompositeNavigationProp<
    BottomTabNavigationProp<MainTabParamList, 'Home'>,
    NativeStackNavigationProp<RootStackParamList>
>;

const HomeScreen: React.FC = () => {
    const { t } = useTranslation();
    const dispatch = useDispatch();
    const navigation = useNavigation<HomeScreenNavigationProp>();
    const {screen, theme} = useAppStyles();
    const styles = themeStyles;

    // Read the current authenticated user from your Redux store
    const {user} = useSelector((state: RootState) => state.auth);

    // Sample RTK Query hook to fetch recent challenges
    const {data: recentChallenges, error, isLoading} = useGetChallengesQuery({
        participant_id: user?.id,
    });

    // Query for quiz challenges specifically
    const {data: quizChallenges, isLoading: loadingQuizzes} = useGetChallengesQuery({
        type: 'QUIZ',
        limit: 5
    });

    // Filter for WWW quizzes with proper type checking
    const wwwQuizzes = React.useMemo(() => {
        if (!quizChallenges) return [];

        return quizChallenges.filter(challenge => {
            try {
                if (!challenge.quizConfig) return false;
                const config = JSON.parse(challenge.quizConfig);
                return config && config.gameType === 'WWW';
            } catch (error) {
                console.error('Error parsing quiz config:', error);
                return false;
            }
        });
    }, [quizChallenges]);

    // Define the menu item type to reference tab screens
    type MenuItem = {
        id: string;
        title: string;
        icon: string;
        screen: keyof MainTabParamList;
    };

    const menuItems: MenuItem[] = [
        {id: '1', title: t('navigation.challenges'), icon: 'trophy', screen: 'Challenges'},
        {id: '2', title: t('navigation.search'), icon: 'magnify', screen: 'Search'},
        {id: '3', title: t('navigation.groups'), icon: 'account-group', screen: 'Groups'},
        {id: '4', title: t('navigation.profile'), icon: 'account', screen: 'Profile'},
    ];

    const handleLogout = async () => {
        try {
            await KeychainService.deleteAuthTokens()
            dispatch(logout());
        } catch (error) {
            console.error('Error during logout:', error);
        }
    };

    const navigateToScreen = (screen: keyof MainTabParamList) => {
        navigation.navigate('Main', { screen });
    };

    const handleChallengePress = (challengeId: string) => {
        navigation.navigate('ChallengeDetails', {challengeId});
    };

    // Direct navigation to unified quiz creation screen
    const handleCreateWWWQuiz = () => {
        navigation.navigate('CreateWWWQuest');
    };

    if (isLoading || loadingQuizzes) {
        return (
            <SafeAreaView style={screen.container}>
                <ActivityIndicator size="large" color={theme.colors.primary.main}/>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={screen.container}>
            {/* Header */}
            <View style={styles.header}>
                <View style={{ flex: 1 }}>
                    <Text style={styles.greeting}>
                        {t('home.greeting')}, {user?.username || 'User'}! 👋
                    </Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <ScreenTimeCountdown compact onPress={() => navigation.navigate('UserProfile', { userId: user?.id || '' })} />
                    <TouchableOpacity onPress={handleLogout} style={{ marginLeft: 16 }}>
                        <MaterialCommunityIcons name="logout" size={24} color={theme.colors.text.primary}/>
                    </TouchableOpacity>
                </View>
            </View>

            <FlatList
                data={[1]}
                renderItem={() => (
                    <View>
                        {/* Quick Actions Section */}
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>{t('home.quickActions')}</Text>
                            <View style={styles.quickActionsGrid}>
                                <TouchableOpacity
                                    style={styles.quickActionCard}
                                    onPress={handleCreateWWWQuiz}
                                >
                                    <MaterialCommunityIcons name="head-question" size={32} color={theme.colors.success.main}/>
                                    <Text style={styles.quickActionText}>{t('home.createQuiz')}</Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={styles.quickActionCard}
                                    onPress={() => navigation.navigate('CreateChallenge')}
                                >
                                    <MaterialCommunityIcons name="trophy-variant" size={32} color={theme.colors.warning.main}/>
                                    <Text style={styles.quickActionText}>{t('home.newChallenge')}</Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={styles.quickActionCard}
                                    onPress={() => navigation.navigate('JoinRoom')}
                                >
                                    <MaterialCommunityIcons name="account-group" size={32} color={theme.colors.info.main}/>
                                    <Text style={styles.quickActionText}>MULTIPLAYER</Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={styles.quickActionCard}
                                    onPress={() => navigation.navigate('Search')}
                                >
                                    <MaterialCommunityIcons name="magnify" size={32} color={theme.colors.secondary.main}/>
                                    <Text style={styles.quickActionText}>{t('home.findChallenges')}</Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={styles.quickActionCard}
                                    onPress={() => navigation.navigate('Profile')}
                                >
                                    <MaterialCommunityIcons name="account" size={32} color={theme.colors.accent.main}/>
                                    <Text style={styles.quickActionText}>{t('home.myProfile')}</Text>
                                </TouchableOpacity>
                            </View>
                        </View>

                        {/* WWW Quiz Challenges Section */}
                        {wwwQuizzes.length > 0 && (
                            <View style={styles.section}>
                                <View style={styles.sectionHeader}>
                                    <Text style={styles.sectionTitle}>{t('home.wwwQuizChallenges')}</Text>
                                    <TouchableOpacity
                                        onPress={() => navigation.navigate('Main', { screen: 'Challenges', params: { initialFilter: 'WWW_QUIZ' } })}
                                    >
                                        <Text style={styles.seeAllText}>{t('home.seeAll')}</Text>
                                    </TouchableOpacity>
                                </View>
                                {wwwQuizzes.slice(0, 3).map((challenge) => (
                                    <QuizChallengeCard
                                        key={challenge.id}
                                        challenge={challenge}
                                        onPress={() => handleChallengePress(challenge.id!.toString())}
                                    />
                                ))}
                            </View>
                        )}

                        {/* Main Menu Grid */}
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>{t('home.explore')}</Text>
                            <View style={styles.menuGrid}>
                                {menuItems.map((item) => (
                                    <TouchableOpacity
                                        key={item.id}
                                        style={styles.menuCard}
                                        onPress={() => navigateToScreen(item.screen)}
                                    >
                                        <MaterialCommunityIcons
                                            name={item.icon}
                                            size={36}
                                            color={theme.colors.success.main}
                                        />
                                        <Text style={styles.menuText}>{item.title}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>
                    </View>
                )}
                keyExtractor={() => 'home'}
            />
        </SafeAreaView>
    );
};

const themeStyles = createStyles(theme => ({
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: theme.spacing.xl,
        backgroundColor: theme.colors.background.primary,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border.light,
    },
    greeting: {
        ...theme.typography.heading.h5,
        fontWeight: theme.typography.fontWeight.bold,
        color: theme.colors.text.primary,
    },
    section: {
        padding: theme.spacing.lg,
        marginBottom: theme.spacing.sm,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: theme.spacing.md,
    },
    sectionTitle: {
        ...theme.typography.heading.h6,
        fontWeight: theme.typography.fontWeight.bold,
        color: theme.colors.text.primary,
        marginBottom: theme.spacing.md,
    },
    seeAllText: {
        ...theme.typography.body.small,
        color: theme.colors.success.main,
        fontWeight: theme.typography.fontWeight.semibold,
    },
    quickActionsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: theme.spacing.md,
    },
    quickActionCard: {
        width: '47%',
        backgroundColor: theme.colors.background.primary,
        padding: theme.spacing.xl,
        borderRadius: theme.layout.borderRadius.md,
        alignItems: 'center',
        ...theme.shadows.small,
    },
    quickActionText: {
        marginTop: theme.spacing.sm,
        ...theme.typography.body.small,
        fontWeight: theme.typography.fontWeight.semibold,
        color: theme.colors.text.primary,
    },
    menuGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: theme.spacing.md,
    },
    menuCard: {
        width: '47%',
        backgroundColor: theme.colors.background.primary,
        padding: theme.spacing['2xl'],
        borderRadius: theme.layout.borderRadius.md,
        alignItems: 'center',
        ...theme.shadows.small,
    },
    menuText: {
        marginTop: theme.spacing.md,
        ...theme.typography.body.medium,
        fontWeight: theme.typography.fontWeight.semibold,
        color: theme.colors.text.primary,
    },
}));

export default HomeScreen;
