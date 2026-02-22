// src/navigation/AppNavigator.tsx - COMPLETE FIXED VERSION
import React from 'react';
import {NavigationContainer, NavigationContainerRef, LinkingOptions} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import { View, Text } from 'react-native';
import { useTranslation } from 'react-i18next';

// Import screens
import LoginScreen from '../screens/LoginScreen';
import SignupScreen from '../screens/SignupScreen';
import HomeScreen from '../screens/HomeScreen';
import ChallengesScreen from '../screens/ChallengeScreen';
import UserProfileScreen from '../screens/UserProfileScreen';
import SearchScreen from '../screens/SearchScreen';
import ChallengeDetailsScreen from '../screens/ChallengeDetailsScreen';
import ChallengeVerificationScreen from '../screens/ChallengeVerification/ChallengeVerificationScreen';
import CreateChallengeScreen from '../screens/CreateChallengeScreen';
import CreateWWWQuestScreen from '../screens/CreateWWWQuestScreen/CreateWWWQuestScreen.tsx';
import QuestionManagementScreen from '../screens/QuestionManagementScreen';
import PhotoVerificationScreen from '../screens/PhotoVerificationScreen';
import LocationVerificationScreen from '../screens/LocationVerificationScreen';
import WWWGamePlayScreen from '../screens/WWWGamePlayScreen';
import BrainRingGamePlayScreen from '../screens/BrainRingGamePlayScreen';
import WWWGameResultsScreen from '../screens/WWWGameResults';
import QuizResultsScreen from '../screens/QuizResultsScreen';
import EditProfileScreen from '../screens/EditProfileScreen';
import GroupsScreen from '../screens/GroupsScreen';
import {ContactsScreen} from '../screens/ContactsScreen';
import {AddContactScreen} from '../screens/AddContactScreen';
import UserQuestionsScreen from '../screens/UserQuestionsScreen';
import SettingsScreen from '../screens/SettingsScreen';
import JoinRoomScreen from '../screens/JoinRoomScreen';
import ControllerLobbyScreen from '../screens/ControllerLobbyScreen';
import ControllerGameScreen from '../screens/ControllerGameScreen';
import MultiplayerGameOverScreen from '../screens/MultiplayerGameOverScreen';
import QRScannerScreen from '../screens/QRScannerScreen';
import CameraScreen from '../screens/CameraScreen';
import PuzzleSetupScreen from '../screens/PuzzleSetupScreen';
import PuzzleGamePlayScreen from '../screens/PuzzleGamePlayScreen';
import PuzzleResultsScreen from '../screens/PuzzleResultsScreen';

import {useSelector} from 'react-redux';
import {RootState} from '../app/providers/StoreProvider/store';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import {AuthNavigationHandler} from '../entities/AuthState/ui/AuthNavigationHandler';
import {GameSettings} from '../services/wwwGame';
import {UserQuestion} from '../services/wwwGame/questionService';
import CreateQuestionWithMedia from "../screens/components/CreateQuestionWithMedia.tsx";
import {QuizQuestion} from "../entities/QuizState/model/slice/quizApi.ts";
import CreateAudioQuestionScreen from '../screens/CreateAudioQuestionScreen';
import { useGetRelationshipsQuery } from '../entities/UserState/model/slice/relationshipApi';
import { RelationshipStatus } from '../entities/QuizState/model/types/question.types';
import RhythmChallengeScreen from '../screens/RhythmChallengeScreen';
import { PenaltyDashboardScreen } from '../screens/PenaltyDashboardScreen';
import { PenaltyProofScreen } from '../screens/PenaltyProofScreen';
import VibrationQuizScreen from '../screens/VibrationQuizScreen';
import { VibrationDifficulty } from '../features/VibrationQuiz';
import { MatchmakingScreen } from '../screens/competitive/MatchmakingScreen';
import { MatchLobbyScreen } from '../screens/competitive/MatchLobbyScreen';
import { LiveMatchScreen } from '../screens/competitive/LiveMatchScreen';
import { MatchResultScreen } from '../screens/competitive/MatchResultScreen';
import { CompetitiveHistoryScreen } from '../screens/competitive/CompetitiveHistoryScreen';
import { AudioChallengeType } from '../types/audioChallenge.types';

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
    PenaltyDashboard: undefined;
    PenaltyProof: {penaltyId: number};
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
    QuestionManagement: undefined;
    CreateUserQuestion: undefined;
    EditUserQuestion: { question: UserQuestion };
    CreateAudioQuestion: { 
        returnTo?: 'CreateWWWQuest' | 'UserQuestions';
    };
    RhythmChallenge: {
        questionId: number;
        onComplete?: (passed: boolean, score: number) => void;
    };
    VibrationQuiz: {
        difficulty?: VibrationDifficulty;
        questionCount?: number;
    };
    BrainRingGamePlay: {
        sessionId: string;
        userId: string;
    };
    Matchmaking: { challengeType: AudioChallengeType; rounds: number };
    MatchLobby: { matchId: number };
    LiveMatch: { matchId: number };
    MatchResult: { matchId: number };
    CompetitiveHistory: undefined;
    JoinRoom: undefined;
    ControllerLobby: { roomCode: string };
    ControllerGame: { roomCode: string };
    MultiplayerGameOver: { roomCode: string };
    QRScanner: undefined;
    CameraScreen: {
        mode: 'photo' | 'video';
        maxDuration?: number;
        onCapture?: (media: any) => void;
    };
    PuzzleSetup: {
        challengeId: string;
    };
    PuzzleGamePlay: {
        puzzleGameId: number;
        gameMode: 'SHARED' | 'INDIVIDUAL';
        gridRows: number;
        gridCols: number;
        timeLimitSeconds?: number;
        roomCode?: string;
    };
    PuzzleResults: {
        puzzleGameId: number;
    };
};

