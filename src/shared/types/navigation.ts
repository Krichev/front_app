export type RootStackParamList = {
    Main: { screen: keyof MainTabParamList; params?: any };
    Login: undefined;
    Signup: undefined;
    WWWGameSetup: undefined;
    WWWGamePlay: GameSettings;
    WWWGameResults: { gameSession: any };
    CreateWWWQuest: undefined;
    UserQuestions: undefined;
    CreateUserQuestion: undefined;
};

export type MainTabParamList = {
    Home: undefined;
    Challenges: { initialFilter?: string };
    Search: undefined;
    Groups: undefined;
    Profile: undefined;
};

export interface GameSettings {
    teamSize: number;
    questionTime: number;
    discussionTime: number;
    answerTime: number;
    difficulty: 'easy' | 'medium' | 'hard';
    source: string;
    teamName: string;
    teamMembers: string[];
    enableAIHost: boolean;
}