// src/screens/LoginScreen.tsx - FIXED VERSION (Key parts)
import React, {useState} from 'react';
import {
    Alert,
    KeyboardAvoidingView,
    Platform,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import {useDispatch} from 'react-redux';
import {setTokens} from '../entities/AuthState/model/slice/authSlice';
import {useLoginMutation} from '../entities/AuthState/model/slice/authApi';
import {useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {RootStackParamList} from '../navigation/AppNavigator';
import KeychainService from '../services/auth/KeychainService';

interface FormData {
    username: string;
    password: string;
}

interface LoginApiResponse {
    accessToken: string;
    refreshToken: string;
    user: {
        id: string;
        username: string;
        email: string;
        bio?: string;
        avatar?: string;
        createdAt?: string;
    };
}

type LoginScreenNavigationProp = NativeStackNavigationProp<
    RootStackParamList,
    'Login'
>;

const LoginScreen: React.FC = () => {
    const dispatch = useDispatch();
    const navigation = useNavigation<LoginScreenNavigationProp>();
    const [login, {isLoading}] = useLoginMutation();

    const [formData, setFormData] = useState<FormData>({
        username: '',
        password: '',
    });

    const handleInputChange = (field: keyof FormData, value: string): void => {
        setFormData(prevData => ({
            ...prevData,
            [field]: value,
        }));
    };

    const handleLogin = async (): Promise<void> => {
        const {username, password} = formData;

        if (!username.trim() || !password.trim()) {
            Alert.alert('Error', 'Please fill in all fields');
            return;
        }

        try {
            const result = (await login({username, password}).unwrap()) as LoginApiResponse;
            const {accessToken, refreshToken, user} = result;

            // Map API response to match User interface
            const mappedUser = {
                id: user.id,
                username: user.username,
                email: user.email,
                bio: user.bio,
                avatar: user.avatar,
                createdAt: user.createdAt,
            };

            // Store tokens securely using singleton KeychainService
            await KeychainService.saveAuthTokens({
                accessToken,
                refreshToken,
                user: mappedUser,
            });

            // Update Redux state - AuthNavigationHandler will handle navigation
            dispatch(
                setTokens({
                    accessToken,
                    refreshToken,
                    user: mappedUser,
                }),
            );

            // Reset form
            setFormData({username: '', password: ''});

            console.log(
                '✅ Login successful, tokens stored securely',
            );
        } catch (err: any) {
            console.error('❌ Login error:', err);
            const errorMessage =
                err?.data?.message || err?.message || 'Invalid credentials';
            Alert.alert('Login Failed', errorMessage);
        }
    };

    const handleSignupNavigation = (): void => {
        navigation.navigate('Signup');
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.container}>
            <View style={styles.formContainer}>
                <Text style={styles.title}>Welcome Back!</Text>
                <Text style={styles.subtitle}>Sign in to continue</Text>

                <TextInput
                    style={styles.input}
                    placeholder="Username"
                    placeholderTextColor="#999"
                    value={formData.username}
                    onChangeText={value => handleInputChange('username', value)}
                    autoCapitalize="none"
                />

                <TextInput
                    style={styles.input}
                    placeholder="Password"
                    placeholderTextColor="#999"
                    value={formData.password}
                    onChangeText={value => handleInputChange('password', value)}
                    secureTextEntry
                    autoCapitalize="none"
                />

                <TouchableOpacity
                    style={[styles.button, isLoading && styles.buttonDisabled]}
                    onPress={handleLogin}
                    disabled={isLoading}>
                    <Text style={styles.buttonText}>
                        {isLoading ? 'Logging in...' : 'Login'}
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.signupButton}
                    onPress={handleSignupNavigation}>
                    <Text style={styles.signupText}>
                        Don't have an account? <Text style={styles.signupLink}>Sign Up</Text>
                    </Text>
                </TouchableOpacity>
            </View>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    formContainer: {
        flex: 1,
        justifyContent: 'center',
        paddingHorizontal: 24,
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        color: '#666',
        marginBottom: 32,
    },
    input: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        padding: 16,
        marginBottom: 16,
        fontSize: 16,
        color: '#333',
    },
    button: {
        backgroundColor: '#4CAF50',
        padding: 16,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 8,
    },
    buttonDisabled: {
        backgroundColor: '#ccc',
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    signupButton: {
        marginTop: 16,
        alignItems: 'center',
    },
    signupText: {
        color: '#666',
        fontSize: 14,
    },
    signupLink: {
        color: '#4CAF50',
        fontWeight: '600',
    },
});

export default LoginScreen;