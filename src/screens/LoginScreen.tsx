// Update these files to ensure consistent auth imports

// src/screens/LoginScreen.tsx
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
import {useLoginMutation} from '../entities/AuthState/model/slice/authApi';
import {loginFailure, loginStart, loginSuccess, setTokens} from '../entities/AuthState/model/slice/authSlice';
import {RootState} from '../app/providers/StoreProvider/store';
import {RootStackParamList} from '../navigation/AppNavigator';

type LoginScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Login'>;

interface LoginScreenProps {
    navigation: LoginScreenNavigationProp;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ navigation }) => {
    const [formData, setFormData] = useState({ username: '', password: '' });
    const [login, { isLoading: apiLoading, error: apiError }] = useLoginMutation();
    const dispatch = useDispatch();

    // Now these selectors work correctly
    const { isLoading, error, isAuthenticated } = useSelector((state: RootState) => state.auth);

    useEffect(() => {
        const checkTokens = async () => {
            try {
                const credentials = await Keychain.getGenericPassword();
                if (credentials) {
                    console.log(credentials);
                    const { accessToken, refreshToken, user } = JSON.parse(credentials.password);
                    dispatch(setTokens({ accessToken, refreshToken, user }));
                    navigation.reset({
                        index: 0,
                        routes: [{ name: 'Main' }],
                    });
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
        const { username, password } = formData;

        if (!username.trim() || !password.trim()) {
            Alert.alert('Error', 'Please fill in all fields');
            return;
        }

        try {
            dispatch(loginStart());
            const response = await login({ username, password }).unwrap();

            const authData = {
                accessToken: response.token,
                refreshToken: response.token, // Adjust based on your API response
                user: response.user,
            };

            // Store tokens in Keychain
            await Keychain.setGenericPassword(
                'authData',
                JSON.stringify(authData)
            );

            dispatch(loginSuccess(authData));

            navigation.reset({
                index: 0,
                routes: [{ name: 'Main' }],
            });
        } catch (err: any) {
            console.error('Login error:', err);
            const errorMessage = err?.data?.message || err?.message || 'Login failed';
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