// src/screens/EditProfileScreen.tsx
import React, {useEffect, useState} from 'react';
import {
    ActivityIndicator,
    Alert,
    Image,
    KeyboardAvoidingView,
    Platform,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import {RouteProp, useNavigation, useRoute} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {useSelector} from 'react-redux';
import {RootState} from '../app/providers/StoreProvider/store';
import {useGetUserProfileQuery, useUpdateUserProfileMutation} from '../entities/UserState/model/slice/userApi';
import * as ImagePicker from 'expo-image-picker';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

// Define the types for the navigation parameters
type RootStackParamList = {
    EditProfile: { userId: string };
    UserProfile: { userId: string };
};

type EditProfileRouteProp = RouteProp<RootStackParamList, 'EditProfile'>;
type EditProfileNavigationProp = NativeStackNavigationProp<RootStackParamList, 'EditProfile'>;

const EditProfileScreen: React.FC = () => {
    const route = useRoute<EditProfileRouteProp>();
    const navigation = useNavigation<EditProfileNavigationProp>();
    const { userId } = route.params;
    const { user: authUser } = useSelector((state: RootState) => state.auth);

    // Check if user is editing their own profile
    const isCurrentUser = authUser?.id === userId;

    // Get user profile data
    const { data: user, isLoading, error } = useGetUserProfileQuery(userId);
    const [updateProfile, { isLoading: isUpdating }] = useUpdateUserProfileMutation();

    // Form state
    const [username, setUsername] = useState('');
    const [bio, setBio] = useState('');
    const [avatar, setAvatar] = useState<string | null>(null);
    const [email, setEmail] = useState('');

    // Initialize form with user data when it loads
    useEffect(() => {
        if (user) {
            setUsername(user.username || '');
            setBio(user.bio || '');
            setAvatar(user.avatar || null);
            setEmail(user.email || '');
        }
    }, [user]);

    // Handle image picker for profile photo
    const handlePickImage = async () => {
        try {
            // Request permission
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

            if (status !== 'granted') {
                Alert.alert('Permission Denied', 'We need camera roll permissions to change your profile picture.');
                return;
            }

            // Launch image picker
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [1, 1],
                quality: 0.7,
            });

            if (!result.canceled && result.assets && result.assets.length > 0) {
                setAvatar(result.assets[0].uri);
            }
        } catch (err) {
            console.error('Error picking image:', err);
            Alert.alert('Error', 'Failed to pick image. Please try again.');
        }
    };

    // Save profile changes
    const handleSaveProfile = async () => {
        if (!username.trim()) {
            Alert.alert('Error', 'Username is required');
            return;
        }

        try {
            // Prepare update data
            const updateData = {
                id: userId,
                username,
                bio,
            };

            // Only include avatar if it has changed
            if (avatar && avatar !== user?.avatar) {
                // In a real app, you might need to upload the image first
                // and then update the avatar URL
                Object.assign(updateData, { avatar });
            }

            // Update profile
            await updateProfile(updateData).unwrap();

            Alert.alert('Success', 'Profile updated successfully', [
                {
                    text: 'OK',
                    onPress: () => navigation.navigate('UserProfile', { userId })
                }
            ]);
        } catch (err) {
            console.error('Failed to update profile:', err);
            Alert.alert('Error', 'Failed to update profile. Please try again.');
        }
    };

    // Handle cancel
    const handleCancel = () => {
        navigation.goBack();
    };

    // Render loading state
    if (isLoading) {
        return (
            <SafeAreaView style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#4CAF50" />
                <Text style={styles.loadingText}>Loading profile...</Text>
            </SafeAreaView>
        );
    }

    // Render error state
    if (error || !user) {
        return (
            <SafeAreaView style={styles.errorContainer}>
                <MaterialCommunityIcons name="alert-circle-outline" size={50} color="#F44336" />
                <Text style={styles.errorText}>Failed to load profile information.</Text>
                <TouchableOpacity style={styles.retryButton} onPress={() => navigation.goBack()}>
                    <Text style={styles.retryButtonText}>Go Back</Text>
                </TouchableOpacity>
            </SafeAreaView>
        );
    }

    // Check if user has permission to edit
    if (!isCurrentUser) {
        return (
            <SafeAreaView style={styles.errorContainer}>
                <MaterialCommunityIcons name="lock" size={50} color="#F44336" />
                <Text style={styles.errorText}>You don't have permission to edit this profile.</Text>
                <TouchableOpacity style={styles.retryButton} onPress={() => navigation.goBack()}>
                    <Text style={styles.retryButtonText}>Go Back</Text>
                </TouchableOpacity>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.keyboardAvoid}
            >
                <ScrollView contentContainerStyle={styles.scrollContent}>
                    <View style={styles.header}>
                        <Text style={styles.headerTitle}>Edit Profile</Text>
                    </View>

                    <View style={styles.content}>
                        {/* Profile Picture */}
                        <View style={styles.avatarContainer}>
                            {avatar ? (
                                <Image source={{ uri: avatar }} style={styles.avatar} />
                            ) : (
                                <View style={styles.avatarPlaceholder}>
                                    <Text style={styles.avatarText}>{username.charAt(0).toUpperCase()}</Text>
                                </View>
                            )}

                            <TouchableOpacity
                                style={styles.changePhotoButton}
                                onPress={handlePickImage}
                            >
                                <MaterialCommunityIcons name="camera" size={18} color="white" />
                                <Text style={styles.changePhotoText}>Change Photo</Text>
                            </TouchableOpacity>
                        </View>

                        {/* Form Fields */}
                        <View style={styles.formContainer}>
                            <View style={styles.formGroup}>
                                <Text style={styles.label}>Username</Text>
                                <TextInput
                                    style={styles.input}
                                    value={username}
                                    onChangeText={setUsername}
                                    placeholder="Enter username"
                                />
                            </View>

                            <View style={styles.formGroup}>
                                <Text style={styles.label}>Email</Text>
                                <TextInput
                                    style={[styles.input, styles.disabledInput]}
                                    value={email}
                                    editable={false}
                                    placeholder="Email address"
                                />
                                <Text style={styles.helperText}>Email cannot be changed</Text>
                            </View>

                            <View style={styles.formGroup}>
                                <Text style={styles.label}>Bio</Text>
                                <TextInput
                                    style={[styles.input, styles.textArea]}
                                    value={bio}
                                    onChangeText={setBio}
                                    placeholder="Tell us about yourself"
                                    multiline
                                    numberOfLines={4}
                                    textAlignVertical="top"
                                />
                            </View>
                        </View>

                        {/* Action Buttons */}
                        <View style={styles.actionButtons}>
                            <TouchableOpacity
                                style={[styles.saveButton, isUpdating && styles.disabledButton]}
                                onPress={handleSaveProfile}
                                disabled={isUpdating}
                            >
                                {isUpdating ? (
                                    <ActivityIndicator size="small" color="white" />
                                ) : (
                                    <Text style={styles.saveButtonText}>Save Changes</Text>
                                )}
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.cancelButton}
                                onPress={handleCancel}
                                disabled={isUpdating}
                            >
                                <Text style={styles.cancelButtonText}>Cancel</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    keyboardAvoid: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    loadingText: {
        marginTop: 12,
        fontSize: 16,
        color: '#555',
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    errorText: {
        fontSize: 16,
        color: '#555',
        textAlign: 'center',
        marginTop: 16,
        marginBottom: 16,
    },
    retryButton: {
        backgroundColor: '#4CAF50',
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 5,
    },
    retryButtonText: {
        color: 'white',
        fontWeight: 'bold',
    },
    header: {
        backgroundColor: '#4CAF50',
        padding: 16,
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: 'white',
    },
    content: {
        padding: 16,
    },
    avatarContainer: {
        alignItems: 'center',
        marginBottom: 24,
    },
    avatar: {
        width: 120,
        height: 120,
        borderRadius: 60,
        borderWidth: 3,
        borderColor: 'white',
    },
    avatarPlaceholder: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: '#E0E0E0',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 3,
        borderColor: 'white',
    },
    avatarText: {
        fontSize: 48,
        fontWeight: 'bold',
        color: '#757575',
    },
    changePhotoButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#4CAF50',
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 20,
        marginTop: 12,
    },
    changePhotoText: {
        color: 'white',
        marginLeft: 6,
        fontWeight: '600',
    },
    formContainer: {
        backgroundColor: 'white',
        borderRadius: 8,
        padding: 16,
        marginBottom: 16,
        elevation: 1,
        shadowOpacity: 0.1,
        shadowRadius: 2,
        shadowOffset: { width: 0, height: 1 },
    },
    formGroup: {
        marginBottom: 16,
    },
    label: {
        fontSize: 16,
        fontWeight: '500',
        marginBottom: 8,
        color: '#333',
    },
    input: {
        backgroundColor: '#f9f9f9',
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
        color: '#333',
    },
    disabledInput: {
        backgroundColor: '#f0f0f0',
        color: '#888',
    },
    textArea: {
        minHeight: 100,
        textAlignVertical: 'top',
    },
    helperText: {
        fontSize: 12,
        color: '#888',
        marginTop: 4,
    },
    actionButtons: {
        marginBottom: 24,
    },
    saveButton: {
        backgroundColor: '#4CAF50',
        padding: 16,
        borderRadius: 8,
        alignItems: 'center',
        marginBottom: 12,
    },
    disabledButton: {
        opacity: 0.7,
    },
    saveButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },
    cancelButton: {
        backgroundColor: 'transparent',
        padding: 16,
        borderRadius: 8,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#ddd',
    },
    cancelButtonText: {
        color: '#555',
        fontSize: 16,
    },
});

export default EditProfileScreen;