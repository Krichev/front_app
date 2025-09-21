// src/screens/SignupScreen.tsx - Refactored with Theme Integration & Proper RTK Query Error Handling
import React, {useState} from 'react';
import {
    Alert,
    Image,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import {StackNavigationProp} from '@react-navigation/stack';
import {useDispatch} from 'react-redux';
import * as Keychain from 'react-native-keychain';
import {useSignupMutation} from "../entities/AuthState/model/slice/authApi.ts";
import {setTokens} from "../entities/AuthState/model/slice/authSlice.ts";
import {RootStackParamList} from "../navigation/AppNavigator.tsx";
import {theme} from '../shared/ui/theme';
import {isFetchBaseQueryError} from "../utils/errorHandler.ts";

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

// Type for API response (what the server actually returns)
interface SignupApiResponse {
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

const SignupScreen: React.FC<SignupScreenProps> = ({navigation}) => {
    const [formData, setFormData] = useState<FormData>({
        username: '',
        email: '',
        password: '',
        confirmPassword: '',
    });
    const [focusedInput, setFocusedInput] = useState<keyof FormData | null>(null);
    const [signup, {isLoading, error}] = useSignupMutation();
    const dispatch = useDispatch();

    const handleInputChange = (field: keyof FormData, value: string): void => {
        setFormData(prevData => ({
            ...prevData,
            [field]: value,
        }));
    };

    const handleSignup = async (): Promise<void> => {
        const {username, email, password, confirmPassword} = formData;

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
            const result = await signup({
                username: username.trim(),
                email: email.trim().toLowerCase(),
                password,
            }).unwrap() as SignupApiResponse;

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
            setFormData({
                username: '',
                email: '',
                password: '',
                confirmPassword: '',
            });

            console.log('Signup successful, Bearer token will be added automatically to future requests');

        } catch (err: any) {
            console.error('Signup error:', err);
            // For catch block errors, we handle them directly since they're not RTK Query errors
            const errorMessage = err?.data?.message || err?.message || 'Signup failed. Please try again.';
            Alert.alert('Signup Failed', errorMessage);
        }
    };

    const handleLoginNavigation = (): void => {
        navigation.navigate('Login');
    };

    const isFormValid = (): boolean => {
        const {username, email, password, confirmPassword} = formData;
        return Boolean(
            username.trim() &&
            email.trim() &&
            password.trim() &&
            confirmPassword.trim() &&
            password === confirmPassword
        );
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
                {/* Logo Section */}
                <View style={styles.logoContainer}>
                    <Image
                        source={require('../../assets/logo.png')}
                        style={styles.logo}
                        resizeMode="contain"
                    />
                    <Text style={styles.appName}>ChallengeApp</Text>
                </View>

                {/* Form Section */}
                <View style={styles.formContainer}>
                    <Text style={styles.title}>Create Account</Text>

                    {/* Username Input */}
                    <View style={styles.inputContainer}>
                        <Text style={styles.label}>Username</Text>
                        <TextInput
                            style={[
                                styles.input,
                                focusedInput === 'username' && styles.inputFocused
                            ]}
                            placeholder="Enter your username"
                            placeholderTextColor={theme.colors.text.disabled}
                            value={formData.username}
                            onChangeText={(value) => handleInputChange('username', value)}
                            onFocus={() => setFocusedInput('username')}
                            onBlur={() => setFocusedInput(null)}
                            autoCapitalize="none"
                            autoCorrect={false}
                            textContentType="username"
                            returnKeyType="next"
                        />
                    </View>

                    {/* Email Input */}
                    <View style={styles.inputContainer}>
                        <Text style={styles.label}>Email Address</Text>
                        <TextInput
                            style={[
                                styles.input,
                                focusedInput === 'email' && styles.inputFocused
                            ]}
                            placeholder="Enter your email"
                            placeholderTextColor={theme.colors.text.disabled}
                            value={formData.email}
                            onChangeText={(value) => handleInputChange('email', value)}
                            onFocus={() => setFocusedInput('email')}
                            onBlur={() => setFocusedInput(null)}
                            keyboardType="email-address"
                            autoCapitalize="none"
                            autoCorrect={false}
                            textContentType="emailAddress"
                            returnKeyType="next"
                        />
                    </View>

                    {/* Password Input */}
                    <View style={styles.inputContainer}>
                        <Text style={styles.label}>Password</Text>
                        <TextInput
                            style={[
                                styles.input,
                                focusedInput === 'password' && styles.inputFocused
                            ]}
                            placeholder="Enter your password"
                            placeholderTextColor={theme.colors.text.disabled}
                            value={formData.password}
                            onChangeText={(value) => handleInputChange('password', value)}
                            onFocus={() => setFocusedInput('password')}
                            onBlur={() => setFocusedInput(null)}
                            secureTextEntry
                            autoCapitalize="none"
                            autoCorrect={false}
                            textContentType="newPassword"
                            returnKeyType="next"
                        />
                    </View>

                    {/* Confirm Password Input */}
                    <View style={styles.inputContainer}>
                        <Text style={styles.label}>Confirm Password</Text>
                        <TextInput
                            style={[
                                styles.input,
                                focusedInput === 'confirmPassword' && styles.inputFocused
                            ]}
                            placeholder="Confirm your password"
                            placeholderTextColor={theme.colors.text.disabled}
                            value={formData.confirmPassword}
                            onChangeText={(value) => handleInputChange('confirmPassword', value)}
                            onFocus={() => setFocusedInput('confirmPassword')}
                            onBlur={() => setFocusedInput(null)}
                            secureTextEntry
                            autoCapitalize="none"
                            autoCorrect={false}
                            textContentType="newPassword"
                            returnKeyType="done"
                            onSubmitEditing={handleSignup}
                        />
                    </View>

                    {/* Signup Button */}
                    <TouchableOpacity
                        style={[
                            styles.signupButton,
                            (isLoading || !isFormValid()) && styles.signupButtonDisabled
                        ]}
                        onPress={handleSignup}
                        disabled={isLoading || !isFormValid()}
                        activeOpacity={0.8}
                    >
                        <Text style={[
                            styles.signupButtonText,
                            (isLoading || !isFormValid()) && styles.signupButtonTextDisabled
                        ]}>
                            {isLoading ? 'Creating Account...' : 'Sign Up'}
                        </Text>
                    </TouchableOpacity>

                    {/* Error Display - Using RTK Query type guard for proper error handling */}
                    {Boolean(error) && (
                        <View style={styles.errorContainer}>
                            <Text style={styles.errorText}>
                                {isFetchBaseQueryError(error)
                                    ? (error.data as { message?: string })?.message ?? "Signup failed"
                                    : "Network error"}
                            </Text>
                        </View>
                    )}
                </View>

                {/* Login Link */}
                <View style={styles.loginContainer}>
                    <Text style={styles.loginText}>Already have an account? </Text>
                    <TouchableOpacity onPress={handleLoginNavigation} activeOpacity={0.7}>
                        <Text style={styles.loginLink}>Sign In</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background.primary,
    },

    scrollContent: {
        flexGrow: 1,
        justifyContent: 'center',
        paddingHorizontal: theme.spacing.xl,
        paddingVertical: theme.spacing.lg,
    },

    logoContainer: {
        alignItems: 'center',
        marginBottom: theme.spacing.xl,
    },

    logo: {
        width: 100,
        height: 100,
        marginBottom: theme.spacing.sm,
    },

    appName: {
        ...theme.typography.heading.h6,
        color: theme.colors.text.primary,
        fontWeight: theme.typography.fontWeight.bold,
        textAlign: 'center',
    },

    formContainer: {
        marginBottom: theme.spacing.xl,
    },

    title: {
        ...theme.typography.heading.h3,
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

    signupButton: {
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

    signupButtonDisabled: {
        backgroundColor: theme.colors.neutral.gray[300],
        ...theme.shadows.none,
    },

    signupButtonText: {
        ...theme.components.button.text.primary,
        color: theme.colors.primary.contrast,
        fontSize: theme.typography.fontSize.lg,
        fontWeight: theme.typography.fontWeight.semibold,
        fontFamily: theme.typography.fontFamily.primary,
    },

    signupButtonTextDisabled: {
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

    loginContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: theme.spacing.lg,
    },

    loginText: {
        ...theme.typography.body.medium,
        color: theme.colors.text.secondary,
    },

    loginLink: {
        ...theme.typography.body.medium,
        color: theme.colors.primary.main,
        fontWeight: theme.typography.fontWeight.semibold,
        textDecorationLine: 'underline',
    },
});

export default SignupScreen;