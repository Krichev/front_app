// src/navigation/AppNavigator.tsx - UPDATED with consistent types
import React from 'react';
import {NavigationContainer, RouteProp} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';

// Import screens (same as before)
import LoginScreen from '../screens/LoginScreen';
import SignupScreen from '../screens/SignupScreen';
import HomeScreen from '../screens/HomeScreen';
import ChallengesScreen from '../screens/ChallengeScreen';
import UserProfileScreen from '../screens/UserProfileScreen';
import SearchScreen from '../screens/SearchScreen';
import GroupsScreen from '../screens/GroupsScreen';
import ChallengeDetailsScreen from '../screens/ChallengeDetailsScreen';
import ChallengeVerificationScreen from '../screens/ChallengeVerificationScreen';
import CreateChallengeScreen from '../screens/CreateChallengeScreen';
import CreateWWWQuestScreen from '../screens/CreateWWWQuestScreen';
import PhotoVerificationScreen from '../screens/PhotoVerificationScreen';
import LocationVerificationScreen from '../screens/LocationVerificationScreen';
import WWWGameSetupScreen from '../screens/WWWGameSetupScreen';
import WWWGamePlayScreen from '../screens/WWWGamePlayScreen';
import WWWGameResultsScreen from '../screens/WWWGameResultsScreen';
import QuizResultsScreen from '../screens/QuizResultsScreen';
import EditProfileScreen from "../screens/EditProfileScreen.tsx";
import UserQuestionsScreen from "../screens/UserQuestionsScreen.tsx";
import CreateUserQuestionScreen from "../screens/CreateUserQuestionScreen.tsx";

import {useSelector} from 'react-redux';
import {RootState} from "../app/providers/StoreProvider/store.ts";
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import {QuestionData, UserQuestion} from "../services/wwwGame/questionService.ts";
import {StateChallenge} from "../entities/ChallengeState/model/slice/challengeSlice.ts";
import {AuthNavigationHandler} from "../entities/AuthState/ui/AuthNavigationHandler.tsx";
import {GameSettings} from "../services/wwwGame";

// FIXED: Consolidated and consistent navigation types
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

    // UPDATED: Consistent WWW Game Screens with both old and new API support
    WWWGameSetup: {
        selectedQuestions?: QuestionData[];
        challengeId?: string; // Added to support challenge-based flow
    };
    WWWGamePlay: GameSettings & {
        sessionId?: string; // Added to support new Quiz API
        challengeId?: string;
    };
    WWWGameResults: {
        teamName: string;
        score: number;
        totalRounds: number;
        roundsData: any[];
        challengeId?: string;
        gameStartTime?: string;
        gameDuration?: number;
        sessionId?: string; // Added to support new Quiz API
    };
    QuizResults: {
        challengeId: string;
        score: number;
        totalRounds: number;
        teamName: string;
        roundsData: any[];
    };

    // Question Management
    QuestionManagement: undefined;
    UserQuestions: undefined;
    CreateUserQuestion: undefined;
    EditUserQuestion: { question: UserQuestion };
    EditChallenge: { challengeId: string, challenge?: StateChallenge };
    VerifyCompletions: { challengeId: string, challengeTitle: string };
};

export type MainTabParamList = {
    Home: undefined;
    Challenges: { initialFilter?: string };
    Search: undefined;
    Groups: undefined;
    Profile: undefined;
};

// ADDED: Global type declaration to make React Navigation aware of our types
declare global {
    namespace ReactNavigation {
        interface RootParamList extends RootStackParamList {}
    }
}

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

// Rest of the component remains the same...
const MainTabNavigator = ({
                              route
                          }: {
    route: RouteProp<RootStackParamList, 'Main'>
}) => {
    const { screen, params } = route.params || {};

    return (
        <Tab.Navigator
            initialRouteName={screen || 'Home'}
            screenOptions={({ route }) => ({
                tabBarIcon: ({ focused, color, size }) => {
                    let iconName = 'help-circle-outline';

                    const icons = {
                        Home: focused ? 'home' : 'home-outline',
                        Challenges: focused ? 'trophy' : 'trophy-outline',
                        Search: focused ? 'magnify' : 'magnify',
                        Groups: focused ? 'account-group' : 'account-group-outline',
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
            <Tab.Screen
                name="Challenges"
                component={ChallengesScreen}
                initialParams={params}
            />
            <Tab.Screen name="Search" component={SearchScreen} />
            <Tab.Screen name="Groups" component={GroupsScreen} />
            <Tab.Screen name="Profile" component={UserProfileScreen} />
        </Tab.Navigator>
    );
};

const AppNavigation = () => {
    const isAuthenticated = useSelector((state: RootState) => state.auth.accessToken);

    return (
        <NavigationContainer>
            <AuthNavigationHandler />
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
                        <Stack.Screen
                            name="Main"
                            component={MainTabNavigator}
                            options={{ headerShown: false }}
                        />
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
                            name="PhotoVerification"
                            component={PhotoVerificationScreen}
                            options={{ title: 'Photo Verification' }}
                        />
                        <Stack.Screen
                            name="LocationVerification"
                            component={LocationVerificationScreen}
                            options={{ title: 'Location Verification' }}
                        />
                        <Stack.Screen
                            name="CreateChallenge"
                            component={CreateChallengeScreen}
                            options={{ title: 'Create Challenge' }}
                        />
                        <Stack.Screen
                            name="CreateWWWQuest"
                            component={CreateWWWQuestScreen}
                            options={{ title: 'Create Quiz Challenge' }}
                        />
                        <Stack.Screen
                            name="UserProfile"
                            component={UserProfileScreen}
                            options={{ title: 'User Profile' }}
                        />
                        <Stack.Screen
                            name="EditProfile"
                            component={EditProfileScreen}
                            options={{ title: 'Edit Profile' }}
                        />
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
                            name="QuizResults"
                            component={QuizResultsScreen}
                            options={{ title: 'Quiz Challenge Results' }}
                        />
                        <Stack.Screen
                            name="UserQuestions"
                            component={UserQuestionsScreen}
                            options={{ title: 'My Questions' }}
                        />
                        <Stack.Screen
                            name="CreateUserQuestion"
                            component={CreateUserQuestionScreen}
                            options={{ title: 'Create Question' }}
                        />
                        <Stack.Screen
                            name="EditUserQuestion"
                            component={CreateUserQuestionScreen}
                            options={{ title: 'Edit Question' }}
                        />
                    </>
                ) : (
                    <>
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
                        <Stack.Screen
                            name="Home"
                            component={HomeScreen}
                            options={{ headerShown: false }}
                        />
                    </>
                )}
            </Stack.Navigator>
        </NavigationContainer>
    );
};

export default AppNavigation;