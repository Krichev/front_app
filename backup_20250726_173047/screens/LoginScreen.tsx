// src/screens/LoginScreen.tsx - Updated with UserMapper
// ================================================================
// src/screens/SignupScreen.tsx - Updated with UserMapper
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
import {useDispatch, useSelector} from 'react-redux';
import {useLoginMutation, useSignupMutation} from '../entities/AuthState/model/slice/authApi';
import {loginFailure, loginStart, loginSuccess, setTokens} from '../entities/AuthState/model/slice/authSlice';
import {RootState} from '../app/providers/StoreProvider/store';
import {RootStackParamList} from '../navigation/AppNavigator';
import {isApiLoginResponse, isApiSignupResponse, UserMapper, UserMappingError} from '../utils/userMapping';

type LoginScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Login'>;

interface LoginScreenProps {
    navigation: LoginScreenNavigationProp;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ navigation }) => {
    const [formData, setFormData] = useState({ username: '', password: '' });
    const [login, { isLoading: apiLoading, error: apiError }] = useLoginMutation();
    const dispatch = useDispatch();

    const { isLoading, error, isAuthenticated } = useSelector((state: RootState) => state.auth);

    useEffect(() => {
        const checkTokens = async () => {
            try {
                const credentials = await Keychain.getGenericPassword();
                if (credentials) {
                    const storedData = JSON.parse(credentials.password);

                    // Validate stored data has required properties
                    if (storedData.accessToken && storedData.user && storedData.user.username) {
                        dispatch(setTokens({
                            accessToken: storedData.accessToken,
                            refreshToken: storedData.refreshToken,
                            user: storedData.user,
                        }));

                        navigation.reset({
                            index: 0,
                            routes: [{ name: 'Main' }],
                        });
                    }
                }
            } catch (err) {
                console.log('Error checking stored tokens:', err);
                // Clear invalid stored data
                await Keychain.resetGenericPassword();
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
        const { username, password } = formData;

        if (!username.trim() || !password.trim()) {
            Alert.alert('Error', 'Please fill in all fields');
            return;
        }

        try {
            dispatch(loginStart());

            // Make API call
            const apiResponse = await login({ username, password }).unwrap();

            // Validate and map response
            if (!isApiLoginResponse(apiResponse)) {
                throw new UserMappingError('Invalid login response format', apiResponse);
            }

            // Map API response to our internal types
            const authData = UserMapper.mapApiLoginResponse(apiResponse);

            // Validate mapped data
            if (!authData.user.username || !authData.user.createdAt) {
                throw new UserMappingError('Mapped user data is incomplete', authData.user);
            }

            // Store in Keychain
            await Keychain.setGenericPassword(
                'authData',
                JSON.stringify(authData)
            );

            // Update Redux state - Now properly typed!
            dispatch(loginSuccess(authData));

            navigation.reset({
                index: 0,
                routes: [{ name: 'Main' }],
            });

        } catch (err: any) {
            console.error('Login error:', err);

            let errorMessage = 'Login failed';

            if (err instanceof UserMappingError) {
                errorMessage = 'Invalid response from server';
                console.error('Mapping error details:', err.originalData);
            } else if (err?.data?.message) {
                errorMessage = err.data.message;
            } else if (err?.message) {
                errorMessage = err.message;
            }

            dispatch(loginFailure(errorMessage));
            Alert.alert('Login Failed', errorMessage);
        }
    };

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.content}>
                    <Text style={styles.title}>Welcome Back</Text>
                    <Text style={styles.subtitle}>Sign in to your account</Text>

                    <View style={styles.form}>
                        <TextInput
                            style={styles.input}
                            placeholder="Username"
                            value={formData.username}
                            onChangeText={(value) => handleInputChange('username', value)}
                            autoCapitalize="none"
                            autoCorrect={false}
                        />

                        <TextInput
                            style={styles.input}
                            placeholder="Password"
                            value={formData.password}
                            onChangeText={(value) => handleInputChange('password', value)}
                            secureTextEntry
                            autoCapitalize="none"
                            autoCorrect={false}
                        />

                        {error && (
                            <Text style={styles.errorText}>{error}</Text>
                        )}

                        <TouchableOpacity
                            style={[styles.button, isLoading && styles.buttonDisabled]}
                            onPress={handleLogin}
                            disabled={isLoading}
                        >
                            <Text style={styles.buttonText}>
                                {isLoading ? 'Signing In...' : 'Sign In'}
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.linkButton}
                            onPress={() => navigation.navigate('Signup')}
                        >
                            <Text style={styles.linkText}>
                                Don't have an account? Sign Up
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
};

type SignupScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Signup'>;

interface SignupScreenProps {
    navigation: SignupScreenNavigationProp;
}

interface FormData {
    username: string;
    email: string;
    password: string;
    confirmPassword: string;
}

const SignupScreen: React.FC<SignupScreenProps> = ({ navigation }) => {
    const [formData, setFormData] = useState<FormData>({
        username: '',
        email: '',
        password: '',
        confirmPassword: '',
    });
    const [signup, { isLoading: apiLoading, error: apiError }] = useSignupMutation();
    const dispatch = useDispatch();

    const { isLoading, error } = useSelector((state: RootState) => state.auth);

    const handleInputChange = (field: keyof FormData, value: string): void => {
        setFormData({
            ...formData,
            [field]: value,
        });
    };

    const handleSignup = async (): Promise<void> => {
        const { username, email, password, confirmPassword } = formData;

        // Input Validation
        if (!username.trim() || !email.trim() || !password.trim() || !confirmPassword.trim()) {
            Alert.alert('Error', 'Please fill in all fields');
            return;
        }

        if (password !== confirmPassword) {
            Alert.alert('Error', 'Passwords do not match');
            return;
        }

        // Basic email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            Alert.alert('Error', 'Please enter a valid email address');
            return;
        }

        // Password strength validation
        if (password.length < 6) {
            Alert.alert('Error', 'Password must be at least 6 characters long');
            return;
        }

        try {
            dispatch(loginStart());

            // Make API call - pass username as 'name' if that's what API expects
            const apiResponse = await signup({
                username, // or name: username if API expects 'name'
                email,
                password
            }).unwrap();

            // Validate and map response
            if (!isApiSignupResponse(apiResponse)) {
                throw new UserMappingError('Invalid signup response format', apiResponse);
            }

            // Map API response to our internal types
            const authData = UserMapper.mapApiSignupResponse(apiResponse);

            // Validate mapped data
            if (!authData.user.username || !authData.user.createdAt) {
                throw new UserMappingError('Mapped user data is incomplete', authData.user);
            }

            // Store in Keychain
            await Keychain.setGenericPassword(
                'authData',
                JSON.stringify(authData)
            );

            // Update Redux state - Now properly typed!
            dispatch(loginSuccess(authData));

            navigation.reset({
                index: 0,
                routes: [{ name: 'Main' }],
            });

        } catch (err: any) {
            console.error('Signup error:', err);

            let errorMessage = 'Signup failed';

            if (err instanceof UserMappingError) {
                errorMessage = 'Invalid response from server';
                console.error('Mapping error details:', err.originalData);
            } else if (err?.data?.message) {
                errorMessage = err.data.message;
            } else if (err?.message) {
                errorMessage = err.message;
            }

            dispatch(loginFailure(errorMessage));
            Alert.alert('Signup Failed', errorMessage);
        }
    };

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.content}>
                    <Text style={styles.title}>Create Account</Text>
                    <Text style={styles.subtitle}>Sign up to get started</Text>

                    <View style={styles.form}>
                        <TextInput
                            style={styles.input}
                            placeholder="Username"
                            value={formData.username}
                            onChangeText={(value) => handleInputChange('username', value)}
                            autoCapitalize="none"
                            autoCorrect={false}
                        />

                        <TextInput
                            style={styles.input}
                            placeholder="Email"
                            value={formData.email}
                            onChangeText={(value) => handleInputChange('email', value)}
                            keyboardType="email-address"
                            autoCapitalize="none"
                            autoCorrect={false}
                        />

                        <TextInput
                            style={styles.input}
                            placeholder="Password"
                            value={formData.password}
                            onChangeText={(value) => handleInputChange('password', value)}
                            secureTextEntry
                            autoCapitalize="none"
                            autoCorrect={false}
                        />

                        <TextInput
                            style={styles.input}
                            placeholder="Confirm Password"
                            value={formData.confirmPassword}
                            onChangeText={(value) => handleInputChange('confirmPassword', value)}
                            secureTextEntry
                            autoCapitalize="none"
                            autoCorrect={false}
                        />

                        {error && (
                            <Text style={styles.errorText}>{error}</Text>
                        )}

                        <TouchableOpacity
                            style={[styles.button, isLoading && styles.buttonDisabled]}
                            onPress={handleSignup}
                            disabled={isLoading}
                        >
                            <Text style={styles.buttonText}>
                                {isLoading ? 'Creating Account...' : 'Sign Up'}
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.linkButton}
                            onPress={() => navigation.navigate('Login')}
                        >
                            <Text style={styles.linkText}>
                                Already have an account? Sign In
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    scrollContent: {
        flexGrow: 1,
        justifyContent: 'center',
    },
    content: {
        padding: 20,
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 8,
        color: '#333',
    },
    subtitle: {
        fontSize: 16,
        textAlign: 'center',
        marginBottom: 40,
        color: '#666',
    },
    form: {
        gap: 16,
    },
    input: {
        backgroundColor: 'white',
        padding: 16,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#ddd',
        fontSize: 16,
    },
    button: {
        backgroundColor: '#4CAF50',
        padding: 16,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 16,
    },
    buttonDisabled: {
        backgroundColor: '#ccc',
    },
    buttonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },
    linkButton: {
        alignItems: 'center',
        marginTop: 16,
    },
    linkText: {
        color: '#4CAF50',
        fontSize: 16,
    },
    errorText: {
        color: 'red',
        textAlign: 'center',
        marginTop: 8,
    },
});

export default LoginScreen;
export { SignupScreen };