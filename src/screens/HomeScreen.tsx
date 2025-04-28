import React from 'react';
import {ActivityIndicator, FlatList, SafeAreaView, StyleSheet, Text, TouchableOpacity, View,} from 'react-native';
import {useDispatch, useSelector} from 'react-redux';
import {useNavigation} from '@react-navigation/native';
import {RootState} from "../app/providers/StoreProvider/store.ts";
import {logout} from "../entities/AuthState/model/slice/authSlice.ts";
import {StackNavigationProp} from "@react-navigation/stack";
import {MainTabParamList, RootStackParamList} from "../navigation/AppNavigator.tsx";
import * as Keychain from "react-native-keychain"; // RTK Query hook for fetching challenges
import {useGetChallengesQuery} from "../entities/ChallengeState/model/slice/challengeApi";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import QuizChallengeCard from "../entities/ChallengeState/ui/QuizChallengeCard.tsx";


// Define the types for your navigation stack
// type RootStackParamList = {
//     Home: undefined;
//     Challenges: undefined;
//     // Groups: undefined;
//     // Quests: undefined;
//     // Profile: undefined;
//     // Users: undefined;
// };


type HomeScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Home'>;

const HomeScreen: React.FC = () => {
    const dispatch = useDispatch();
    const navigation = useNavigation<HomeScreenNavigationProp>();

    // Read the current authenticated user from your Redux store
    const {user} = useSelector((state: RootState) => state.auth);

    // Sample RTK Query hook to fetch recent challenges—ensure you define this endpoint in your RTK Query slice!
    // const { data: recentChallenges, error, isLoading } = useGetRecentChallengesQuery();
    const {data: recentChallenges, error, isLoading} = useGetChallengesQuery({
        participant_id: user?.id,
    });

    // Query for quiz challenges specifically
    const {data: quizChallenges, isLoading: loadingQuizzes} = useGetChallengesQuery({
        type: 'QUIZ',
        limit: 5 // Just show a few
    });

    // Filter for WWW quizzes with proper type checking
    const wwwQuizzes = React.useMemo(() => {
        if (!quizChallenges) return [];

        return quizChallenges.filter(challenge => {
            try {
                // Check if quizConfig exists before trying to use it
                if (!challenge.quizConfig) return false;

                // Parse the quizConfig safely
                const config = JSON.parse(challenge.quizConfig);
                return config && config.gameType === 'WWW';
            } catch (error) {
                // If parsing fails, log error and filter out this challenge
                console.error('Error parsing quiz config:', error);
                return false;
            }
        });
    }, [quizChallenges]);


// Define the menu item type to reference tab screens
    type MenuItem = {
        id: string;
        title: string;
        tabScreen: keyof MainTabParamList;
    };

// Define the menu items for the main tabs
    const menuItems: MenuItem[] = [
        {id: '1', title: 'Home', tabScreen: 'Home'},
        {id: '2', title: 'Challenges', tabScreen: 'Challenges'},
        {id: '3', title: 'Search', tabScreen: 'Search'},
        {id: '4', title: 'Groups', tabScreen: 'Groups'},
        {id: '5', title: 'Profile', tabScreen: 'Profile'},
    ];

    const handleLogout = async () => {
        dispatch(logout());
        await Keychain.resetGenericPassword();
    };

    const renderMenuItem = ({item}: { item: MenuItem }) => (
        <TouchableOpacity
            style={styles.menuItem}
            onPress={() => navigation.navigate('Main', {screen: item.tabScreen})}
        >
            <Text style={styles.menuText}>{item.title}</Text>
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.title}>Challenge App</Text>
                {user && <Text style={styles.welcome}>Welcome, {user.name}</Text>}
                <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                    <Text style={styles.logoutText}>Sign Out</Text>
                </TouchableOpacity>
            </View>

            {/* Menu Options */}
            <View style={styles.menuContainer}>
                <FlatList
                    data={menuItems}
                    renderItem={renderMenuItem}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={styles.menuList}
                />
            </View>

            {/* Recent Challenges Section (RTK Query usage) */}
            {(quizChallenges?.length && quizChallenges?.length > 0 || wwwQuizzes.length > 0) && (
                <View style={styles.quizContainer}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Quiz Challenges</Text>
                        <TouchableOpacity
                            onPress={() => navigation.navigate('Main', {
                                screen: 'Challenges',
                                params: {initialFilter: 'QUIZ'}
                            })}
                        >
                            <Text style={styles.viewAllText}>View All</Text>
                        </TouchableOpacity>
                    </View>

                    {loadingQuizzes ? (
                        <ActivityIndicator size="small" color="#4CAF50"/>
                    ) : wwwQuizzes.length > 0 ? (
                        <View>
                            <View style={styles.featuredQuizHeader}>
                                <MaterialCommunityIcons name="brain" size={20} color="#4CAF50"/>
                                <Text style={styles.featuredQuizTitle}>What? Where? When? Quizzes</Text>
                            </View>

                            {wwwQuizzes.slice(0, 2).map(quiz => (
                                <QuizChallengeCard
                                    key={quiz.id}
                                    challenge={quiz}
                                    onPress={() => navigation.navigate('ChallengeDetails', {challengeId: quiz.id})}
                                />
                            ))}

                            <TouchableOpacity
                                style={styles.createQuizButton}
                                onPress={() => navigation.navigate('CreateWWWQuest')}
                            >
                                <MaterialCommunityIcons name="plus" size={16} color="white"/>
                                <Text style={styles.createQuizText}>Create Quiz</Text>
                            </TouchableOpacity>
                        </View>
                    ) : (
                        <View style={styles.emptyQuizContainer}>
                            <Text style={styles.emptyQuizText}>No quiz challenges found</Text>
                            <TouchableOpacity
                                style={styles.createQuizButton}
                                onPress={() => navigation.navigate('CreateWWWQuest')}
                            >
                                <MaterialCommunityIcons name="plus" size={16} color="white"/>
                                <Text style={styles.createQuizText}>Create What? Where? When? Quiz</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </View>
            )}
        </SafeAreaView>
    );
};

export default HomeScreen;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    header: {
        backgroundColor: '#4CAF50',
        padding: 16,
        alignItems: 'center',
        position: 'relative',
    },
    title: {
        fontSize: 26,
        fontWeight: 'bold',
        color: '#fff',
    },
    welcome: {
        fontSize: 18,
        color: '#fff',
        marginTop: 8,
    },
    logoutButton: {
        position: 'absolute',
        right: 16,
        top: 16,
        padding: 8,
    },
    logoutText: {
        color: '#fff',
        fontSize: 14,
    },
    menuContainer: {
        flex: 1,
        padding: 16,
    },
    menuList: {
        justifyContent: 'center',
    },
    menuItem: {
        backgroundColor: '#fff',
        padding: 16,
        marginVertical: 8,
        borderRadius: 8,
        elevation: 2,
    },
    menuText: {
        fontSize: 18,
    },
    challengesContainer: {
        padding: 16,
        borderTopWidth: 1,
        borderTopColor: '#ddd',
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: '600',
        marginBottom: 8,
    },
    challengeItem: {
        padding: 12,
        backgroundColor: '#fff',
        borderRadius: 6,
        marginBottom: 8,
        elevation: 1,
    },
    challengeTitle: {
        fontSize: 16,
    },
    errorText: {
        color: 'red',
    },
    noChallenges: {
        fontStyle: 'italic',
        color: '#666',
    },
    quizContainer: {
        padding: 16,
        backgroundColor: '#f9f9f9',
        borderRadius: 8,
        marginTop: 16,
        marginBottom: 16,
        elevation: 1,
        shadowOpacity: 0.1,
        shadowRadius: 2,
        shadowOffset: {width: 0, height: 1},
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    viewAllText: {
        color: '#4CAF50',
        fontSize: 14,
        fontWeight: '500',
    },
    featuredQuizHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    featuredQuizTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#4CAF50',
        marginLeft: 8,
    },
    emptyQuizContainer: {
        alignItems: 'center',
        padding: 16,
    },
    emptyQuizText: {
        fontSize: 14,
        color: '#888',
        marginBottom: 16,
    },
    createQuizButton: {
        flexDirection: 'row',
        backgroundColor: '#4CAF50',
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 20,
        alignItems: 'center',
        alignSelf: 'center',
        marginTop: 8,
    },
    createQuizText: {
        color: 'white',
        fontSize: 14,
        fontWeight: 'bold',
        marginLeft: 4,
    },
});
