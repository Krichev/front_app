// src/screens/SignupScreen.tsx - Fixed with proper error handling
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
import {useTranslation} from 'react-i18next';
import {useSignupMutation} from "../entities/AuthState/model/slice/authApi.ts";
import {setTokens} from "../entities/AuthState/model/slice/authSlice.ts";
import {RootStackParamList} from "../navigation/AppNavigator.tsx";
import {theme} from '../shared/ui/theme';
import {isFetchBaseQueryError} from "../utils/errorHandler.ts";
import KeychainService from "../services/auth/KeychainService.ts";

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
    user?: {
        id: string;
        username: string;
        email: string;
        bio?: string;
        avatar?: string;
        createdAt?: string;
    };
}

const SignupScreen: React.FC<SignupScreenProps> = ({navigation}) => {
    const { t } = useTranslation();
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
            Alert.alert(t('common.error'), t('auth.fillAllFields'));
            return;
        }

        if (password !== confirmPassword) {
            Alert.alert(t('common.error'), t('auth.passwordsDoNotMatch'));
            return;
        }

        // Basic email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            Alert.alert(t('common.error'), t('auth.invalidEmail'));
            return;
        }

        // Password strength validation
        if (password.length < 6) {
            Alert.alert(t('common.error'), t('auth.passwordTooShort'));
            return;
        }

        try {
            const result = await signup({
                username: username.trim(),
                email: email.trim().toLowerCase(),
                password,
            }).unwrap() as SignupApiResponse;

            console.log('Signup API Response:', JSON.stringify(result, null, 2));

            // ✅ FIX: Check if result exists and has required properties
            if (!result) {
                throw new Error('No response received from server');
            }

            const {accessToken, refreshToken, user} = result;

            // ✅ FIX: Validate that we have tokens
            if (!accessToken || !refreshToken) {
                throw new Error('Invalid response: missing authentication tokens');
            }

            // ✅ FIX: Check if user object exists before accessing its properties
            if (!user || !user.id) {
                console.error('Invalid user data in response:', result);
                throw new Error('Invalid response: missing user information');
            }

            // Map API response to match User interface
            const mappedUser = {
                id: user.id,
                username: user.username || username.trim(),
                email: user.email || email.trim().toLowerCase(),
                bio: user.bio,
                avatar: user.avatar,
                createdAt: user.createdAt || new Date().toISOString(),
            };

            console.log('Mapped user data:', mappedUser);

            // Store tokens securely
            await KeychainService.saveAuthTokens({
                accessToken,
                refreshToken,
                user: mappedUser
            });

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
            console.error('Error details:', JSON.stringify(err, null, 2));

            // Enhanced error handling with more context
            let errorMessage = t('auth.genericError');

            if (err?.data?.message) {
                errorMessage = err.data.message;
            } else if (err?.message) {
                errorMessage = err.message;
            } else if (err?.status === 'FETCH_ERROR') {
                errorMessage = t('errors.networkError');
            } else if (err?.status === 400) {
                errorMessage = t('auth.invalidCredentials'); // Or generic bad request
            } else if (err?.status === 409) {
                errorMessage = t('auth.usernameOrEmailExists');
            } else if (err?.status === 500) {
                errorMessage = t('errors.serverError');
            }

            Alert.alert(t('auth.signupFailed'), errorMessage);
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
            >
                {/* Logo/Brand Section */}
                <View style={styles.logoContainer}>
                    <Image
                        source={require('../../assets/logo.png')}
                        style={styles.logo}
                        resizeMode="contain"
                    />
                    <Text style={styles.appName}>Challenger</Text>
                </View>

                {/* Form Container */}
                <View style={styles.formContainer}>
                    <Text style={styles.title}>{t('auth.createAccount')}</Text>

                    {/* Username Input */}
                    <View style={styles.inputContainer}>
                        <Text style={styles.label}>{t('auth.username')}</Text>
                        <TextInput
                            style={[
                                styles.input,
                                focusedInput === 'username' && styles.inputFocused
                            ]}
                            placeholder={t('auth.chooseUsername')}
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
                        <Text style={styles.label}>{t('auth.email')}</Text>
                        <TextInput
                            style={[
                                styles.input,
                                focusedInput === 'email' && styles.inputFocused
                            ]}
                            placeholder={t('auth.enterEmail')}
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
                        <Text style={styles.label}>{t('auth.password')}</Text>
                        <TextInput
                            style={[
                                styles.input,
                                focusedInput === 'password' && styles.inputFocused
                            ]}
                            placeholder={t('auth.enterPassword')}
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
                        <Text style={styles.label}>{t('auth.confirmPassword')}</Text>
                        <TextInput
                            style={[
                                styles.input,
                                focusedInput === 'confirmPassword' && styles.inputFocused
                            ]}
                            placeholder={t('auth.confirmPasswordPlaceholder')}
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
                            {isLoading ? t('auth.creatingAccount') : t('auth.signup')}
                        </Text>
                    </TouchableOpacity>

                    {/* Error Display */}
                    {Boolean(error) && (
                        <View style={styles.errorContainer}>
                            <Text style={styles.errorText}>
                                {isFetchBaseQueryError(error)
                                    ? (error.data as { message?: string })?.message ?? t('auth.signupFailed')
                                    : t('errors.networkError')}
                            </Text>
                        </View>
                    )}
                </View>

                {/* Login Link */}
                <View style={styles.loginContainer}>
                    <Text style={styles.loginText}>{t('auth.hasAccount')} </Text>
                    <TouchableOpacity onPress={handleLoginNavigation} activeOpacity={0.7}>
                        <Text style={styles.loginLink}>{t('auth.signInLink')}</Text>
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