export type MainTabParamList = {
    Home: undefined;
    Challenges: { initialFilter?: string };
    Search: undefined;
    Contacts: undefined;
    Groups: undefined;
    Profile: undefined;
    Settings: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

// Create a navigation reference
export const navigationRef = React.createRef<NavigationContainerRef<RootStackParamList>>();

// Main tab navigator
function MainTabs() {
    const { t } = useTranslation();
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
                    tabBarLabel: t('navigation.home'),
                }}
            />
            <Tab.Screen
                name="Challenges"
                component={ChallengesScreen}
                options={{
                    tabBarIcon: ({color, size}) => (
                        <MaterialCommunityIcons name="trophy" size={size} color={color} />
                    ),
                    tabBarLabel: t('navigation.challenges'),
                }}
            />
            <Tab.Screen
                name="Search"
                component={SearchScreen}
                options={{
                    tabBarIcon: ({color, size}) => (
                        <MaterialCommunityIcons name="magnify" size={size} color={color} />
                    ),
                    tabBarLabel: t('navigation.search'),
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
                    tabBarLabel: t('navigation.contacts'),
                }}
            />
            <Tab.Screen
                name="Groups"
                component={GroupsScreen}
                options={{
                    tabBarIcon: ({color, size}) => (
                        <MaterialCommunityIcons name="account-group" size={size} color={color} />
                    ),
                    tabBarLabel: t('navigation.groups'),
                }}
            />
            <Tab.Screen
                name="Profile"
                component={UserProfileScreen}
                options={{
                    tabBarIcon: ({color, size}) => (
                        <MaterialCommunityIcons name="account" size={size} color={color} />
                    ),
                    tabBarLabel: t('navigation.profile'),
                }}
            />
            <Tab.Screen
                name="Settings"
                component={SettingsScreen}
                options={{
                    tabBarIcon: ({color, size}) => (
                        <MaterialCommunityIcons name="cog-outline" size={size} color={color} />
                    ),
                    tabBarLabel: ({color}) => {
                        return <Text style={{color, fontSize: 10}}>{t('navigation.settings')}</Text>;
                    },
                }}
            />
        </Tab.Navigator>
    );
}

const AppNavigator: React.FC<{ linking?: LinkingOptions<RootStackParamList> }> = ({ linking }) => {
    const { t } = useTranslation();
    const {isAuthenticated, isInitialized} = useSelector(
        (state: RootState) => state.auth,
    );

    // Show loading until auth state is initialized
    if (!isInitialized) {
        return null; // or a loading screen
    }

    return (
        <NavigationContainer ref={navigationRef} linking={linking}>
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
                        <Stack.Screen name="PenaltyDashboard" component={PenaltyDashboardScreen} />
                        <Stack.Screen name="PenaltyProof" component={PenaltyProofScreen} />
                        <Stack.Screen name="WWWGamePlay" component={WWWGamePlayScreen} />
                        <Stack.Screen name="BrainRingGamePlay" component={BrainRingGamePlayScreen} />
                        <Stack.Screen
                            name="WWWGameResults"
                            component={WWWGameResultsScreen}
                        />
                        <Stack.Screen name="QuizResults" component={QuizResultsScreen} />
                        <Stack.Screen
                            name="UserQuestions"
                            component={UserQuestionsScreen}
                        />
                        <Stack.Screen
                            name="QuestionManagement"
                            component={QuestionManagementScreen}
                        />
                        <Stack.Screen
                            name="CreateUserQuestion"
                            component={CreateQuestionWithMedia}
                        />
                        <Stack.Screen
                            name="EditUserQuestion"
                            component={CreateQuestionWithMedia}
                        />
                        <Stack.Screen
                            name="CreateAudioQuestion"
                            component={CreateAudioQuestionScreen}
                            options={{
                                headerShown: false,
                                title: t('navigation.createAudioQuestion'),
                            }}
                        />
                        <Stack.Screen 
                            name="RhythmChallenge" 
                            component={RhythmChallengeScreen}
                            options={{
                                headerShown: false,
                                animation: 'slide_from_right',
                            }}
                        />
                        <Stack.Screen 
                            name="VibrationQuiz" 
                            component={VibrationQuizScreen}
                            options={{
                                headerShown: false,
                                animation: 'fade',
                            }}
                        />
                        <Stack.Screen name="Matchmaking" component={MatchmakingScreen} />
                        <Stack.Screen name="MatchLobby" component={MatchLobbyScreen} />
                        <Stack.Screen name="LiveMatch" component={LiveMatchScreen} options={{ headerShown: false }} />
                        <Stack.Screen name="MatchResult" component={MatchResultScreen} options={{ headerShown: false }} />
                        <Stack.Screen name="CompetitiveHistory" component={CompetitiveHistoryScreen} />
                        <Stack.Screen name="JoinRoom" component={JoinRoomScreen} />
                        <Stack.Screen name="ControllerLobby" component={ControllerLobbyScreen} />
                        <Stack.Screen name="ControllerGame" component={ControllerGameScreen} />
                        <Stack.Screen name="MultiplayerGameOver" component={MultiplayerGameOverScreen} />
                        <Stack.Screen name="QRScanner" component={QRScannerScreen} />
                        <Stack.Screen name="CameraScreen" component={CameraScreen} />
                        <Stack.Screen name="PuzzleSetup" component={PuzzleSetupScreen} />
                        <Stack.Screen name="PuzzleGamePlay" component={PuzzleGamePlayScreen} />
                        <Stack.Screen name="PuzzleResults" component={PuzzleResultsScreen} />
                    </>
                )}
            </Stack.Navigator>
        </NavigationContainer>
    );
};

export default AppNavigator;