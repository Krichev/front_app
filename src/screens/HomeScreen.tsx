import React from 'react';
import {ActivityIndicator, FlatList, SafeAreaView, StyleSheet, Text, TouchableOpacity, View,} from 'react-native';
import {useDispatch, useSelector} from 'react-redux';
import {useNavigation} from '@react-navigation/native';
import {RootState} from "../app/providers/StoreProvider/store.ts";
import {logout} from "../entities/AuthState/model/slice/authSlice.ts";
import {useGetChallengesQuery} from "../entities/ChallengeState/model/slice/challengeApi.ts";
import {StackNavigationProp} from "@react-navigation/stack";
import {MainTabParamList, RootStackParamList} from "../navigation/AppNavigator.tsx";
import * as Keychain from "react-native-keychain"; // RTK Query hook for fetching challenges

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
    const { user } = useSelector((state: RootState) => state.auth);

    // Sample RTK Query hook to fetch recent challenges—ensure you define this endpoint in your RTK Query slice!
    // const { data: recentChallenges, error, isLoading } = useGetRecentChallengesQuery();
    const { data: recentChallenges,error, isLoading } = useGetChallengesQuery({
        participant_id: user?.id,
    });

// Define the menu item type to reference tab screens
    type MenuItem = {
        id: string;
        title: string;
        tabScreen: keyof MainTabParamList;
    };

// Define the menu items for the main tabs
    const menuItems: MenuItem[] = [
        { id: '1', title: 'Home', tabScreen: 'Home' },
        { id: '2', title: 'Challenges', tabScreen: 'Challenges' },
        { id: '3', title: 'Search', tabScreen: 'Search' },
        { id: '4', title: 'Groups', tabScreen: 'Groups' },
        { id: '5', title: 'Profile', tabScreen: 'Profile' },
    ];

    const handleLogout = async () => {
        dispatch(logout());
        await Keychain.resetGenericPassword();
    };

    const renderMenuItem = ({ item }: { item: MenuItem }) => (
        <TouchableOpacity
            style={styles.menuItem}
            onPress={() => navigation.navigate('Main', { screen: item.tabScreen })}
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
            <View style={styles.challengesContainer}>
                <Text style={styles.sectionTitle}>Recent Challenges</Text>
                {isLoading ? (
                    <ActivityIndicator size="small" color="#4CAF50" />
                ) : error ? (
                    <Text style={styles.errorText}>Error loading challenges.</Text>
                ) : recentChallenges && recentChallenges.length > 0 ? (
                    recentChallenges.map((challenge: { id: string; title: string }) => (
                        <View key={challenge.id} style={styles.challengeItem}>
                            <Text style={styles.challengeTitle}>{challenge.title}</Text>
                        </View>
                    ))
                ) : (
                    <Text style={styles.noChallenges}>No recent challenges found.</Text>
                )}
            </View>
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
});
