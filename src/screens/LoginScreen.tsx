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
import {useTranslation} from 'react-i18next';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {RootStackParamList} from '../navigation/AppNavigator';
import KeychainService from '../services/auth/KeychainService';
import {useAppStyles} from '../shared/ui/hooks/useAppStyles';
import {createStyles} from '../shared/ui/theme';

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
    const { t } = useTranslation();
    const dispatch = useDispatch();
    const navigation = useNavigation<LoginScreenNavigationProp>();
    const [login, {isLoading}] = useLoginMutation();
    const {screen, form, theme} = useAppStyles();
    const styles = themeStyles;

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
            Alert.alert(t('common.error'), t('auth.fillAllFields'));
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
            
            let errorMessage: string;
            
            if (err?.data?.message) {
                // Server provided a specific message (e.g., "Invalid username or password")
                errorMessage = err.data.message;
            } else if (err?.status === 401) {
                errorMessage = t('auth.invalidCredentials');
            } else if (err?.status === 'FETCH_ERROR') {
                errorMessage = t('errors.networkError');
            } else if (err?.status >= 500) {
                errorMessage = t('errors.serverError');
            } else {
                errorMessage = t('auth.invalidCredentials');
            }
            
            Alert.alert(t('auth.loginFailed'), errorMessage);
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
                <Text style={styles.title}>{t('auth.welcomeBack')}</Text>
                <Text style={styles.subtitle}>{t('auth.signInSubtitle')}</Text>

                <TextInput
                    style={[form.input, styles.inputMargin]}
                    placeholder={t('auth.username')}
                    placeholderTextColor={theme.colors.text.disabled}
                    value={formData.username}
                    onChangeText={value => handleInputChange('username', value)}
                    autoCapitalize="none"
                />

                <TextInput
                    style={[form.input, styles.inputMargin]}
                    placeholder={t('auth.password')}
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
                        {isLoading ? t('auth.loggingIn') : t('auth.login')}
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.signupButton}
                    onPress={handleSignupNavigation}>
                    <Text style={styles.signupText}>
                        {t('auth.noAccount')} <Text style={styles.signupLink}>{t('auth.signup')}</Text>
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
