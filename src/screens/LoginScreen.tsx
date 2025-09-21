// src/screens/LoginScreen.tsx - Refactored with Theme Integration & Proper RTK Query Error Handling
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
import {theme} from '../shared/ui/theme';
import {isFetchBaseQueryError} from "../utils/errorHandler.ts";

type LoginScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Login'>;

interface LoginScreenProps {
    navigation: LoginScreenNavigationProp;
}

interface FormData {
    username: string;
    password: string;
}

// Type for API response (what the server actually returns)
interface LoginApiResponse {
    accessToken: string;
    refreshToken: string;
    user: {
        id: string;
        username: string; // API returns 'name'
        email: string;
        bio?: string;
        avatar?: string;
        createdAt?: string;
    };
}

const LoginScreen: React.FC<LoginScreenProps> = ({navigation}) => {
    const [formData, setFormData] = useState<FormData>({username: '', password: ''});
    const [login, {isLoading, error}] = useLoginMutation();
    const dispatch = useDispatch();

    useEffect(() => {
        const checkTokens = async () => {
            try {
                const credentials = await Keychain.getGenericPassword();
                if (credentials) {
                    console.log(credentials);
                    const storedData = JSON.parse(credentials.password);
                    const {accessToken, refreshToken, user} = storedData;

                    // Map stored user to match User interface
                    // Handle backward compatibility: older stored data might have 'name' or 'username'
                    const mappedUser = {
                        id: user.id,
                        username: user.username, // Handle both cases for backward compatibility
                        email: user.email,
                        bio: user.bio,
                        avatar: user.avatar,
                        createdAt: user.createdAt,
                        statsCompleted: user.statsCompleted,
                        statsCreated: user.statsCreated,
                        statsSuccess: user.statsSuccess,
                    };

                    dispatch(setTokens({
                        accessToken,
                        refreshToken,
                        user: mappedUser
                    }));
                }
            } catch (err) {
                console.log('Error checking stored tokens:', err);
            }
        };
        checkTokens();
    }, [dispatch]);

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
            const result = await login({username, password}).unwrap() as LoginApiResponse;
            const {accessToken, refreshToken, user} = result;

            // Map API response to match User interface
            // Note: API returns 'name' field, but our app uses 'username' consistently
            const mappedUser = {
                id: user.id,
                username: user.username, // Map 'name' from API to 'username' for our app
                email: user.email,
                bio: user.bio,
                avatar: user.avatar,
                createdAt: user.createdAt,
            };

            // Store tokens securely
            await Keychain.setGenericPassword('authTokens', JSON.stringify({
                accessToken,
                refreshToken,
                user: mappedUser
            }));

            // Update Redux state - AuthNavigationHandler will handle navigation
            dispatch(setTokens({
                accessToken,
                refreshToken,
                user: mappedUser
            }));

            // Reset form
            setFormData({username: '', password: ''});

            console.log('Login successful, Bearer token will be added automatically to future requests');

        } catch (err: any) {
            console.error('Login error:', err);
            // For catch block errors, we handle them directly since they're not RTK Query errors
            const errorMessage = err?.data?.message || err?.message || 'Invalid credentials';
            Alert.alert('Login Failed', errorMessage);
        }
    };

    const handleSignupNavigation = (): void => {
        navigation.navigate('Signup');
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.container}
        >
            <ScrollView
                contentContainerStyle={styles.scrollContent}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
            >
                {/* App Logo Section */}
                <View style={styles.logoContainer}>
                    <Text style={styles.appName}>TaskBuddy</Text>
                    <Text style={styles.appSubtitle}>Welcome back to your productivity companion</Text>
                </View>

                {/* Login Form */}
                <View style={styles.formContainer}>
                    <Text style={styles.title}>Sign In</Text>

                    {/* Username Input */}
                    <View style={styles.inputContainer}>
                        <Text style={styles.label}>Username</Text>
                        <TextInput
                            style={[
                                styles.input,
                                formData.username && styles.inputFocused
                            ]}
                            placeholder="Enter your username"
                            placeholderTextColor={theme.colors.text.disabled}
                            value={formData.username}
                            onChangeText={(value) => handleInputChange('username', value)}
                            autoCapitalize="none"
                            autoCorrect={false}
                            textContentType="username"
                            returnKeyType="next"
                        />
                    </View>

                    {/* Password Input */}
                    <View style={styles.inputContainer}>
                        <Text style={styles.label}>Password</Text>
                        <TextInput
                            style={[
                                styles.input,
                                formData.password && styles.inputFocused
                            ]}
                            placeholder="Enter your password"
                            placeholderTextColor={theme.colors.text.disabled}
                            value={formData.password}
                            onChangeText={(value) => handleInputChange('password', value)}
                            secureTextEntry
                            autoCapitalize="none"
                            autoCorrect={false}
                            textContentType="password"
                            returnKeyType="done"
                            onSubmitEditing={handleLogin}
                        />
                    </View>

                    {/* Login Button */}
                    <TouchableOpacity
                        style={[
                            styles.loginButton,
                            isLoading && styles.loginButtonDisabled
                        ]}
                        onPress={handleLogin}
                        disabled={isLoading}
                        activeOpacity={0.8}
                    >
                        <Text style={[
                            styles.loginButtonText,
                            isLoading && styles.loginButtonTextDisabled
                        ]}>
                            {isLoading ? 'Signing In...' : 'Sign In'}
                        </Text>
                    </TouchableOpacity>

                    {/* Error Display - Using RTK Query type guard for proper error handling */}
                    {Boolean(error) && (
                        <View style={styles.errorContainer}>
                            <Text style={styles.errorText}>
                                {isFetchBaseQueryError(error)
                                    ? (error.data as { message?: string })?.message ?? "Login failed"
                                    : "Network error"}
                            </Text>
                        </View>
                    )}
                </View>

                {/* Sign Up Link */}
                <View style={styles.signupContainer}>
                    <Text style={styles.signupText}>Don't have an account? </Text>
                    <TouchableOpacity
                        onPress={handleSignupNavigation}
                        activeOpacity={0.7}
                    >
                        <Text style={styles.signupLink}>Sign Up</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
};

