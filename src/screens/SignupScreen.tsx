// Updated navigation in SignupScreen.tsx
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

type SignupScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Signup'>;

interface SignupScreenProps {
    navigation: SignupScreenNavigationProp;
}

// Define interface for form state
interface FormData {
    username: string;
    email: string;
    password: string;
    confirmPassword: string;
}

const SignupScreen: React.FC<SignupScreenProps> = ({navigation}) => {
    const [formData, setFormData] = useState<FormData>({
        username: '',
        email: '',
        password: '',
        confirmPassword: '',
    });
    const [signup, {isLoading}] = useSignupMutation();
    const dispatch = useDispatch();

    const handleInputChange = (field: keyof FormData, value: string): void => {
        setFormData({
            ...formData,
            [field]: value,
        });
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

        try {
            // Attempt Signup
            const result = await signup({username, email, password}).unwrap();
            const {accessToken, refreshToken, user} = result;

            // Securely Store Tokens
            await Keychain.setGenericPassword('authTokens', JSON.stringify({accessToken, refreshToken}));

            // Update Auth State
            dispatch(setTokens({accessToken, refreshToken, user}));

            // Navigate to Main with Home tab
            navigation.navigate('Main', { screen: 'Home' });

            // Reset Form (Optional)
            setFormData({
                username: '',
                email: '',
                password: '',
                confirmPassword: '',
            });
        } catch (err: any) {
            const errorMessage = err.data?.message || 'An error occurred during signup';
            Alert.alert('Signup Failed', errorMessage);
        }
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
                {/* App Logo */}
                <View style={styles.logoContainer}>
                    <Image
                        source={require('../../assets/logo.png')}
                        style={styles.logo}
                        resizeMode="contain"
                    />
                    <Text style={styles.appName}>TaskBuddy</Text>
                </View>

                {/* Signup Form */}
                <View style={styles.formContainer}>
                    <Text style={styles.title}>Create Account</Text>

                    <View style={styles.inputContainer}>
                        <Text style={styles.label}>Full Name</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Enter your full name"
                            value={formData.username}
                            onChangeText={(value) => handleInputChange('username', value)}
                        />
                    </View>

                    <View style={styles.inputContainer}>
                        <Text style={styles.label}>Email</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Enter your email"
                            keyboardType="email-address"
                            autoCapitalize="none"
                            value={formData.email}
                            onChangeText={(value) => handleInputChange('email', value)}
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

                    <View style={styles.inputContainer}>
                        <Text style={styles.label}>Confirm Password</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Confirm your password"
                            secureTextEntry
                            value={formData.confirmPassword}
                            onChangeText={(value) => handleInputChange('confirmPassword', value)}
                        />
                    </View>

                    <TouchableOpacity
                        style={[styles.signupButton, isLoading && styles.disabledButton]}
                        onPress={handleSignup}
                        disabled={isLoading}
                    >
                        <Text style={styles.signupButtonText}>
                            {isLoading ? 'Creating Account...' : 'Sign Up'}
                        </Text>
                    </TouchableOpacity>
                </View>

                {/* Login Option */}
                <View style={styles.loginContainer}>
                    <Text style={styles.loginText}>Already have an account? </Text>
                    <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                        <Text style={styles.loginLink}>Log In</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
};


const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f9f9f9',
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
    logo: {
        width: 90,
        height: 90,
    },
    appName: {
        fontSize: 24,
        fontWeight: 'bold',
        marginTop: 10,
        color: '#5271ff',
    },
    formContainer: {
        backgroundColor: 'white',
        borderRadius: 10,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: {width: 0, height: 2},
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    title: {
        fontSize: 22,
        fontWeight: 'bold',
        marginBottom: 20,
        textAlign: 'center',
        color: '#333',
    },
    inputContainer: {
        marginBottom: 15,
    },
    label: {
        fontSize: 14,
        marginBottom: 5,
        color: '#555',
    },
    input: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        paddingHorizontal: 15,
        paddingVertical: 12,
        fontSize: 16,
        backgroundColor: '#f9f9f9',
    },
    signupButton: {
        backgroundColor: '#5271ff',
        paddingVertical: 14,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 10,
    },
    signupButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },
    loginContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: 25,
    },
    loginText: {
        color: '#555',
        fontSize: 14,
    },
    loginLink: {
        color: '#5271ff',
        fontSize: 14,
        fontWeight: 'bold',
    },
    disabledButton: {
        backgroundColor: '#80bdff',
        opacity: 0.7,
    },
});

export default SignupScreen;