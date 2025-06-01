// src/app/navigation/types.ts
import {RouteProp} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';

// Game settings type
export interface GameSettings {
    teamName: string;
    teamMembers: string[];
    difficulty: 'Easy' | 'Medium' | 'Hard';
    roundTime: number;
    roundCount: number;
    enableAIHost: boolean;
    questionSource: 'app' | 'user';
    challengeId?: string;
}

// Root stack param list
export type RootStackParamList = {
    // Auth
    Login: undefined;
    Signup: undefined;

    // Main navigation
    Main: {screen?: keyof MainTabParamList; params?: any};

    // Challenges
    ChallengeDetails: {challengeId: string};
    CreateChallenge: undefined;
    ChallengeVerification: {challengeId: string};
    PhotoVerification: {challengeId: string; prompt?: string};
    LocationVerification: {challengeId: string};

    // Games
    WWWGameSetup: {
        selectedQuestions?: any[];
        challengeId?: string;
    };
    WWWGamePlay: GameSettings & {
        sessionId?: string;
        challengeId?: string;
    };
    WWWGameResults: {
        teamName: string;
        score: number;
        totalRounds: number;
        roundsData: any[];
        challengeId?: string;
        sessionId?: string;
    };
    QuizResults: {
        challengeId: string;
        score: number;
        totalRounds: number;
        teamName: string;
        roundsData: any[];
    };

    // User
    UserProfile: {userId: string};
    EditProfile: {userId: string};

    // Questions
    UserQuestions: undefined;
    CreateUserQuestion: undefined;
    EditUserQuestion: {question: any};
};

// Main tab param list
export type MainTabParamList = {
    Home: undefined;
    Challenges: {initialFilter?: string};
    Search: undefined;
    Groups: undefined;
    Profile: undefined;
};

// Navigation prop types
export type RootStackNavigationProp<T extends keyof RootStackParamList> =
    NativeStackNavigationProp<RootStackParamList, T>;

export type RootStackRouteProp<T extends keyof RootStackParamList> =
    RouteProp<RootStackParamList, T>;

// Global navigation type declaration
declare global {
    namespace ReactNavigation {
        interface RootParamList extends RootStackParamList {}
    }
}