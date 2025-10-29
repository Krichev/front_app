// src/navigation/AppNavigator.tsx - COMPLETE FIXED VERSION
import React from 'react';
import {NavigationContainer, NavigationContainerRef} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';

// Import screens
import LoginScreen from '../screens/LoginScreen';
import SignupScreen from '../screens/SignupScreen';
import HomeScreen from '../screens/HomeScreen';
import ChallengesScreen from '../screens/ChallengeScreen';
import UserProfileScreen from '../screens/UserProfileScreen';
import SearchScreen from '../screens/SearchScreen';
import ChallengeDetailsScreen from '../screens/ChallengeDetailsScreen';
import ChallengeVerificationScreen from '../screens/ChallengeVerificationScreen';
import CreateChallengeScreen from '../screens/CreateChallengeScreen';
import CreateWWWQuestScreen from '../screens/CreateWWWQuestScreen/CreateWWWQuestScreen.tsx';
import PhotoVerificationScreen from '../screens/PhotoVerificationScreen';
import LocationVerificationScreen from '../screens/LocationVerificationScreen';
import WWWGameSetupScreen from '../screens/WWWGameSetupScreen';
import WWWGamePlayScreen from '../screens/WWWGamePlayScreen';
import WWWGameResultsScreen from '../screens/WWWGameResultsScreen';
import QuizResultsScreen from '../screens/QuizResultsScreen';
import EditProfileScreen from '../screens/EditProfileScreen';
import GamesHomeScreen from '../screens/GamesHomeScreen';

import {useSelector} from 'react-redux';
import {RootState} from '../app/providers/StoreProvider/store';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import {QuestionData} from '../services/wwwGame/questionService';
import {AuthNavigationHandler} from '../entities/AuthState/ui/AuthNavigationHandler';
import {GameSettings} from '../services/wwwGame';
import CreateQuestionWithMedia from "../screens/components/CreateQuestionWithMedia.tsx";

// Navigation types
export type RootStackParamList = {
    Main: {screen?: keyof MainTabParamList; params?: any};
    Login: undefined;
    Signup: undefined;
    ChallengeDetails: {challengeId: string};
    ChallengeVerification: {challengeId: string};
    PhotoVerification: {challengeId: string; prompt?: string};
    LocationVerification: {challengeId: string};
    CreateChallenge: undefined;
    CreateWWWQuest: undefined;
    UserProfile: {userId: string};
    EditProfile: {userId: string};
    WWWGameSetup: {
        selectedQuestions?: QuestionData[];
        challengeId?: string;
    };
    WWWGamePlay: GameSettings & {
        sessionId?: string;
        challengeId?: string;
    };
    WWWGameResults: {
        score: number;
        totalQuestions: number;
        challengeId?: string;
        teamName?: string;
        totalRounds?: number;
        roundsData?: any[];
    };
    QuizResults: {
        score: number;
        totalQuestions: number;
        challengeId: string;
    };
    UserQuestions: undefined;
    CreateUserQuestion: undefined;
};

export type MainTabParamList = {
    Home: undefined;
    Challenges: undefined;
    Search: undefined;
    Games: undefined;
    Profile: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

// Create a navigation reference
export const navigationRef = React.createRef<NavigationContainerRef<RootStackParamList>>();

// Main tab navigator
function MainTabs() {
    return (
        <Tab.Navigator
            screenOptions={{
                headerShown: false,
                tabBarActiveTintColor: '#4CAF50',
                tabBarInactiveTintColor: '#999',
            }}>
            <Tab.Screen
                name="Home"
                component={HomeScreen}
                options={{
                    tabBarIcon: ({color, size}) => (
                        <MaterialCommunityIcons name="home" size={size} color={color} />
                    ),
                }}
            />
            <Tab.Screen
                name="Challenges"
                component={ChallengesScreen}
                options={{
                    tabBarIcon: ({color, size}) => (
                        <MaterialCommunityIcons name="trophy" size={size} color={color} />
                    ),
                }}
            />
            <Tab.Screen
                name="Search"
                component={SearchScreen}
                options={{
                    tabBarIcon: ({color, size}) => (
                        <MaterialCommunityIcons name="magnify" size={size} color={color} />
                    ),
                }}
            />
            <Tab.Screen
                name="Games"
                component={GamesHomeScreen}
                options={{
                    tabBarIcon: ({color, size}) => (
                        <MaterialCommunityIcons
                            name="gamepad-variant"
                            size={size}
                            color={color}
                        />
                    ),
                }}
            />
            <Tab.Screen
                name="Profile"
                component={UserProfileScreen}
                options={{
                    tabBarIcon: ({color, size}) => (
                        <MaterialCommunityIcons name="account" size={size} color={color} />
                    ),
                }}
            />
        </Tab.Navigator>
    );
}

const AppNavigator: React.FC = () => {
    const {isAuthenticated, isInitialized} = useSelector(
        (state: RootState) => state.auth,
    );

    // Show loading until auth state is initialized
    if (!isInitialized) {
        return null; // or a loading screen
    }

    return (
        <NavigationContainer ref={navigationRef}>
            <AuthNavigationHandler />
            <Stack.Navigator
                screenOptions={{
                    headerShown: false,
                }}>
                {!isAuthenticated ? (
                    // Auth Stack
                    <>
                        <Stack.Screen name="Login" component={LoginScreen} />
                        <Stack.Screen name="Signup" component={SignupScreen} />
                    </>
                ) : (
                    // Main App Stack
                    <>
                        <Stack.Screen name="Main" component={MainTabs} />
                        <Stack.Screen
                            name="ChallengeDetails"
                            component={ChallengeDetailsScreen}
                        />
                        <Stack.Screen
                            name="ChallengeVerification"
                            component={ChallengeVerificationScreen}
                        />
                        <Stack.Screen
                            name="PhotoVerification"
                            component={PhotoVerificationScreen}
                        />
                        <Stack.Screen
                            name="LocationVerification"
                            component={LocationVerificationScreen}
                        />
                        <Stack.Screen
                            name="CreateChallenge"
                            component={CreateChallengeScreen}
                        />
                        <Stack.Screen
                            name="CreateWWWQuest"
                            component={CreateWWWQuestScreen}
                        />
                        <Stack.Screen name="UserProfile" component={UserProfileScreen} />
                        <Stack.Screen name="EditProfile" component={EditProfileScreen} />
                        <Stack.Screen name="WWWGameSetup" component={WWWGameSetupScreen} />
                        <Stack.Screen name="WWWGamePlay" component={WWWGamePlayScreen} />
                        <Stack.Screen
                            name="WWWGameResults"
                            component={WWWGameResultsScreen}
                        />
                        <Stack.Screen name="QuizResults" component={QuizResultsScreen} />
                        <Stack.Screen
                            name="UserQuestions"
                            component={CreateQuestionWithMedia}
                        />
                        <Stack.Screen
                            name="CreateUserQuestion"
                            component={CreateQuestionWithMedia}
                        />
                    </>
                )}
            </Stack.Navigator>
        </NavigationContainer>
    );
};

export default AppNavigator;