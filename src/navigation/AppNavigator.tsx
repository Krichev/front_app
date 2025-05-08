// src/navigation/AppNavigator.tsx
import React from 'react';
import {NavigationContainer, RouteProp} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';

// Import screens
// Auth screens
import LoginScreen from '../screens/LoginScreen';
import SignupScreen from '../screens/SignupScreen';

// Main screens
import HomeScreen from '../screens/HomeScreen';
import ChallengesScreen from '../screens/ChallengeScreen';
import UserProfileScreen from '../screens/UserProfileScreen';
import SearchScreen from '../screens/SearchScreen';
import GroupsScreen from '../screens/GroupsScreen';
// Challenge screens
import ChallengeDetailsScreen from '../screens/ChallengeDetailsScreen';
import ChallengeVerificationScreen from '../screens/ChallengeVerificationScreen';
import CreateChallengeScreen from '../screens/CreateChallengeScreen';
import CreateWWWQuestScreen from '../screens/CreateWWWQuestScreen';
import PhotoVerificationScreen from '../screens/PhotoVerificationScreen';
import LocationVerificationScreen from '../screens/LocationVerificationScreen';

// WWW Game screens
import WWWGameSetupScreen from '../screens/WWWGameSetupScreen';
import WWWGamePlayScreen from '../screens/WWWGamePlayScreen';
import WWWGameResultsScreen from '../screens/WWWGameResultsScreen';
import QuizResultsScreen from '../screens/QuizResultsScreen';

// Other imports
import {useSelector} from 'react-redux';
import {RootState} from "../app/providers/StoreProvider/store.ts";
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import EditProfileScreen from "../screens/EditProfileScreen.tsx";
import {QuestionData, UserQuestion} from "../services/wwwGame/questionService.ts";
import UserQuestionsScreen from "../screens/UserQuestionsScreen.tsx";
import CreateUserQuestionScreen from "../screens/CreateUserQuestionScreen.tsx";

// Define the types for the navigation parameters
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
    // WWW Game Screens
    WWWGamePlay: {
        teamName: string;
        teamMembers: string[];
        difficulty: string;
        roundTime: number;
        roundCount: number;
        enableAIHost: boolean;
        challengeId?: string; // Optional to track which challenge this game is for
    };
    WWWGameResults: {
        teamName: string;
        score: number;
        totalRounds: number;
        roundsData: any[];
        challengeId?: string; // Optional to track completion
    };
    QuizResults: {
        challengeId: string;
        score: number;
        totalRounds: number;
        teamName: string;
        roundsData: any[];
    };
    WWWGameSetup: { selectedQuestions?: QuestionData[] };
    QuestionManagement: undefined;
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

// Bottom tab navigator
const MainTabNavigator = ({
                              route
                          }: {
    route: RouteProp<RootStackParamList, 'Main'>
}) => {
    const { screen, params } = route.params || {};

    return (
        <Tab.Navigator
            initialRouteName={screen || 'Home'} // Set initial tab based on params
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

// Main navigator
const AppNavigation = () => {
    // Get auth state from Redux
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
                    // Authenticated user stack
                    <>
                        {/* Main Tab Navigator */}
                        <Stack.Screen
                            name="Main"
                            component={MainTabNavigator}
                            options={{ headerShown: false }}
                        />

                        {/* Challenge Screens */}
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

                        {/* User Screens */}
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

                        {/* WWW Game screens */}
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
                    // Unauthenticated user stack
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
                        {/* Home is included here to handle cases where a deep link might bring an unauthenticated user */}
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