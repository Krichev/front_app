// Fixed src/navigation/AppNavigator.tsx
import React from 'react';
import {NavigationContainer, RouteProp} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
// Import existing screens
import ChallengesScreen from '../screens/ChallengeScreen.tsx';
import ChallengeDetailsScreen from '../screens/ChallengeDetailsScreen.tsx';
import ChallengeVerificationScreen from '../screens/ChallengeVerificationScreen.tsx';
import CreateChallengeScreen from '../screens/CreateChallengeScreen.tsx';
import UserProfileScreen from '../screens/UserProfileScreen.tsx';
import HomeScreen from '../screens/HomeScreen.tsx';
import LoginScreen from '../screens/LoginScreen.tsx';
import SignupScreen from '../screens/SignupScreen.tsx';
// Import verification screens
import LocationVerificationScreen from '../screens/LocationVerificationScreen.tsx';
import PhotoVerificationScreen from '../screens/PhotoVerificationScreen.tsx';
// Import games screens
import GamesHomeScreen from '../screens/GamesHomeScreen.tsx';
import WWWGameSetupScreen from '../screens/WWWGameSetupScreen.tsx';
import WWWGamePlayScreen from '../screens/WWWGamePlayScreen.tsx';
import WWWGameResultsScreen from '../screens/WWWGameResultsScreen.tsx';
import QuestionManagementScreen from '../screens/QuestionManagementScreen.tsx';
// Other imports
import {useSelector} from 'react-redux';
import {RootState} from "../app/providers/StoreProvider/store.ts";
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

// Define the types for the main tab navigation
export type MainTabParamList = {
    Home: undefined;
    Challenges: undefined;
    Games: undefined;
    Profile: undefined;
};

// Define the types for the root stack navigation
export type RootStackParamList = {
    // Main tab navigator
    Main: { screen?: keyof MainTabParamList };

    // Auth screens
    Login: undefined;
    Signup: undefined;
    Home: undefined; // Adding this for direct navigation to Home screen from auth

    // Challenge flow screens
    ChallengeDetails: { challengeId: string };
    ChallengeVerification: { challengeId: string };
    CreateChallenge: undefined;
    PhotoVerification: { challengeId: string; prompt?: string };
    LocationVerification: { challengeId: string };

    // User profile
    UserProfile: { userId: string };

    // Games flow screens
    WWWGameSetup: { selectedQuestions?: any[] };
    WWWGamePlay: {
        teamName: string;
        teamMembers: string[];
        difficulty: string;
        roundTime: number;
        roundCount: number;
        enableAIHost: boolean;
    };
    WWWGameResults: {
        teamName: string;
        score: number;
        totalRounds: number;
        roundsData: any[];
    };
    QuestionManagement: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

// Bottom tab navigator - only include core features
const MainTabNavigator = ({
                              route
                          }: {
    route: RouteProp<RootStackParamList, 'Main'>
}) => {
    const { screen } = route.params || {};

    return (
        <Tab.Navigator
            initialRouteName={screen || 'Home'}
            screenOptions={({ route }) => ({
                tabBarIcon: ({ focused, color, size }) => {
                    let iconName = 'help-circle-outline';

                    const icons = {
                        Home: focused ? 'home' : 'home-outline',
                        Challenges: focused ? 'trophy' : 'trophy-outline',
                        Games: focused ? 'gamepad-variant' : 'gamepad-variant-outline',
                        Profile: focused ? 'account' : 'account-outline',
                    };

                    return <MaterialCommunityIcons
                        name={icons[route.name as keyof typeof icons] || iconName}
                        size={size}
                        color={color}
                    />;
                },
                tabBarActiveTintColor: '#4CAF50',
                tabBarInactiveTintColor: 'gray',
                headerShown: false,
            })}
        >
            <Tab.Screen name="Home" component={HomeScreen} />
            <Tab.Screen name="Challenges" component={ChallengesScreen} />
            <Tab.Screen name="Games" component={GamesHomeScreen} />
            <Tab.Screen name="Profile" component={UserProfileScreen} />
        </Tab.Navigator>
    );
};

// Main navigator
const AppNavigation = () => {
    const isAuthenticated = useSelector((state: RootState) => state.auth.accessToken);

    return (
        <NavigationContainer>
            <Stack.Navigator
                screenOptions={{
                    headerStyle: {
                        backgroundColor: '#4CAF50',
                    },
                    headerTintColor: 'white',
                    headerTitleStyle: {
                        fontWeight: 'bold',
                    },
                }}
            >
                {isAuthenticated ? (
                    <>
                        {/* Core navigation */}
                        <Stack.Screen
                            name="Main"
                            component={MainTabNavigator}
                            options={{ headerShown: false }}
                        />

                        {/* Home screen when accessed directly */}
                        <Stack.Screen
                            name="Home"
                            component={HomeScreen}
                            options={{ headerShown: false }}
                        />

                        {/* Challenge flow */}
                        <Stack.Screen
                            name="ChallengeDetails"
                            component={ChallengeDetailsScreen}
                            options={{ title: 'Challenge Details' }}
                        />
                        <Stack.Screen
                            name="ChallengeVerification"
                            component={ChallengeVerificationScreen}
                            options={{ title: 'Verify Challenge' }}
                        />
                        <Stack.Screen
                            name="CreateChallenge"
                            component={CreateChallengeScreen}
                            options={{ title: 'Create Challenge' }}
                        />
                        <Stack.Screen
                            name="PhotoVerification"
                            component={PhotoVerificationScreen}
                            options={{ title: 'Photo Verification' }}
                        />
                        <Stack.Screen
                            name="LocationVerification"
                            component={LocationVerificationScreen}
                            options={{ title: 'Location Verification' }}
                        />

                        {/* User profile */}
                        <Stack.Screen
                            name="UserProfile"
                            component={UserProfileScreen}
                            options={{ title: 'User Profile' }}
                        />

                        {/* Games flow */}
                        <Stack.Screen
                            name="WWWGameSetup"
                            component={WWWGameSetupScreen}
                            options={{ title: 'Game Setup' }}
                        />
                        <Stack.Screen
                            name="WWWGamePlay"
                            component={WWWGamePlayScreen}
                            options={{ title: 'What? Where? When?', headerShown: false }}
                        />
                        <Stack.Screen
                            name="WWWGameResults"
                            component={WWWGameResultsScreen}
                            options={{ title: 'Game Results' }}
                        />
                        <Stack.Screen
                            name="QuestionManagement"
                            component={QuestionManagementScreen}
                            options={{ title: 'Manage Questions' }}
                        />
                    </>
                ) : (
                    <>
                        {/* Auth screens */}
                        <Stack.Screen
                            name="Login"
                            component={LoginScreen}
                            options={{ headerShown: false }}
                        />
                        <Stack.Screen
                            name="Signup"
                            component={SignupScreen}
                            options={{ headerShown: false }}
                        />
                    </>
                )}
            </Stack.Navigator>
        </NavigationContainer>
    );
};

export default AppNavigation;