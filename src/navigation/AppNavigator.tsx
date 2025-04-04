// Updated src/navigation/AppNavigator.tsx to include the What? Where? When? game screens
import React from 'react';
import {NavigationContainer, RouteProp} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
// Import existing screens
import ChallengesScreen from '../screens/ChallengeScreen.tsx';
import ChallengeDetailsScreen from '../screens/ChallengeDetailsScreen.tsx';
import ChallengeVerificationScreen from '../screens/ChallengeVerificationScreen.tsx';
import CreateChallengeScreen from '../screens/CreateChallengeScreen.tsx';
import UserProfileScreen from '../screens/UserProfileScreen.tsx';
import HomeScreen from '../screens/HomeScreen.tsx';
import LoginScreen from '../screens/LoginScreen.tsx';
import SignupScreen from '../screens/SignupScreen.tsx';
// Import new WWW game screens
import WWWGameSetupScreen from '../screens/WWWGameSetupScreen.tsx';
import WWWGamePlayScreen from '../screens/WWWGamePlayScreen.tsx';
import WWWGameResultsScreen from '../screens/WWWGameResultsScreen.tsx';
// Other imports
import {useSelector} from 'react-redux';
import {RootState} from "../app/providers/StoreProvider/store.ts";
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

// Define the types for the navigation parameters
export type RootStackParamList = {
    Main: { screen?: keyof MainTabParamList };
    Home: undefined;
    Login: undefined;
    Signup: undefined;
    ChallengeDetails: { challengeId: string };
    ChallengeVerification: { challengeId: string };
    CreateChallenge: undefined;
    UserProfile: { userId: string };
    // WWW Game Screens
    WWWGameSetup: undefined;
    WWWGamePlay: {
        teamName: string;
        teamMembers: string[];
        difficulty: string;
        roundTime: number;
        roundCount: number;
        enableAIHost: boolean;
    };
    WWWGameResults: {
        teamName: string;
        score: number;
        totalRounds: number;
        roundsData: any[];
    };
};

export type MainTabParamList = {
    Home: undefined;
    Challenges: undefined;
    Search: undefined;
    Groups: undefined;
    Profile: undefined;
    WWWGame: undefined; // Add the game to main tabs
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

// Bottom tab navigator
const MainTabNavigator = ({
                              route
                          }: {
    route: RouteProp<RootStackParamList, 'Main'> // Explicit type definition
}) => {
    const { screen } = route.params || {};

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
                        WWWGame: focused ? 'brain' : 'brain', // Icon for the WWW game
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
            <Tab.Screen name="Challenges" component={ChallengesScreen} />
            <Tab.Screen
                name="WWWGame"
                component={WWWGameSetupScreen}
                options={{ title: "What? Where? When?" }}
            />
            <Tab.Screen name="Profile" component={UserProfileScreen} />
        </Tab.Navigator>
    );
};

// Main navigator
const AppNavigation = () => {
    // In a real app, you'd get this from Redux state
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
                            name="CreateChallenge"
                            component={CreateChallengeScreen}
                            options={{ title: 'Create Challenge' }}
                        />
                        <Stack.Screen
                            name="UserProfile"
                            component={UserProfileScreen}
                            options={{ title: 'User Profile' }}
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
                    </>
                ) : (
                    <>
                        <Stack.Screen
                            name="Login"
                            component={LoginScreen}
                            options={{ headerShown: false }}
                        />
                        <Stack.Screen
                            name="Home"
                            component={HomeScreen}
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