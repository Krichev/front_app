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
import {useDispatch, useSelector} from 'react-redux';
import {RootState} from '../app/providers/StoreProvider/store';
import {updateUser} from '../entities/AuthState/model/slice/authSlice';
import {useGetUserProfileQuery, useUpdateUserProfileMutation} from '../entities/UserState/model/slice/userApi';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import {
    CameraOptions,
    ImageLibraryOptions,
    ImagePickerResponse,
    launchCamera,
    launchImageLibrary,
    MediaType,
    PhotoQuality
} from 'react-native-image-picker';

// Define the types for the navigation parameters
type RootStackParamList = {
    UserProfile: { userId: string };
    EditProfile: { userId: string };
};

type EditProfileRouteProp = RouteProp<RootStackParamList, 'EditProfile'>;
type EditProfileNavigationProp = NativeStackNavigationProp<RootStackParamList, 'EditProfile'>;

const EditProfileScreen: React.FC = () => {
    const dispatch = useDispatch();
    const route = useRoute<EditProfileRouteProp>();
    const navigation = useNavigation<EditProfileNavigationProp>();
    const { userId } = route.params;
    const { user: currentUser } = useSelector((state: RootState) => state.auth);

    // Check if user is editing their own profile
    const isOwn = currentUser?.id === userId;

    // RTK Query hooks
    const { data: userProfile, isLoading: profileLoading, error: profileError } = useGetUserProfileQuery(userId);
    const [updateUserProfile, { isLoading: isUpdating }] = useUpdateUserProfileMutation();

    // Form state
    const [formData, setFormData] = useState({
        username: '',
        bio: '',
        avatar: '',
    });

    // Local avatar state for preview
    const [avatarUri, setAvatarUri] = useState<string | null>(null);

    useEffect(() => {
        if (userProfile) {
            setFormData({
                username: userProfile.username || '',
                bio: userProfile.bio || '',
                avatar: userProfile.avatar || '',
            });
            setAvatarUri(userProfile.avatar || null);
        }
    }, [userProfile]);

    // Handle input changes
    const handleInputChange = (field: keyof typeof formData, value: string) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    // Handle avatar selection
    const selectAvatar = () => {
        Alert.alert(
            'Select Profile Picture',
            'Choose from where you want to select a profile picture',
            [
                {
                    text: 'Camera',
                    onPress: () => openCamera(),
                },
                {
                    text: 'Gallery',
                    onPress: () => openImageLibrary(),
                },
                {
                    text: 'Cancel',
                    style: 'cancel',
                },
            ]
        );
    };

    const openCamera = () => {
        const options: CameraOptions = {
            mediaType: 'photo' as MediaType,
            quality: 0.7 as PhotoQuality,
            includeBase64: true,
        };

        launchCamera(options, (response: ImagePickerResponse) => {
            if (response.assets && response.assets[0]) {
                const imageUri = response.assets[0].uri;
                if (imageUri) {
                    setAvatarUri(imageUri);
                    setFormData(prev => ({
                        ...prev,
                        avatar: imageUri
                    }));
                }
            }
        });
    };

    const openImageLibrary = () => {
        const options: ImageLibraryOptions = {
            mediaType: 'photo' as MediaType,
            quality: 0.7 as PhotoQuality,
            includeBase64: true,
        };

        launchImageLibrary(options, (response: ImagePickerResponse) => {
            if (response.assets && response.assets[0]) {
                const imageUri = response.assets[0].uri;
                if (imageUri) {
                    setAvatarUri(imageUri);
                    setFormData(prev => ({
                        ...prev,
                        avatar: imageUri
                    }));
                }
            }
        });
    };

    // Validation
    const validateForm = (): boolean => {
        if (formData.username.trim().length < 3) {
            Alert.alert('Validation Error', 'Username must be at least 3 characters long.');
            return false;
        }
        if (formData.username.trim().length > 50) {
            Alert.alert('Validation Error', 'Username must be less than 50 characters.');
            return false;
        }
        if (formData.bio.length > 500) {
            Alert.alert('Validation Error', 'Bio must be less than 500 characters.');
            return false;
        }
        return true;
    };

    // Handle save profile
    const handleSaveProfile = async () => {
        if (!validateForm()) {
            return;
        }

        try {
            const originalUsername = userProfile?.username;
            const usernameChanged = originalUsername !== formData.username.trim();

            const updateData = {
                id: userId,
                username: formData.username.trim(),
                bio: formData.bio.trim(),
                avatar: formData.avatar,
            };

            const result = await updateUserProfile(updateData).unwrap();

            // If this is the current user's profile and username changed, update Redux auth state
            if (isOwn && usernameChanged && currentUser) {
                const updatedUser = {
                    ...currentUser,
                    username: formData.username.trim(),
                    bio: formData.bio.trim(),
                    avatar: formData.avatar,
                };

                // Update the auth state in Redux
                dispatch(updateUser(updatedUser));
            }

            Alert.alert(
                'Success',
                usernameChanged
                    ? 'Profile and username updated successfully!'
                    : 'Profile updated successfully!',
                [
                    {
                        text: 'OK',
                        onPress: () => navigation.goBack(),
                    },
                ]
            );
        } catch (error: any) {
            console.error('Error updating profile:', error);
            Alert.alert(
                'Error',
                error?.data?.message || 'Failed to update profile. Please try again.'
            );
        }
    };

    // Handle cancel
    const handleCancel = () => {
        Alert.alert(
            'Discard Changes?',
            'Are you sure you want to discard your changes?',
            [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Discard', style: 'destructive', onPress: () => navigation.goBack() },
            ]
        );
    };

    if (profileLoading) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#007AFF" />
                    <Text style={styles.loadingText}>Loading profile...</Text>
                </View>
            </SafeAreaView>
        );
    }

    if (profileError) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.errorContainer}>
                    <Text style={styles.errorText}>Failed to load profile</Text>
                    <TouchableOpacity style={styles.retryButton} onPress={() => navigation.goBack()}>
                        <Text style={styles.retryButtonText}>Go Back</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    if (!isOwn) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.errorContainer}>
                    <Text style={styles.errorText}>You can only edit your own profile</Text>
                    <TouchableOpacity style={styles.retryButton} onPress={() => navigation.goBack()}>
                        <Text style={styles.retryButtonText}>Go Back</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView
                style={styles.keyboardAvoidingView}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            >
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={handleCancel} style={styles.headerButton}>
                        <Text style={styles.cancelText}>Cancel</Text>
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Edit Profile</Text>
                    <TouchableOpacity
                        onPress={handleSaveProfile}
                        style={[styles.headerButton, isUpdating && styles.disabledButton]}
                        disabled={isUpdating}
                    >
                        {isUpdating ? (
                            <ActivityIndicator size="small" color="#007AFF" />
                        ) : (
                            <Text style={styles.saveText}>Save</Text>
                        )}
                    </TouchableOpacity>
                </View>

                <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
                    {/* Avatar Section */}
                    <View style={styles.avatarSection}>
                        <TouchableOpacity onPress={selectAvatar} style={styles.avatarContainer}>
                            {avatarUri ? (
                                <Image source={{ uri: avatarUri }} style={styles.avatar} />
                            ) : (
                                <View style={styles.avatarPlaceholder}>
                                    <Text style={styles.avatarText}>
                                        {formData.username ? formData.username.charAt(0).toUpperCase() : 'U'}
                                    </Text>
                                </View>
                            )}
                            <View style={styles.editIconContainer}>
                                <MaterialCommunityIcons name="camera" size={16} color="white" />
                            </View>
                        </TouchableOpacity>
                        <Text style={styles.changePhotoText}>Tap to change profile picture</Text>
                    </View>

                    {/* Form Fields */}
                    <View style={styles.formContainer}>
                        <View style={styles.formGroup}>
                            <Text style={styles.label}>Username *</Text>
                            <TextInput
                                style={styles.input}
                                value={formData.username}
                                onChangeText={(value) => handleInputChange('username', value)}
                                placeholder="Enter your username"
                                maxLength={50}
                                autoCapitalize="none"
                                autoCorrect={false}
                            />
                            <Text style={styles.helperText}>Minimum 3 characters, maximum 50</Text>
                        </View>

                        <View style={styles.formGroup}>
                            <Text style={styles.label}>Bio</Text>
                            <TextInput
                                style={[styles.input, styles.textArea]}
                                value={formData.bio}
                                onChangeText={(value) => handleInputChange('bio', value)}
                                placeholder="Tell something about yourself..."
                                multiline
                                numberOfLines={4}
                                maxLength={500}
                                textAlignVertical="top"
                            />
                            <Text style={styles.helperText}>
                                {formData.bio.length}/500 characters
                            </Text>
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
        backgroundColor: '#fff',
    },
    keyboardAvoidingView: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E5E5',
    },
    headerButton: {
        padding: 8,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#000',
    },
    cancelText: {
        fontSize: 16,
        color: '#FF3B30',
    },
    saveText: {
        fontSize: 16,
        color: '#007AFF',
        fontWeight: '600',
    },
    disabledButton: {
        opacity: 0.6,
    },
    scrollView: {
        flex: 1,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 16,
        fontSize: 16,
        color: '#666',
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    errorText: {
        fontSize: 16,
        color: '#FF3B30',
        textAlign: 'center',
        marginBottom: 20,
    },
    retryButton: {
        backgroundColor: '#007AFF',
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 8,
    },
    retryButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    avatarSection: {
        alignItems: 'center',
        paddingVertical: 32,
    },
    avatarContainer: {
        position: 'relative',
    },
    avatar: {
        width: 100,
        height: 100,
        borderRadius: 50,
    },
    avatarPlaceholder: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: '#E5E5E5',
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarText: {
        fontSize: 36,
        fontWeight: '600',
        color: '#666',
    },
    editIconContainer: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#007AFF',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#fff',
    },
    changePhotoText: {
        marginTop: 12,
        fontSize: 14,
        color: '#666',
    },
    formContainer: {
        paddingHorizontal: 16,
    },
    formGroup: {
        marginBottom: 24,
    },
    label: {
        fontSize: 16,
        fontWeight: '600',
        color: '#000',
        marginBottom: 8,
    },
    input: {
        borderWidth: 1,
        borderColor: '#E5E5E5',
        borderRadius: 8,
        paddingHorizontal: 16,
        paddingVertical: 12,
        fontSize: 16,
        color: '#000',
    },
    textArea: {
        minHeight: 100,
        textAlignVertical: 'top',
    },
    helperText: {
        fontSize: 12,
        color: '#666',
        marginTop: 4,
    },
    buttonContainer: {
        paddingHorizontal: 16,
        paddingVertical: 20,
    },
    saveButton: {
        backgroundColor: '#007AFF',
        paddingVertical: 16,
        borderRadius: 8,
        alignItems: 'center',
    },
    saveButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
});

export default EditProfileScreen;