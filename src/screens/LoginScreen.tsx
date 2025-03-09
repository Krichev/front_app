import React, {useEffect, useState} from 'react';
import {
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import * as Keychain from 'react-native-keychain';
import {StackNavigationProp} from '@react-navigation/stack';
import {useDispatch} from 'react-redux';
import {useLoginMutation} from "../entities/AuthState/model/slice/authApi.ts";
import {setTokens} from "../entities/AuthState/model/slice/authSlice.ts";
import {RootStackParamList} from "../navigation/AppNavigator.tsx";

// type RootStackParamList = {
//     Login: undefined;
//     Signup: undefined;
//     Home: undefined;
// };
type LoginScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Login'>;

interface LoginScreenProps {
    navigation: LoginScreenNavigationProp;
}

const LoginScreen: React.FC<LoginScreenProps> = ({navigation}) => {
    const [formData, setFormData] = useState({username: '', password: ''});
    const [login, {isLoading, error}] = useLoginMutation();
    const dispatch = useDispatch();
    console.log('login screen ====================');
    useEffect(() => {
        const checkTokens = async () => {
            try {
                const credentials = await Keychain.getGenericPassword();
                if (credentials) {
                    console.log(credentials)
                    const {accessToken, refreshToken, user} = JSON.parse(credentials.password);
                    dispatch(setTokens({accessToken, refreshToken, user}));
                    // navigation.navigate('Home');
                    navigation.navigate('Main', { screen: 'Home' });
                }
            } catch (err) {
                console.log('Error checking stored tokens:', err);
            }
        };
        checkTokens();
    }, [dispatch, navigation]);

    const handleInputChange = (field: keyof typeof formData, value: string): void => {
        setFormData({
            ...formData,
            [field]: value,
        });
    };

    const handleLogin = async (): Promise<void> => {
        const {username, password} = formData;

        console.log('handleLogin');

        // **Input Validation**
        if (!username.trim() || !password.trim()) {
            Alert.alert('Error', 'Please fill in all fields');
            return;
        }

        // const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        // if (!emailRegex.test(email)) {
        //     Alert.alert('Error', 'Please enter a valid email address');
        //     return;
        // }

        try {
            console.log(username);
            console.log(password);


            // **Attempt Login**
            const result = await login({username, password}).unwrap();
            console.log(result)
            const {accessToken, refreshToken, user} = result;

            // **Securely Store Tokens and User Info**
            await Keychain.setGenericPassword('authTokens', JSON.stringify({accessToken, refreshToken, user}));

            // **Update Auth State**
            dispatch(setTokens({accessToken, refreshToken, user}));

            // **Navigate to Home Screen**
            // navigation.navigate('Home');
            navigation.navigate('Main', { screen: 'Home' });
        } catch (err: any) {
            const errorMessage = err.data?.message || 'An error occurred';
            Alert.alert('Error', errorMessage);
            console.log( err.data);
        }
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.container}
        >
            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.logoContainer}>
                    <Text style={styles.appName}>TaskBuddy</Text>
                </View>

                <View style={styles.formContainer}>
                    <Text style={styles.title}>Log In</Text>

                    <View style={styles.inputContainer}>
                        <Text style={styles.label}>username</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Enter your username"
                            autoCapitalize="none"
                            value={formData.username}
                            onChangeText={(value) => handleInputChange('username', value)}
                        />
                    </View>

                    <View style={styles.inputContainer}>
                        <Text style={styles.label}>Password</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Enter your password"
                            secureTextEntry
                            value={formData.password}
                            onChangeText={(value) => handleInputChange('password', value)}
                        />
                    </View>

                    <TouchableOpacity
                        style={[styles.loginButton, isLoading && styles.disabledButton]}
                        onPress={handleLogin}
                        disabled={isLoading}
                    >
                        <Text style={styles.loginButtonText}>
                            {isLoading ? 'Logging In...' : 'Log In'}
                        </Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.signupContainer}>
                    <Text style={styles.signupText}>Don't have an account? </Text>
                    <TouchableOpacity onPress={() => navigation.navigate('Signup')}>
                        <Text style={styles.signupLink}>Sign Up</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
};

// Updated styles
// Styles
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    scrollContent: {
        flexGrow: 1,
        justifyContent: 'center',
        padding: 20,
    },
    logoContainer: {
        alignItems: 'center',
        marginBottom: 30,
    },
    appName: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#333',
    },
    formContainer: {
        marginBottom: 20,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 20,
        textAlign: 'center',
    },
    inputContainer: {
        marginBottom: 15,
    },
    label: {
        fontSize: 16,
        marginBottom: 5,
        color: '#555',
    },
    input: {
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 5,
        padding: 10,
        fontSize: 16,
    },
    loginButton: {
        backgroundColor: '#007bff',
        padding: 15,
        borderRadius: 5,
        alignItems: 'center',
        marginTop: 20,
    },
    loginButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
    signupContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: 20,
    },
    signupText: {
        fontSize: 16,
        color: '#555',
    },
    signupLink: {
        fontSize: 16,
        color: '#007bff',
        fontWeight: 'bold',
    },
    disabledButton: {
        backgroundColor: '#80bdff',
        opacity: 0.7,
    },
});

export default LoginScreen;
