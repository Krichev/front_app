// src/navigation/AppNavigator.tsx - COMPLETE FIXED VERSION
import React from 'react';
import {NavigationContainer, NavigationContainerRef} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import { View, Text } from 'react-native';

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
import {ContactsScreen} from '../screens/ContactsScreen';
import {AddContactScreen} from '../screens/AddContactScreen';

import {useSelector} from 'react-redux';
import {RootState} from '../app/providers/StoreProvider/store';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import {AuthNavigationHandler} from '../entities/AuthState/ui/AuthNavigationHandler';
import {GameSettings} from '../services/wwwGame';
import CreateQuestionWithMedia from "../screens/components/CreateQuestionWithMedia.tsx";
import {QuizQuestion} from "../entities/QuizState/model/slice/quizApi.ts";
import CreateAudioQuestionScreen from '../screens/CreateAudioQuestionScreen';
import { useGetRelationshipsQuery } from '../entities/UserState/model/slice/relationshipApi';
import { RelationshipStatus } from '../entities/QuizState/model/types/question.types';

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
    Contacts: undefined;
    AddContact: {selectedUserId?: string};
    WWWGameSetup: {
        selectedQuestions?: QuizQuestion[];
        challengeId?: string;
    };
    WWWGamePlay:
        | (GameSettings & { sessionId?: string; challengeId?: string })
        | { sessionId: string|undefined; challengeId?: string|undefined };
    WWWGameResults: {
        teamName: string;
        score: number;
        totalRounds: number;
        roundsData: Array<{
            question: string;
            correctAnswer: string;
            teamAnswer: string;
            isCorrect: boolean;
            playerWhoAnswered: string;
            discussionNotes: string;
        }>;
        challengeId?: string;
        sessionId?: string;
        gameStartTime?: string;
        gameDuration?: number;
    };
    QuizResults: {
        score: number;
        totalQuestions: number;
        challengeId: string;
    };
    UserQuestions: undefined;
    CreateUserQuestion: undefined;
    CreateAudioQuestion: { onSubmit: (question: any) => void };
};

export type MainTabParamList = {
    Home: undefined;
    Challenges: undefined;
    Search: undefined;
    Contacts: undefined;
    Profile: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

// Create a navigation reference
export const navigationRef = React.createRef<NavigationContainerRef<RootStackParamList>>();

// Main tab navigator
function MainTabs() {
    const { data: pendingData } = useGetRelationshipsQuery({
        status: RelationshipStatus.PENDING,
        size: 1
    });
    const pendingCount = pendingData?.totalElements || 0;

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
                name="Contacts"
                component={ContactsScreen}
                options={{
                    tabBarIcon: ({color, size}) => (
                        <View style={{ width: 24, height: 24, margin: 5 }}>
                            <MaterialCommunityIcons name="account-group" size={size} color={color} />
                            {pendingCount > 0 && (
                                <View style={{
                                    position: 'absolute',
                                    right: -8,
                                    top: -8,
                                    backgroundColor: '#ff4444',
                                    borderRadius: 10,
                                    minWidth: 18,
                                    height: 18,
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                    paddingHorizontal: 2,
                                    borderWidth: 1.5,
                                    borderColor: 'white'
                                }}>
                                    <Text style={{ color: 'white', fontSize: 10, fontWeight: 'bold' }}>
                                        {pendingCount > 99 ? '99+' : pendingCount}
                                    </Text>
                                </View>
                            )}
                        </View>
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
                        <Stack.Screen name="AddContact" component={AddContactScreen} />
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
                        <Stack.Screen
                            name="CreateAudioQuestion"
                            component={CreateAudioQuestionScreen}
                            options={{
                                headerShown: false,
                                title: 'Create Audio Question',
                            }}
                        />
                    </>
                )}
            </Stack.Navigator>
        </NavigationContainer>
    );
};

export default AppNavigator;