// src/navigation/types.ts
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import type {RouteProp} from '@react-navigation/native';

// Complete RootStackParamList
export type RootStackParamList = {
    Main: { screen?: keyof MainTabParamList; params?: any };
    Home: undefined;
    Login: undefined;
    Signup: undefined;
    ChallengeDetails: { challengeId: string };
    ChallengeVerification: { challengeId: string };
    PhotoVerification: { challengeId: string; prompt?: string };
    LocationVerification: { challengeId: string };
    CreateChallenge: undefined;
    CreateWWWQuest: undefined;
    UserProfile: { userId: string };
    EditProfile: { userId: string };
    WWWGameSetup: {
        selectedQuestions?: any[];
        challengeId?: string;
    };
    WWWGamePlay: {
        teamName: string;
        teamMembers: string[];
        difficulty: string;
        roundTime: number;
        roundCount: number;
        enableAIHost: boolean;
        challengeId?: string;
        sessionId?: string;
    };
    WWWGameResults: {
        gameResults: any;
        sessionId?: string;
    };
    QuizResults: {
        results: any;
    };
    UserQuestions: undefined;
    CreateUserQuestion: undefined;
};

export type MainTabParamList = {
    Home: undefined;
    Challenges: undefined;
    Search: undefined;
    Groups: undefined;
    Profile: undefined;
};

// Navigation prop types
export type RootStackNavigationProp<T extends keyof RootStackParamList> =
    NativeStackNavigationProp<RootStackParamList, T>;

export type RootStackRouteProp<T extends keyof RootStackParamList> =
    RouteProp<RootStackParamList, T>;

export { AppNavigator } from './AppNavigator.tsx';