// Theme-aware styles using StyleSheet.create with theme
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background.primary,
    },

    scrollContent: {
        flexGrow: 1,
        justifyContent: 'center',
        paddingHorizontal: theme.spacing.lg,
        paddingVertical: theme.spacing.xl,
    },

    logoContainer: {
        alignItems: 'center',
        marginBottom: theme.spacing['2xl'],
    },

    appName: {
        ...theme.typography.heading.h1,
        color: theme.colors.text.primary,
        marginBottom: theme.spacing.xs,
        fontWeight: theme.typography.fontWeight.bold,
    },

    appSubtitle: {
        ...theme.typography.body.large,
        color: theme.colors.text.secondary,
        textAlign: 'center',
        marginHorizontal: theme.spacing.md,
    },

    formContainer: {
        marginBottom: theme.spacing.xl,
    },

    title: {
        ...theme.typography.heading.h2,
        color: theme.colors.text.primary,
        textAlign: 'center',
        marginBottom: theme.spacing.xl,
        fontWeight: theme.typography.fontWeight.semibold,
    },

    inputContainer: {
        marginBottom: theme.spacing.lg,
    },

    label: {
        ...theme.typography.body.medium,
        color: theme.colors.text.primary,
        marginBottom: theme.spacing.xs,
        fontWeight: theme.typography.fontWeight.medium,
    },

    input: {
        ...theme.components.input.field,
        borderWidth: theme.layout.borderWidth.thin,
        borderColor: theme.colors.border.main,
        borderRadius: theme.layout.borderRadius.md,
        paddingHorizontal: theme.spacing.md,
        paddingVertical: theme.spacing.sm,
        fontSize: theme.typography.fontSize.base,
        color: theme.colors.text.primary,
        backgroundColor: theme.colors.background.primary,
        fontFamily: theme.typography.fontFamily.primary,
    },

    inputFocused: {
        borderColor: theme.colors.primary.main,
        borderWidth: theme.layout.borderWidth.thick,
        ...theme.shadows.small,
    },

    loginButton: {
        ...theme.components.button.base,
        ...theme.components.button.variants.primary,
        backgroundColor: theme.colors.primary.main,
        paddingVertical: theme.spacing.md,
        paddingHorizontal: theme.spacing.lg,
        borderRadius: theme.layout.borderRadius.md,
        marginTop: theme.spacing.lg,
        alignItems: 'center',
        justifyContent: 'center',
        ...theme.shadows.medium,
    },

    loginButtonDisabled: {
        backgroundColor: theme.colors.neutral.gray[300],
        ...theme.shadows.none,
    },

    loginButtonText: {
        ...theme.components.button.text.primary,
        color: theme.colors.primary.contrast,
        fontSize: theme.typography.fontSize.lg,
        fontWeight: theme.typography.fontWeight.semibold,
        fontFamily: theme.typography.fontFamily.primary,
    },

    loginButtonTextDisabled: {
        color: theme.colors.text.disabled,
    },

    errorContainer: {
        marginTop: theme.spacing.md,
        padding: theme.spacing.sm,
        backgroundColor: theme.colors.error.background,
        borderRadius: theme.layout.borderRadius.sm,
        borderLeftWidth: theme.layout.borderWidth.thick,
        borderLeftColor: theme.colors.error.main,
    },

    errorText: {
        ...theme.typography.body.small,
        color: theme.colors.error.main,
        textAlign: 'center',
        fontWeight: theme.typography.fontWeight.medium,
    },

    signupContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: theme.spacing.lg,
    },

    signupText: {
        ...theme.typography.body.medium,
        color: theme.colors.text.secondary,
    },

    signupLink: {
        ...theme.typography.body.medium,
        color: theme.colors.primary.main,
        fontWeight: theme.typography.fontWeight.semibold,
        textDecorationLine: 'underline',
    },
});

export default LoginScreen;