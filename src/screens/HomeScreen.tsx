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
        navigation.navigate(screen);
    };

    const handleChallengePress = (challengeId: string) => {
        navigation.navigate('ChallengeDetails', {challengeId});
    };

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
                <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                    <Text style={styles.logoutText}>Logout</Text>
                </TouchableOpacity>
                <Text style={styles.title}>Challenge Hub</Text>
                <Text style={styles.welcome}>Welcome, {user?.username || 'User'}!</Text>
            </View>

            {/* Menu Items */}
            <View style={styles.menuContainer}>
                <FlatList
                    data={menuItems}
                    keyExtractor={(item) => item.id}
                    renderItem={({item}) => (
                        <TouchableOpacity
                            style={styles.menuItem}
                            onPress={() => navigateToScreen(item.screen)}
                        >
                            <MaterialCommunityIcons name={item.icon} size={24} color="#4CAF50"/>
                            <Text style={styles.menuText}>{item.title}</Text>
                        </TouchableOpacity>
                    )}
                    contentContainerStyle={styles.menuList}
                />
            </View>

            {/* Recent Challenges Section */}
            {recentChallenges && recentChallenges.length > 0 && (
                <View style={styles.challengesContainer}>
                    <Text style={styles.sectionTitle}>Recent Challenges</Text>
                    <FlatList
                        horizontal
                        data={recentChallenges.slice(0, 5)}
                        keyExtractor={(item) => item.id}
                        renderItem={({item}) => (
                            <TouchableOpacity
                                style={styles.challengeItem}
                                onPress={() => handleChallengePress(item.id)}
                            >
                                <Text style={styles.challengeTitle}>{item.title}</Text>
                                <Text style={styles.challengeType}>{item.type}</Text>
                            </TouchableOpacity>
                        )}
                        showsHorizontalScrollIndicator={false}
                    />
                </View>
            )}

            {/* WWW Quizzes Section */}
            {wwwQuizzes.length > 0 && (
                <View style={styles.wwwSection}>
                    <View style={styles.wwwHeader}>
                        <Text style={styles.sectionTitle}>WWW Quizzes</Text>
                        <TouchableOpacity
                            style={styles.createQuizButton}
                            onPress={handleCreateWWWQuiz}
                        >
                            <MaterialCommunityIcons name="plus" size={16} color="white"/>
                            <Text style={styles.createQuizText}>Create WWW_QUIZ</Text>
                        </TouchableOpacity>
                    </View>
                    <FlatList
                        data={wwwQuizzes}
                        keyExtractor={(item) => item.id}
                        renderItem={({item}) => (
                            <QuizChallengeCard
                                challenge={item}
                                onPress={() => handleChallengePress(item.id)}
                            />
                        )}
                        contentContainerStyle={styles.quizList}
                    />
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
        flexDirection: 'row',
        alignItems: 'center',
    },
    menuText: {
        fontSize: 18,
        marginLeft: 12,
    },
    challengesContainer: {
        padding: 16,
        borderTopWidth: 1,
        borderTopColor: '#ddd',
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: '600',
        marginBottom: 12,
        color: '#333',
    },
    challengeItem: {
        padding: 12,
        backgroundColor: '#fff',
        marginRight: 12,
        borderRadius: 8,
        minWidth: 150,
        elevation: 1,
    },
    challengeTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
    },
    challengeType: {
        fontSize: 14,
        color: '#666',
        marginTop: 4,
    },
    wwwSection: {
        padding: 16,
        borderTopWidth: 1,
        borderTopColor: '#ddd',
    },
    wwwHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    createQuizButton: {
        backgroundColor: '#4CAF50',
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 8,
    },
    createQuizText: {
        color: 'white',
        marginLeft: 4,
        fontSize: 14,
        fontWeight: '600',
    },
    quizList: {
        paddingBottom: 16,
    },
});