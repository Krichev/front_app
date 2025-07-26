// src/screens/SignupScreen.tsx
import React, {useState} from 'react';
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
import {StackNavigationProp} from '@react-navigation/stack';
import {useDispatch, useSelector} from 'react-redux';
import * as Keychain from 'react-native-keychain';
import {useSignupMutation} from '../entities/AuthState/model/slice/authApi';
import {loginFailure, loginStart, loginSuccess} from '../entities/AuthState/model/slice/authSlice';
import {RootState} from '../app/providers/StoreProvider/store';
import {RootStackParamList} from '../navigation/AppNavigator';
import {isApiSignupResponse, UserMapper, UserMappingError} from '../utils/userMapping';

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

    const [signup, { isLoading: apiLoading }] = useSignupMutation();
    const dispatch = useDispatch();

    // Get loading and error state from Redux
    const { isLoading, error } = useSelector((state: RootState) => state.auth);

    const handleInputChange = (field: keyof FormData, value: string): void => {
        setFormData({
            ...formData,
            [field]: value,
        });
    };

    const validateInput = (): string | null => {
        const { username, email, password, confirmPassword } = formData;

        // Check if all fields are filled
        if (!username.trim() || !email.trim() || !password.trim() || !confirmPassword.trim()) {
            return 'Please fill in all fields';
        }

        // Username validation
        if (username.trim().length < 3) {
            return 'Username must be at least 3 characters long';
        }

        if (!/^[a-zA-Z0-9_]+$/.test(username.trim())) {
            return 'Username can only contain letters, numbers, and underscores';
        }

        // Email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email.trim())) {
            return 'Please enter a valid email address';
        }

        // Password validation
        if (password.length < 6) {
            return 'Password must be at least 6 characters long';
        }

        if (password !== confirmPassword) {
            return 'Passwords do not match';
        }

        // Strong password check (optional)
        const hasUpperCase = /[A-Z]/.test(password);
        const hasLowerCase = /[a-z]/.test(password);
        const hasNumbers = /\d/.test(password);

        if (!hasUpperCase || !hasLowerCase || !hasNumbers) {
            return 'Password must contain at least one uppercase letter, one lowercase letter, and one number';
        }

        return null; // No validation errors
    };

    const handleSignup = async (): Promise<void> => {
        // Validate input
        const validationError = validateInput();
        if (validationError) {
            Alert.alert('Validation Error', validationError);
            return;
        }

        const { username, email, password } = formData;

        try {
            dispatch(loginStart());

            // Make API call
            const apiResponse = await signup({
                username,  // Some APIs might expect 'name' instead of 'username'
                email,
                password
            }).unwrap();

            console.log('Signup API Response:', apiResponse);

            // Validate API response format
            if (!isApiSignupResponse(apiResponse)) {
                console.error('Invalid signup response format:', apiResponse);
                throw new UserMappingError('Invalid signup response format', apiResponse);
            }

            // Map API response to our internal User type
            const authData = UserMapper.mapApiSignupResponse(apiResponse);

            console.log('Mapped auth data:', authData);

            // Additional validation of mapped data
            if (!authData.user.username || !authData.user.createdAt) {
                console.error('Mapped user data is incomplete:', authData.user);
                throw new UserMappingError('Mapped user data is incomplete', authData.user);
            }

            // Store authentication data in Keychain
            await Keychain.setGenericPassword(
                'authData',
                JSON.stringify(authData)
            );

            // Update Redux state with properly typed data
            dispatch(loginSuccess(authData));

            // Show success message
            Alert.alert(
                'Account Created Successfully!',
                `Welcome ${authData.user.username}! Your account has been created.`,
                [
                    {
                        text: 'Continue',
                        onPress: () => {
                            navigation.reset({
                                index: 0,
                                routes: [{ name: 'Main' }],
                            });
                        }
                    }
                ]
            );

        } catch (err: any) {
            console.error('Signup error:', err);

            let errorMessage = 'Signup failed';

            if (err instanceof UserMappingError) {
                errorMessage = 'Invalid response from server. Please try again.';
                console.error('User mapping error details:', err.originalData);
            } else if (err?.data?.message) {
                errorMessage = err.data.message;
            } else if (err?.message) {
                errorMessage = err.message;
            } else if (err?.data?.error) {
                errorMessage = err.data.error;
            }

            dispatch(loginFailure(errorMessage));

            Alert.alert('Signup Failed', errorMessage);
        }
    };

    const isFormValid = (): boolean => {
        const { username, email, password, confirmPassword } = formData;
        return username.trim().length > 0 &&
            email.trim().length > 0 &&
            password.length > 0 &&
            confirmPassword.length > 0;
    };

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <ScrollView
                contentContainerStyle={styles.scrollContent}
                keyboardShouldPersistTaps="handled"
            >
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
                            autoComplete="username"
                            maxLength={30}
                        />

                        <TextInput
                            style={styles.input}
                            placeholder="Email Address"
                            value={formData.email}
                            onChangeText={(value) => handleInputChange('email', value)}
                            keyboardType="email-address"
                            autoCapitalize="none"
                            autoCorrect={false}
                            autoComplete="email"
                        />

                        <TextInput
                            style={styles.input}
                            placeholder="Password"
                            value={formData.password}
                            onChangeText={(value) => handleInputChange('password', value)}
                            secureTextEntry
                            autoCapitalize="none"
                            autoCorrect={false}
                            autoComplete="password-new"
                        />

                        <TextInput
                            style={styles.input}
                            placeholder="Confirm Password"
                            value={formData.confirmPassword}
                            onChangeText={(value) => handleInputChange('confirmPassword', value)}
                            secureTextEntry
                            autoCapitalize="none"
                            autoCorrect={false}
                            autoComplete="password-new"
                        />

                        <Text style={styles.passwordRequirements}>
                            Password must be at least 6 characters with uppercase, lowercase, and numbers
                        </Text>

                        {error && (
                            <View style={styles.errorContainer}>
                                <Text style={styles.errorText}>{error}</Text>
                            </View>
                        )}

                        <TouchableOpacity
                            style={[
                                styles.button,
                                (!isFormValid() || isLoading) && styles.buttonDisabled
                            ]}
                            onPress={handleSignup}
                            disabled={!isFormValid() || isLoading}
                        >
                            <Text style={styles.buttonText}>
                                {isLoading ? 'Creating Account...' : 'Sign Up'}
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.linkButton}
                            onPress={() => navigation.navigate('Login')}
                            disabled={isLoading}
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
        color: '#333',
    },
    passwordRequirements: {
        fontSize: 12,
        color: '#666',
        textAlign: 'center',
        marginTop: -8,
        marginBottom: 8,
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
    errorContainer: {
        backgroundColor: '#ffebee',
        padding: 12,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#ffcdd2',
    },
    errorText: {
        color: '#c62828',
        textAlign: 'center',
        fontSize: 14,
    },
});

export default SignupScreen;