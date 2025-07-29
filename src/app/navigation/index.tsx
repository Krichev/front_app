// src/app/navigation/index.tsx
import React from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';

// Screen imports (fixed paths and names)
import LoginScreen from '../../screens/LoginScreen';
import SignupScreen from '../../screens/SignupScreen';
import HomeScreen from '../../screens/HomeScreen';
import ChallengesScreen from '../../screens/ChallengeScreen';
import UserProfileScreen from '../../screens/UserProfileScreen';
import SearchScreen from '../../screens/SearchScreen';
import GroupsScreen from '../../screens/GroupsScreen';
import ChallengeDetailsScreen from '../../screens/ChallengeDetailsScreen';
import ChallengeVerificationScreen from '../../screens/ChallengeVerificationScreen';
import CreateChallengeScreen from '../../screens/CreateChallengeScreen';
import CreateWWWQuestScreen from '../../screens/CreateWWWQuestScreen';
import PhotoVerificationScreen from '../../screens/PhotoVerificationScreen';
import LocationVerificationScreen from '../../screens/LocationVerificationScreen';
import WWWGameSetupScreen from '../../screens/WWWGameSetupScreen';
import WWWGamePlayScreen from '../../screens/WWWGamePlayScreen';
import WWWGameResultsScreen from '../../screens/WWWGameResultsScreen';
import QuizResultsScreen from '../../screens/QuizResultsScreen';
import EditProfileScreen from '../../screens/EditProfileScreen';
import UserQuestionsScreen from '../../screens/UserQuestionsScreen';
import CreateUserQuestionScreen from '../../screens/CreateUserQuestionScreen';

// Features

// Types
import {MainTabParamList, RootStackParamList} from './types';
import {CustomIcon} from "../../shared/components/Icon/CustomIcon";

// Redux
import {useSelector} from 'react-redux';
import {RootState} from '../providers/StoreProvider/store';

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

const MainTabNavigator = () => {
    return (
        <Tab.Navigator
            screenOptions={({route}) => ({
                tabBarIcon: ({focused, color, size}) => {
                    const icons = {
                        Home: focused ? 'home' : 'home-outline',
                        Challenges: focused ? 'trophy' : 'trophy-outline',
                        Search: focused ? 'magnify' : 'magnify',
                        Groups: focused ? 'account-group' : 'account-group-outline',
                        Profile: focused ? 'account' : 'account-outline',
                    };

                    return (
                        <CustomIcon
                            name={icons[route.name as keyof typeof icons]}
                            size={size}
                            color={color}
                        />
                    );
                },
                tabBarActiveTintColor: '#4CAF50',
                tabBarInactiveTintColor: 'gray',
                headerShown: false,
            })}
        >
            <Tab.Screen name="Home" component={HomeScreen} />
            <Tab.Screen name="Challenges" component={ChallengesScreen} />
            <Tab.Screen name="Search" component={SearchScreen} />
            <Tab.Screen name="Groups" component={GroupsScreen} />
            <Tab.Screen name="Profile" component={UserProfileScreen} />
        </Tab.Navigator>
    );
};

const AppNavigator: React.FC = () => {
    const isAuthenticated = useSelector((state: RootState) => state.auth.isAuthenticated);

    return (
        <NavigationContainer>
            <Stack.Navigator
                screenOptions={{
                    headerShown: false,
                }}
            >
                {!isAuthenticated ? (
                    // Auth Stack
                    <>
                        <Stack.Screen name="Login" component={LoginScreen} />
                        <Stack.Screen name="Signup" component={SignupScreen} />
                    </>
                ) : (
                    // App Stack
                    <>
                        <Stack.Screen name="Main" component={MainTabNavigator} />
                        <Stack.Screen
                            name="ChallengeDetails"
                            component={ChallengeDetailsScreen}
                            options={{
                                headerShown: true,
                                title: 'Challenge Details',
                            }}
                        />
                        <Stack.Screen
                            name="ChallengeVerification"
                            component={ChallengeVerificationScreen}
                            options={{
                                headerShown: true,
                                title: 'Verify Challenge',
                            }}
                        />
                        <Stack.Screen
                            name="PhotoVerification"
                            component={PhotoVerificationScreen}
                            options={{
                                headerShown: true,
                                title: 'Photo Verification',
                            }}
                        />
                        <Stack.Screen
                            name="LocationVerification"
                            component={LocationVerificationScreen}
                            options={{
                                headerShown: true,
                                title: 'Location Verification',
                            }}
                        />
                        <Stack.Screen
                            name="CreateChallenge"
                            component={CreateChallengeScreen}
                            options={{
                                headerShown: true,
                                title: 'Create Challenge',
                            }}
                        />
                        <Stack.Screen
                            name="CreateWWWQuest"
                            component={CreateWWWQuestScreen}
                            options={{
                                headerShown: true,
                                title: 'Create WWW Quiz',
                            }}
                        />
                        <Stack.Screen
                            name="UserProfile"
                            component={UserProfileScreen}
                            options={{
                                headerShown: true,
                                title: 'User Profile',
                            }}
                        />
                        <Stack.Screen
                            name="EditProfile"
                            component={EditProfileScreen}
                            options={{
                                headerShown: true,
                                title: 'Edit Profile',
                            }}
                        />
                        <Stack.Screen
                            name="WWWGameSetup"
                            component={WWWGameSetupScreen}
                            options={{
                                headerShown: true,
                                title: 'Game Setup',
                            }}
                        />
                        <Stack.Screen
                            name="WWWGamePlay"
                            component={WWWGamePlayScreen}
                            options={{
                                headerShown: false,
                            }}
                        />
                        <Stack.Screen
                            name="WWWGameResults"
                            component={WWWGameResultsScreen}
                            options={{
                                headerShown: true,
                                title: 'Game Results',
                            }}
                        />
                        <Stack.Screen
                            name="QuizResults"
                            component={QuizResultsScreen}
                            options={{
                                headerShown: true,
                                title: 'Quiz Results',
                            }}
                        />
                        <Stack.Screen
                            name="UserQuestions"
                            component={UserQuestionsScreen}
                            options={{
                                headerShown: true,
                                title: 'My Questions',
                            }}
                        />
                        <Stack.Screen
                            name="CreateUserQuestion"
                            component={CreateUserQuestionScreen}
                            options={{
                                headerShown: true,
                                title: 'Create Question',
                            }}
                        />
                    </>
                )}
            </Stack.Navigator>
        </NavigationContainer>
    );
};

export default AppNavigator;