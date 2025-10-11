// src/screens/HomeScreen.tsx - COMPLETE FINAL VERSION
import React from 'react';
import {ActivityIndicator, FlatList, SafeAreaView, StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import {useDispatch, useSelector} from 'react-redux';
import {CompositeNavigationProp, useNavigation} from '@react-navigation/native';
import {RootState} from "../app/providers/StoreProvider/store.ts";
import {logout} from "../entities/AuthState/model/slice/authSlice.ts";
import {BottomTabNavigationProp} from "@react-navigation/bottom-tabs";
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {MainTabParamList, RootStackParamList} from "../navigation/AppNavigator.tsx";
import * as Keychain from "react-native-keychain";
import {useGetChallengesQuery} from "../entities/ChallengeState/model/slice/challengeApi";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import QuizChallengeCard from "../entities/ChallengeState/ui/QuizChallengeCard.tsx";

// Correct navigation type for a screen inside bottom tabs
type HomeScreenNavigationProp = CompositeNavigationProp<
    BottomTabNavigationProp<MainTabParamList, 'Home'>,
    NativeStackNavigationProp<RootStackParamList>
>;

const HomeScreen: React.FC = () => {
    const dispatch = useDispatch();
    const navigation = useNavigation<HomeScreenNavigationProp>();

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
        {id: '1', title: 'Challenges', icon: 'trophy', screen: 'Challenges'},
        {id: '2', title: 'Search', icon: 'magnify', screen: 'Search'},
        {id: '3', title: 'Groups', icon: 'account-group', screen: 'Groups'},
        {id: '4', title: 'My Profile', icon: 'account', screen: 'Profile'},
    ];

    const handleLogout = async () => {
        try {
            await Keychain.resetGenericPassword();
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
            <SafeAreaView style={styles.container}>
                <ActivityIndicator size="large" color="#4CAF50"/>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.greeting}>
                    Hello, {user?.username || 'User'}! 👋
                </Text>
                <TouchableOpacity onPress={handleLogout}>
                    <MaterialCommunityIcons name="logout" size={24} color="#333"/>
                </TouchableOpacity>
            </View>

            <FlatList
                data={[1]}
                renderItem={() => (
                    <View>
                        {/* Quick Actions Section */}
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Quick Actions</Text>
                            <View style={styles.quickActionsGrid}>
                                <TouchableOpacity
                                    style={styles.quickActionCard}
                                    onPress={handleCreateWWWQuiz}
                                >
                                    <MaterialCommunityIcons name="head-question" size={32} color="#4CAF50"/>
                                    <Text style={styles.quickActionText}>Create Quiz</Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={styles.quickActionCard}
                                    onPress={() => navigation.navigate('CreateChallenge')}
                                >
                                    <MaterialCommunityIcons name="trophy-variant" size={32} color="#FF9800"/>
                                    <Text style={styles.quickActionText}>New Challenge</Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={styles.quickActionCard}
                                    onPress={() => navigation.navigate('Search')}
                                >
                                    <MaterialCommunityIcons name="magnify" size={32} color="#2196F3"/>
                                    <Text style={styles.quickActionText}>Find Challenges</Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={styles.quickActionCard}
                                    onPress={() => navigation.navigate('Profile')}
                                >
                                    <MaterialCommunityIcons name="account" size={32} color="#9C27B0"/>
                                    <Text style={styles.quickActionText}>My Profile</Text>
                                </TouchableOpacity>
                            </View>
                        </View>

                        {/* WWW Quiz Challenges Section */}
                        {wwwQuizzes.length > 0 && (
                            <View style={styles.section}>
                                <View style={styles.sectionHeader}>
                                    <Text style={styles.sectionTitle}>WWW Quiz Challenges</Text>
                                    <TouchableOpacity
                                        onPress={() => navigation.navigate('Challenges', {initialFilter: 'WWW_QUIZ'})}
                                    >
                                        <Text style={styles.seeAllText}>See All →</Text>
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
                            <Text style={styles.sectionTitle}>Explore</Text>
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
                                            color="#4CAF50"
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

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        backgroundColor: 'white',
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
    },
    greeting: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#333',
    },
    section: {
        padding: 16,
        marginBottom: 8,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 12,
    },
    seeAllText: {
        fontSize: 14,
        color: '#4CAF50',
        fontWeight: '600',
    },
    quickActionsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },
    quickActionCard: {
        width: '47%',
        backgroundColor: 'white',
        padding: 20,
        borderRadius: 12,
        alignItems: 'center',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: {width: 0, height: 2},
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    quickActionText: {
        marginTop: 8,
        fontSize: 14,
        fontWeight: '600',
        color: '#333',
    },
    menuGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },
    menuCard: {
        width: '47%',
        backgroundColor: 'white',
        padding: 24,
        borderRadius: 12,
        alignItems: 'center',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: {width: 0, height: 2},
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    menuText: {
        marginTop: 12,
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
    },
});

export default HomeScreen;