// src/app/navigation/index.tsx
import React from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';


// Pages imports
import {LoginPage} from '../../pages/auth/login';
import {SignupPage} from '../../pages/auth/signup';
import {HomePage} from '../../pages/home';
import {ChallengesPage} from '../../pages/challenges';
import {ProfilePage} from '../../pages/profile';
import {SearchPage} from '../../pages/search';
import {GroupsPage} from '../../pages/groups';
import {ChallengeDetailsPage} from '../../pages/challenges/details';
import {CreateChallengePage} from '../../pages/challenges/create';
import {WWWGameSetupPage} from '../../pages/games/www-setup';
import {WWWGamePlayPage} from '../../pages/games/www-play';
import {WWWGameResultsPage} from '../../pages/games/www-results';

// Features
import {AuthGuard} from '../../features/auth';

// Types
import {MainTabParamList, RootStackParamList} from './types';
import {CustomIcon} from "../../shared/components/Icon/CustomIcon.tsx";

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
                            name={icons[route.name as keyof typeof icons] || 'help-circle-outline'}
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
            <Tab.Screen name="Home" component={HomePage} />
            <Tab.Screen name="Challenges" component={ChallengesPage} />
            <Tab.Screen name="Search" component={SearchPage} />
            <Tab.Screen name="Groups" component={GroupsPage} />
            <Tab.Screen name="Profile" component={ProfilePage} />
        </Tab.Navigator>
    );
};

const AppNavigator = () => {
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
                {/* Auth Flow */}
                <Stack.Screen
                    name="Login"
                    component={LoginPage}
                    options={{headerShown: false}}
                />
                <Stack.Screen
                    name="Signup"
                    component={SignupPage}
                    options={{headerShown: false}}
                />

                {/* Main App Flow */}
                <Stack.Screen
                    name="Main"
                    component={MainTabNavigator}
                    options={{headerShown: false}}
                />

                {/* Challenge Flow */}
                <Stack.Screen
                    name="ChallengeDetails"
                    component={ChallengeDetailsPage}
                    options={{title: 'Challenge Details'}}
                />
                <Stack.Screen
                    name="CreateChallenge"
                    component={CreateChallengePage}
                    options={{title: 'Create Challenge'}}
                />

                {/* Game Flow */}
                <Stack.Screen
                    name="WWWGameSetup"
                    component={WWWGameSetupPage}
                    options={{title: 'Game Setup'}}
                />
                <Stack.Screen
                    name="WWWGamePlay"
                    component={WWWGamePlayPage}
                    options={{title: 'What? Where? When?', headerShown: false}}
                />
                <Stack.Screen
                    name="WWWGameResults"
                    component={WWWGameResultsPage}
                    options={{title: 'Game Results'}}
                />
            </Stack.Navigator>
        </NavigationContainer>
    );
};

export const AppNavigation = () => {
    return (
        <AuthGuard>
            <AppNavigator />
        </AuthGuard>
    );
};