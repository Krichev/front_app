import React from 'react';
import {NavigationContainer, RouteProp} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
// Import screens
import ChallengesScreen from '../screens/ChallengeScreen.tsx';
import ChallengeDetailsScreen from '../screens/ChallengeDetailsScreen.tsx';
import ChallengeVerificationScreen from '../screens/ChallengeVerificationScreen.tsx';
import CreateChallengeScreen from '../screens/CreateChallengeScreen.tsx';
//
import UserProfileScreen from '../screens/UserProfileScreen.tsx';
// import EditProfileScreen from '../screens/EditProfileScreen.tsx';
import HomeScreen from '../screens/HomeScreen.tsx';
// import SearchScreen from '../screens/SearchScreen.tsx';
// import GroupsScreen from '../screens/GroupsScreen.tsx';
import LoginScreen from '../screens/LoginScreen.tsx';
import SignupScreen from '../screens/SignupScreen.tsx';
import {useSelector} from 'react-redux';
import {RootState} from "../app/providers/StoreProvider/store.ts";
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

console.log('Module CreateChallengeScreen:', CreateChallengeScreen);

console.log('Module ChallengeVerificationScreen:', ChallengeVerificationScreen);

console.log('Module ChallengeDetailsScreen:', ChallengeDetailsScreen);

console.log('Module ChallengesScreen:', ChallengesScreen);

console.log('Module UserProfileScreen:', UserProfileScreen);

console.log('Module HomeScreen:', HomeScreen);

// Define the types for the navigation parameters
export type RootStackParamList = {
    Main: { screen?: keyof MainTabParamList };
    Home: undefined;
    Login: undefined;
    Signup: undefined;
    ChallengeDetails: { challengeId: string };
    ChallengeVerification: { challengeId: string }; // Add the new route
    CreateChallenge: undefined;
    UserProfile: { userId: string };
    // EditProfile: { userId: string };
    // GroupDetails: { groupId: string };
    // CreateGroup: undefined;
};

export type MainTabParamList = {
    Home: undefined;
    Challenges: undefined;
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
                    };

                    return <MaterialCommunityIcons
                        name={icons[route.name] || iconName}
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
            {/*<Tab.Screen name="Search" component={SearchScreen} />*/}
            {/*<Tab.Screen name="Groups" component={GroupsScreen} />*/}
            <Tab.Screen name="Profile" component={UserProfileScreen}  />
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
                        {/*<Stack.Screen*/}
                        {/*    name="EditProfile"*/}
                        {/*    component={EditProfileScreen}*/}
                        {/*    options={{ title: 'Edit Profile' }}*/}
                        {/*/>*/}
                        {/*<Stack.Screen*/}
                        {/*    name="GroupDetails"*/}
                        {/*    component={() => <></>} // Placeholder, would be a real component*/}
                        {/*    options={{ title: 'Group Details' }}*/}
                        {/*/>*/}
                        {/*<Stack.Screen*/}
                        {/*    name="CreateGroup"*/}
                        {/*    component={() => <></>} // Placeholder, would be a real component*/}
                        {/*    options={{ title: 'Create Group' }}*/}
                        {/*/>*/}
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