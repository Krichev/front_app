// src/screens/LoginScreen.tsx - FIXED VERSION (Key parts)
import React, {useState} from 'react';
import {
    Alert,
    KeyboardAvoidingView,
    Platform,
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
import {useAppStyles} from '../shared/ui/hooks/useAppStyles';
import {createStyles, useStyles} from '../shared/ui/theme';

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
    const {screen, form, theme} = useAppStyles();
    const styles = useStyles(themeStyles);

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
            style={screen.container}>
            <View style={styles.formContainer}>
                <Text style={styles.title}>Welcome Back!</Text>
                <Text style={styles.subtitle}>Sign in to continue</Text>

                <TextInput
                    style={[form.input, styles.inputMargin]}
                    placeholder="Username"
                    placeholderTextColor={theme.colors.text.disabled}
                    value={formData.username}
                    onChangeText={value => handleInputChange('username', value)}
                    autoCapitalize="none"
                />

                <TextInput
                    style={[form.input, styles.inputMargin]}
                    placeholder="Password"
                    placeholderTextColor={theme.colors.text.disabled}
                    value={formData.password}
                    onChangeText={value => handleInputChange('password', value)}
                    secureTextEntry
                    autoCapitalize="none"
                />

                <TouchableOpacity
                    style={[form.submitButton, styles.buttonMargin, isLoading && form.submitButtonDisabled]}
                    onPress={handleLogin}
                    disabled={isLoading}>
                    <Text style={form.submitButtonText}>
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

const themeStyles = createStyles(theme => ({
    formContainer: {
        flex: 1,
        justifyContent: 'center',
        paddingHorizontal: theme.spacing['2xl'],
    },
    title: {
        ...theme.typography.heading.h2,
        color: theme.colors.text.primary,
        marginBottom: theme.spacing.sm,
    },
    subtitle: {
        ...theme.typography.body.medium,
        color: theme.colors.text.secondary,
        marginBottom: theme.spacing['3xl'],
    },
    inputMargin: {
        marginBottom: theme.spacing.lg,
    },
    buttonMargin: {
        marginTop: theme.spacing.sm,
    },
    signupButton: {
        marginTop: theme.spacing.lg,
        alignItems: 'center',
    },
    signupText: {
        ...theme.typography.body.small,
        color: theme.colors.text.secondary,
    },
    signupLink: {
        ...theme.typography.body.small,
        fontWeight: theme.typography.fontWeight.semibold,
        color: theme.colors.primary.main,
    },
}));

export default LoginScreen;