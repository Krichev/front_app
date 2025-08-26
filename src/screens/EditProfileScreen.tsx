import React, {useEffect, useState} from 'react';
import {
    ActivityIndicator,
    Alert,
    Image,
    KeyboardAvoidingView,
    PermissionsAndroid,
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
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import {ImagePickerResponse, launchCamera, launchImageLibrary, MediaType} from 'react-native-image-picker';

// Define the types for the navigation parameters
type RootStackParamList = {
    UserProfile: { userId: string };
    EditProfile: { userId: string };
};

type EditProfileRouteProp = RouteProp<RootStackParamList, 'EditProfile'>;
type EditProfileNavigationProp = NativeStackNavigationProp<RootStackParamList, 'EditProfile'>;

const EditProfileScreen: React.FC = () => {
    const route = useRoute<EditProfileRouteProp>();
    const navigation = useNavigation<EditProfileNavigationProp>();
    const { userId } = route.params;
    const { user: currentUser } = useSelector((state: RootState) => state.auth);

    // Check if user is editing their own profile
    const isOwn = currentUser?.id === userId;

    // RTK Query hooks - FIXED: Using correct mutation name
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

    // Initialize form with data when profile loads
    useEffect(() => {
        if (userProfile) {
            setFormData({
                username: userProfile.username || '',
                bio: userProfile.bio || '',
                avatar: userProfile.avatar || '',
            });
            if (userProfile.avatar) {
                setAvatarUri(userProfile.avatar);
            }
        }
    }, [userProfile]);

    // Handle input changes
    const handleInputChange = (field: string, value: string) => {
        setFormData(prev => ({
            ...prev,
            [field]: value,
        }));
    };

    // Request camera permission (Android)
    const requestCameraPermission = async () => {
        if (Platform.OS === 'android') {
            try {
                const granted = await PermissionsAndroid.request(
                    PermissionsAndroid.PERMISSIONS.CAMERA,
                    {
                        title: 'Camera Permission',
                        message: 'This app needs access to camera to take profile pictures.',
                        buttonNeutral: 'Ask Me Later',
                        buttonNegative: 'Cancel',
                        buttonPositive: 'OK',
                    },
                );
                return granted === PermissionsAndroid.RESULTS.GRANTED;
            } catch (err) {
                console.warn(err);
                return false;
            }
        }
        return true;
    };

    // Take photo
    const takePhoto = async () => {
        const hasPermission = await requestCameraPermission();
        if (!hasPermission) {
            Alert.alert('Permission Denied', 'Camera permission is required to take photos.');
            return;
        }

        const options = {
            mediaType: 'photo' as MediaType,
            includeBase64: false,
            maxHeight: 800,
            maxWidth: 800,
            quality: 0.8,
        };

        launchCamera(options, (response: ImagePickerResponse) => {
            if (response.didCancel || response.errorMessage) {
                return;
            }

            if (response.assets && response.assets[0]) {
                const asset = response.assets[0];
                if (asset.uri) {
                    setAvatarUri(asset.uri);
                    setFormData(prev => ({
                        ...prev,
                        avatar: asset.uri || '',
                    }));
                }
            }
        });
    };

    // Pick image from gallery
    const pickImage = () => {
        const options = {
            mediaType: 'photo' as MediaType,
            includeBase64: false,
            maxHeight: 800,
            maxWidth: 800,
            quality: 0.8,
        };

        launchImageLibrary(options, (response: ImagePickerResponse) => {
            if (response.didCancel || response.errorMessage) {
                return;
            }

            if (response.assets && response.assets[0]) {
                const asset = response.assets[0];
                if (asset.uri) {
                    setAvatarUri(asset.uri);
                    setFormData(prev => ({
                        ...prev,
                        avatar: asset.uri || '',
                    }));
                }
            }
        });
    };

    // Show image picker options
    const showImagePickerOptions = () => {
        Alert.alert(
            'Change Profile Picture',
            'Choose an option',
            [
                { text: 'Take Photo', onPress: takePhoto },
                { text: 'Select from Gallery', onPress: pickImage },
                { text: 'Cancel', style: 'cancel' }
            ]
        );
    };

    // Handle save profile changes - FIXED: Proper API call structure
    const handleSaveProfile = async () => {
        // Simple validation
        if (!formData.username.trim()) {
            Alert.alert('Error', 'Username cannot be empty');
            return;
        }

        // Validate username length
        if (formData.username.trim().length < 3) {
            Alert.alert('Error', 'Username must be at least 3 characters long');
            return;
        }

        // Validate bio length (optional)
        if (formData.bio && formData.bio.length > 500) {
            Alert.alert('Error', 'Bio cannot exceed 500 characters');
            return;
        }

        try {
            // Prepare update data - only send changed fields
            const updateData: any = {
                id: userId,
            };

            // Only include fields that have changed
            if (formData.username !== userProfile?.username) {
                updateData.username = formData.username.trim();
            }

            if (formData.bio !== userProfile?.bio) {
                updateData.bio = formData.bio;
            }

            if (formData.avatar !== userProfile?.avatar) {
                updateData.avatar = formData.avatar;
            }

            // Only make API call if there are changes
            if (Object.keys(updateData).length === 1) { // Only id field means no changes
                Alert.alert('Info', 'No changes to save');
                return;
            }

            console.log('Updating profile with data:', updateData);

            // Submit profile update - FIXED: Using correct mutation name and structure
            const result = await updateUserProfile(updateData).unwrap();

            console.log('Profile update result:', result);

            Alert.alert(
                'Success',
                'Profile updated successfully!',
                [{ text: 'OK', onPress: () => navigation.goBack() }]
            );
        } catch (error: any) {
            console.error('Update profile error:', error);

            // Handle different types of errors
            let errorMessage = 'Failed to update profile. Please try again.';

            if (error?.data?.message) {
                errorMessage = error.data.message;
            } else if (error?.message) {
                errorMessage = error.message;
            } else if (error?.status === 400) {
                errorMessage = 'Invalid data provided. Please check your inputs.';
            } else if (error?.status === 401) {
                errorMessage = 'You are not authorized to update this profile.';
            } else if (error?.status === 404) {
                errorMessage = 'User not found.';
            } else if (error?.status >= 500) {
                errorMessage = 'Server error. Please try again later.';
            }

            Alert.alert('Error', errorMessage);
        }
    };

    // Handle cancel
    const handleCancel = () => {
        Alert.alert(
            'Discard Changes',
            'Are you sure you want to discard your changes?',
            [
                { text: 'Keep Editing', style: 'cancel' },
                { text: 'Discard', style: 'destructive', onPress: () => navigation.goBack() }
            ]
        );
    };

    // Show authorization error if user is not editing their own profile
    if (!isOwn) {
        return (
            <SafeAreaView style={styles.errorContainer}>
                <MaterialCommunityIcons name="lock-outline" size={48} color="#F44336" />
                <Text style={styles.errorText}>You can only edit your own profile.</Text>
                <TouchableOpacity style={styles.retryButton} onPress={() => navigation.goBack()}>
                    <Text style={styles.retryButtonText}>Go Back</Text>
                </TouchableOpacity>
            </SafeAreaView>
        );
    }

    // Render loading state
    if (profileLoading) {
        return (
            <SafeAreaView style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#4CAF50" />
                <Text style={styles.loadingText}>Loading profile...</Text>
            </SafeAreaView>
        );
    }

    // Render error state
    if (profileError) {
        return (
            <SafeAreaView style={styles.errorContainer}>
                <MaterialCommunityIcons name="alert-circle-outline" size={48} color="#F44336" />
                <Text style={styles.errorText}>Failed to load profile information.</Text>
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

                    {/* Profile Picture */}
                    <View style={styles.pictureContainer}>
                        <TouchableOpacity style={styles.avatarContainer} onPress={showImagePickerOptions}>
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

                    {/* Action Buttons */}
                    <View style={styles.buttonContainer}>
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
    header: {
        backgroundColor: '#4CAF50',
        padding: 16,
        paddingTop: 40,
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: 'white',
    },
    pictureContainer: {
        alignItems: 'center',
        backgroundColor: '#4CAF50',
        paddingBottom: 24,
        marginBottom: 16,
    },
    avatarContainer: {
        position: 'relative',
        marginBottom: 8,
    },
    avatar: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: '#ddd',
    },
    avatarPlaceholder: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: 'rgba(255, 255, 255, 0.3)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: 'white',
    },
    avatarText: {
        fontSize: 40,
        fontWeight: 'bold',
        color: 'white',
    },
    editIconContainer: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        backgroundColor: '#2196F3',
        borderRadius: 12,
        width: 24,
        height: 24,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: 'white',
    },
    changePhotoText: {
        fontSize: 14,
        color: 'white',
        marginTop: 8,
    },
    formContainer: {
        padding: 16,
    },
    formGroup: {
        marginBottom: 20,
    },
    label: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 8,
        color: '#333',
    },
    input: {
        backgroundColor: 'white',
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
        color: '#333',
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
        padding: 16,
        paddingTop: 0,
    },
    saveButton: {
        backgroundColor: '#4CAF50',
        padding: 16,
        borderRadius: 8,
        alignItems: 'center',
        marginBottom: 12,
    },
    saveButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },
    cancelButton: {
        backgroundColor: 'white',
        padding: 16,
        borderRadius: 8,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#ddd',
    },
    cancelButtonText: {
        color: '#666',
        fontSize: 16,
        fontWeight: '600',
    },
    disabledButton: {
        opacity: 0.7,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f5f5f5',
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
        backgroundColor: '#f5f5f5',
        padding: 16,
    },
    errorText: {
        fontSize: 16,
        color: '#F44336',
        textAlign: 'center',
        marginVertical: 16,
    },
    retryButton: {
        backgroundColor: '#4CAF50',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 8,
    },
    retryButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
    },
});

export default EditProfileScreen;