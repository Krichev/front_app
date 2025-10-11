// src/navigation/AppNavigator.tsx - COMPLETE FINAL VERSION
import React from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';

// Import screens
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

// Navigation types
export type RootStackParamList = {
    Main: { screen?: keyof MainTabParamList; params?: any };
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

    // WWW Game Screens
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
    };
    QuizResults: {
        challenge: StateChallenge;
        participantScore?: number;
    };

    // User Questions
    UserQuestions: undefined;
    CreateUserQuestion: undefined;
    EditUserQuestion: { question: UserQuestion };
};

export type MainTabParamList = {
    Home: undefined;
    Challenges: { initialFilter?: string };
    Search: undefined;
    Groups: undefined;
    Profile: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

const MainTabNavigator = () => {
    return (
        <Tab.Navigator
            screenOptions={({route}) => ({
                tabBarIcon: ({focused, color, size}) => {
                    let iconName: string;

                    switch (route.name) {
                        case 'Home':
                            iconName = focused ? 'home' : 'home-outline';
                            break;
                        case 'Challenges':
                            iconName = focused ? 'trophy' : 'trophy-outline';
                            break;
                        case 'Search':
                            iconName = focused ? 'magnify' : 'magnify';
                            break;
                        case 'Groups':
                            iconName = focused ? 'account-group' : 'account-group-outline';
                            break;
                        case 'Profile':
                            iconName = focused ? 'account' : 'account-outline';
                            break;
                        default:
                            iconName = 'circle';
                    }

                    return <MaterialCommunityIcons name={iconName} size={size} color={color}/>;
                },
                tabBarActiveTintColor: '#4CAF50',
                tabBarInactiveTintColor: 'gray',
                headerShown: false,
            })}
        >
            <Tab.Screen name="Home" component={HomeScreen}/>
            <Tab.Screen name="Challenges" component={ChallengesScreen}/>
            <Tab.Screen name="Search" component={SearchScreen}/>
            <Tab.Screen name="Groups" component={GroupsScreen}/>
            <Tab.Screen name="Profile" component={UserProfileScreen}/>
        </Tab.Navigator>
    );
};

const AppNavigation = () => {
    const isAuthenticated = useSelector((state: RootState) => state.auth.accessToken);

    return (
        <NavigationContainer>
            <AuthNavigationHandler/>
            <Stack.Navigator>
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
                            options={{ title: 'WWW_QUIZ', headerShown: false }}
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
                    </>
                )}
            </Stack.Navigator>
        </NavigationContainer>
    );
};

export default AppNavigation;