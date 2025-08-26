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

        const options: CameraOptions = {
            mediaType: 'photo' as MediaType,
            includeBase64: false,
            maxHeight: 800,
            maxWidth: 800,
            quality: 0.8 as PhotoQuality,
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
        const options: ImageLibraryOptions = {
            mediaType: 'photo' as MediaType,
            includeBase64: false,
            maxHeight: 800,
            maxWidth: 800,
            quality: 0.8 as PhotoQuality,
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
                {
                    text: 'Camera',
                    onPress: takePhoto,
                },
                {
                    text: 'Photo Library',
                    onPress: pickImage,
                },
                {
                    text: 'Cancel',
                    style: 'cancel',
                },
            ]
        );
    };

    // Handle form validation
    const validateForm = () => {
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
            const updateData = {
                id: userId,
                username: formData.username.trim(),
                bio: formData.bio.trim(),
                avatar: formData.avatar,
            };

            await updateUserProfile(updateData).unwrap();

            Alert.alert(
                'Success',
                'Profile updated successfully!',
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
                {
                    text: 'Keep Editing',
                    style: 'cancel',
                },
                {
                    text: 'Discard',
                    style: 'destructive',
                    onPress: () => navigation.goBack(),
                },
            ]
        );
    };

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
    if (profileError || !userProfile) {
        return (
            <SafeAreaView style={styles.errorContainer}>
                <MaterialCommunityIcons name="alert-circle-outline" size={48} color="#F44336" />
                <Text style={styles.errorText}>Failed to load profile for editing.</Text>
                <TouchableOpacity
                    style={styles.retryButton}
                    onPress={() => navigation.goBack()}
                >
                    <Text style={styles.retryButtonText}>Go Back</Text>
                </TouchableOpacity>
            </SafeAreaView>
        );
    }

    // Check if user has permission to edit this profile
    if (!isOwn) {
        return (
            <SafeAreaView style={styles.errorContainer}>
                <MaterialCommunityIcons name="lock-outline" size={48} color="#F44336" />
                <Text style={styles.errorText}>You can only edit your own profile.</Text>
                <TouchableOpacity
                    style={styles.retryButton}
                    onPress={() => navigation.goBack()}
                >
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
                                <ActivityIndicator color="white" size="small" />
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
        padding: 16,
        paddingTop: 0,
    },
    header: {
        paddingVertical: 16,
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
        marginBottom: 20,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
    },
    pictureContainer: {
        alignItems: 'center',
        marginBottom: 30,
    },
    avatarContainer: {
        position: 'relative',
        marginBottom: 8,
    },
    avatar: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: '#eee',
    },
    avatarPlaceholder: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: '#4CAF50',
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarText: {
        fontSize: 48,
        fontWeight: 'bold',
        color: 'white',
    },
    editIconContainer: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        backgroundColor: '#4CAF50',
        borderRadius: 20,
        width: 32,
        height: 32,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 3,
        borderColor: 'white',
    },
    changePhotoText: {
        fontSize: 14,
        color: '#666',
        textAlign: 'center',
    },
    formContainer: {
        marginBottom: 30,
    },
    formGroup: {
        marginBottom: 20,
    },
    label: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginBottom: 8,
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
        height: 100,
        textAlignVertical: 'top',
    },
    helperText: {
        fontSize: 12,
        color: '#666',
        marginTop: 4,
    },
    buttonContainer: {
        gap: 12,
        paddingHorizontal: 16,
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