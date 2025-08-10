import React, {useState} from 'react';
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    PermissionsAndroid,
    Platform,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {CreateChallengeRequest, useCreateChallengeMutation} from '../entities/ChallengeState/model/slice/challengeApi';
import {Picker} from '@react-native-picker/picker';
import {ChallengeFrequency, ChallengeType, ChallengeVisibility, VerificationType} from '../app/types';
import Geolocation from '@react-native-community/geolocation';

interface CreateChallengeFormData {
    title: string;
    description: string;
    type: ChallengeType;
    visibility: ChallengeVisibility;
    reward?: string;
    penalty?: string;
    targetGroup?: string;
    verificationMethod?: VerificationType;
    frequency: ChallengeFrequency;
    startDate?: Date;
    endDate?: Date;
    tags: string[];
}

interface PhotoDetailsState {
    description: string;
    requiresComparison: boolean;
    verificationMode: 'standard' | 'selfie' | 'comparison';
}

interface LocationDetailsState {
    latitude: number;
    longitude: number;
    radius: number;
    locationName: string;
}

const CreateChallengeScreen: React.FC = () => {
    const navigation = useNavigation();
    const [createChallenge, { isLoading }] = useCreateChallengeMutation();

    // Loading states
    const [locationFetching, setLocationFetching] = useState<boolean>(false);

    // UI state
    const [showAdvancedOptions, setShowAdvancedOptions] = useState<boolean>(false);
    const [showVerificationOptions, setShowVerificationOptions] = useState<boolean>(false);
    const [showDateOptions, setShowDateOptions] = useState<boolean>(false);

    // Form state
    const [formData, setFormData] = useState<CreateChallengeFormData>({
        title: '',
        description: '',
        type: 'QUEST',
        visibility: 'PUBLIC',
        reward: '',
        penalty: '',
        targetGroup: '',
        verificationMethod: 'QUIZ',
        frequency: 'ONE_TIME',
        startDate: undefined,
        endDate: undefined,
        tags: [],
    });

    // Verification details states
    const [photoDetails, setPhotoDetails] = useState<PhotoDetailsState>({
        description: '',
        requiresComparison: false,
        verificationMode: 'standard'
    });

    const [locationDetails, setLocationDetails] = useState<LocationDetailsState>({
        latitude: 0,
        longitude: 0,
        radius: 100,
        locationName: ''
    });

    // Tags input state
    const [tagsInput, setTagsInput] = useState<string>('');

    // Form field updater
    const updateFormField = (field: keyof CreateChallengeFormData, value: any) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    // Handle tags input
    const handleTagsChange = (text: string) => {
        setTagsInput(text);
        // Convert comma-separated string to array
        const tagsArray = text
            .split(',')
            .map(tag => tag.trim())
            .filter(tag => tag.length > 0);
        updateFormField('tags', tagsArray);
    };

    // Get current location
    const getCurrentLocation = async () => {
        if (Platform.OS === 'android') {
            const permission = await PermissionsAndroid.request(
                PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
            );
            if (permission !== PermissionsAndroid.RESULTS.GRANTED) {
                Alert.alert('Permission Denied', 'Location permission is required');
                return;
            }
        }

        setLocationFetching(true);

        Geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                setLocationDetails(prev => ({
                    ...prev,
                    latitude,
                    longitude
                }));
                setLocationFetching(false);
            },
            (error) => {
                console.error('Location error:', error);
                Alert.alert('Error', 'Failed to get current location');
                setLocationFetching(false);
            },
            { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
        );
    };

    // Form submission
    const handleSubmit = async () => {
        // Basic validation
        if (!formData.title.trim()) {
            Alert.alert('Error', 'Please enter a challenge title');
            return;
        }

        if (!formData.description.trim()) {
            Alert.alert('Error', 'Please enter a challenge description');
            return;
        }

        // Prepare verification details based on selected method
        let verificationDetails: Record<string, any> | undefined = undefined;

        if (formData.verificationMethod === 'PHOTO') {
            if (!photoDetails.description.trim()) {
                Alert.alert('Error', 'Please provide a description for photo verification');
                return;
            }
            verificationDetails = {
                description: photoDetails.description,
                requiresComparison: photoDetails.requiresComparison,
                verificationMode: photoDetails.verificationMode
            };
        } else if (formData.verificationMethod === 'LOCATION') {
            if (!locationDetails.latitude || !locationDetails.longitude) {
                Alert.alert('Error', 'Please set location coordinates for location verification');
                return;
            }
            verificationDetails = {
                latitude: locationDetails.latitude,
                longitude: locationDetails.longitude,
                radius: locationDetails.radius,
                locationName: locationDetails.locationName
            };
        }

        try {
            const requestData: CreateChallengeRequest = {
                title: formData.title.trim(),
                description: formData.description.trim(),
                type: formData.type,
                visibility: formData.visibility,
                status: 'ACTIVE',
                reward: formData.reward?.trim() || undefined,
                penalty: formData.penalty?.trim() || undefined,
                verificationMethod: formData.verificationMethod,
                verificationDetails: verificationDetails,
                targetGroup: formData.targetGroup?.trim() || undefined,
                frequency: formData.frequency,
                startDate: formData.startDate?.toISOString(),
                endDate: formData.endDate?.toISOString(),
                tags: formData.tags.length > 0 ? formData.tags : undefined
            };

            await createChallenge(requestData).unwrap();

            Alert.alert('Success', 'Challenge created successfully!', [
                {text: 'OK', onPress: () => navigation.goBack()}
            ]);
        } catch (error: any) {
            console.error('Create challenge error:', error);
            const errorMessage = error?.data?.message || 'Failed to create challenge. Please try again.';
            Alert.alert('Error', errorMessage);
        }
    };

    // Render verification method section
    const renderVerificationMethodSection = () => (
        <View style={styles.verificationContainer}>
            <Text style={styles.sectionTitle}>Verification Method</Text>

            <View style={styles.pickerContainer}>
                <Picker
                    selectedValue={formData.verificationMethod || 'NONE'}
                    onValueChange={(value) => {
                        if (value === 'NONE') {
                            updateFormField('verificationMethod', undefined);
                        } else {
                            updateFormField('verificationMethod', value as VerificationType);
                        }
                    }}
                    style={styles.picker}
                >
                    <Picker.Item label="No Verification" value="NONE"/>
                    <Picker.Item label="Photo Verification" value="PHOTO"/>
                    <Picker.Item label="Location Verification" value="LOCATION"/>
                    <Picker.Item label="Quiz Verification" value="QUIZ"/>
                    <Picker.Item label="Manual Verification" value="MANUAL"/>
                    <Picker.Item label="Fitness API" value="FITNESS_API"/>
                    <Picker.Item label="Activity Tracking" value="ACTIVITY"/>
                </Picker>
            </View>

            {/* Photo Verification Details */}
            {formData.verificationMethod === 'PHOTO' && (
                <View style={styles.verificationDetailsContainer}>
                    <Text style={styles.label}>Photo Description *</Text>
                    <TextInput
                        style={[styles.input, styles.textArea]}
                        value={photoDetails.description}
                        onChangeText={(text) => setPhotoDetails(prev => ({...prev, description: text}))}
                        placeholder="Describe what the photo should show (e.g., 'Take a photo showing your completed workout')"
                        multiline
                        numberOfLines={3}
                    />

                    <View style={styles.switchContainer}>
                        <Text style={styles.label}>Require Photo Comparison</Text>
                        <Switch
                            value={photoDetails.requiresComparison}
                            onValueChange={(value) => setPhotoDetails(prev => ({...prev, requiresComparison: value}))}
                            trackColor={{false: '#767577', true: '#81b0ff'}}
                            thumbColor={photoDetails.requiresComparison ? '#f5dd4b' : '#f4f3f4'}
                        />
                    </View>

                    <Text style={styles.label}>Verification Mode</Text>
                    <View style={styles.pickerContainer}>
                        <Picker
                            selectedValue={photoDetails.verificationMode}
                            onValueChange={(value) => setPhotoDetails(prev => ({...prev, verificationMode: value as any}))}
                            style={styles.picker}
                        >
                            <Picker.Item label="Standard Photo" value="standard"/>
                            <Picker.Item label="Selfie" value="selfie"/>
                            <Picker.Item label="Comparison" value="comparison"/>
                        </Picker>
                    </View>
                </View>
            )}

            {/* Location Verification Details */}
            {formData.verificationMethod === 'LOCATION' && (
                <View style={styles.verificationDetailsContainer}>
                    <Text style={styles.label}>Location Name</Text>
                    <TextInput
                        style={styles.input}
                        value={locationDetails.locationName}
                        onChangeText={(text) => setLocationDetails(prev => ({...prev, locationName: text}))}
                        placeholder="e.g., Central Park Gym, Downtown Library"
                    />

                    <TouchableOpacity
                        style={styles.locationButton}
                        onPress={getCurrentLocation}
                        disabled={locationFetching}
                    >
                        <Text style={styles.locationButtonText}>
                            {locationFetching ? 'Getting Location...' : 'Set Current Location'}
                        </Text>
                    </TouchableOpacity>

                    {(locationDetails.latitude !== 0 && locationDetails.longitude !== 0) && (
                        <View style={styles.locationInfo}>
                            <Text style={styles.locationText}>
                                Latitude: {locationDetails.latitude.toFixed(6)}
                            </Text>
                            <Text style={styles.locationText}>
                                Longitude: {locationDetails.longitude.toFixed(6)}
                            </Text>
                        </View>
                    )}

                    <Text style={styles.label}>Verification Radius (meters)</Text>
                    <TextInput
                        style={styles.input}
                        value={locationDetails.radius.toString()}
                        onChangeText={(text) => {
                            const radius = parseInt(text) || 100;
                            setLocationDetails(prev => ({...prev, radius}));
                        }}
                        keyboardType="numeric"
                        placeholder="100"
                    />
                </View>
            )}
        </View>
    );

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.keyboardAvoidingView}
            >
                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    keyboardShouldPersistTaps="handled"
                >
                    <View style={styles.header}>
                        <Text style={styles.title}>Create Challenge</Text>
                        <Text style={styles.subtitle}>Set up your new challenge</Text>
                    </View>

                    <View style={styles.form}>
                        {/* Title */}
                        <View style={styles.formGroup}>
                            <Text style={styles.label}>Title *</Text>
                            <TextInput
                                style={styles.input}
                                value={formData.title}
                                onChangeText={(text) => updateFormField('title', text)}
                                placeholder="Enter challenge title"
                            />
                        </View>

                        {/* Description */}
                        <View style={styles.formGroup}>
                            <Text style={styles.label}>Description *</Text>
                            <TextInput
                                style={[styles.input, styles.textArea]}
                                value={formData.description}
                                onChangeText={(text) => updateFormField('description', text)}
                                placeholder="Describe your challenge"
                                multiline
                                numberOfLines={3}
                            />
                        </View>

                        {/* Type */}
                        <View style={styles.formGroup}>
                            <Text style={styles.label}>Challenge Type</Text>
                            <View style={styles.pickerContainer}>
                                <Picker
                                    selectedValue={formData.type}
                                    onValueChange={(value) => updateFormField('type', value)}
                                    style={styles.picker}
                                >
                                    <Picker.Item label="Quest" value="QUEST"/>
                                    <Picker.Item label="Quiz" value="QUIZ"/>
                                    <Picker.Item label="Activity Partner" value="ACTIVITY_PARTNER"/>
                                    <Picker.Item label="Fitness Tracking" value="FITNESS_TRACKING"/>
                                    <Picker.Item label="Habit Building" value="HABIT_BUILDING"/>
                                </Picker>
                            </View>
                        </View>

                        {/* Visibility */}
                        <View style={styles.formGroup}>
                            <Text style={styles.label}>Visibility</Text>
                            <View style={styles.pickerContainer}>
                                <Picker
                                    selectedValue={formData.visibility}
                                    onValueChange={(value) => updateFormField('visibility', value)}
                                    style={styles.picker}
                                >
                                    <Picker.Item label="Public" value="PUBLIC"/>
                                    <Picker.Item label="Private" value="PRIVATE"/>
                                    <Picker.Item label="Group Only" value="GROUP_ONLY"/>
                                </Picker>
                            </View>
                        </View>

                        {/* Frequency */}
                        <View style={styles.formGroup}>
                            <Text style={styles.label}>Frequency</Text>
                            <View style={styles.pickerContainer}>
                                <Picker
                                    selectedValue={formData.frequency}
                                    onValueChange={(value) => updateFormField('frequency', value)}
                                    style={styles.picker}
                                >
                                    <Picker.Item label="One Time" value="ONE_TIME"/>
                                    <Picker.Item label="Daily" value="DAILY"/>
                                    <Picker.Item label="Weekly" value="WEEKLY"/>
                                </Picker>
                            </View>
                        </View>

                        {/* Verification Methods Toggle */}
                        <TouchableOpacity
                            style={styles.sectionToggle}
                            onPress={() => setShowVerificationOptions(!showVerificationOptions)}
                        >
                            <Text style={styles.sectionToggleText}>
                                {showVerificationOptions ? 'Hide Verification Options' : 'Show Verification Options'}
                            </Text>
                        </TouchableOpacity>

                        {/* Verification Methods */}
                        {showVerificationOptions && renderVerificationMethodSection()}

                        {/* Date Options Toggle */}
                        <TouchableOpacity
                            style={styles.sectionToggle}
                            onPress={() => setShowDateOptions(!showDateOptions)}
                        >
                            <Text style={styles.sectionToggleText}>
                                {showDateOptions ? 'Hide Date Options' : 'Show Date Options'}
                            </Text>
                        </TouchableOpacity>

                        {/* Date Options */}
                        {showDateOptions && (
                            <View style={styles.dateContainer}>
                                <Text style={styles.sectionTitle}>Challenge Schedule</Text>

                                <View style={styles.formGroup}>
                                    <Text style={styles.label}>Start Date</Text>
                                    <TouchableOpacity
                                        style={styles.dateButton}
                                        onPress={() => {
                                            // TODO: Implement date picker
                                            Alert.alert('Info', 'Date picker will be implemented');
                                        }}
                                    >
                                        <Text style={styles.dateButtonText}>
                                            {formData.startDate
                                                ? formData.startDate.toLocaleDateString()
                                                : 'Select Start Date'
                                            }
                                        </Text>
                                    </TouchableOpacity>
                                </View>

                                <View style={styles.formGroup}>
                                    <Text style={styles.label}>End Date</Text>
                                    <TouchableOpacity
                                        style={styles.dateButton}
                                        onPress={() => {
                                            // TODO: Implement date picker
                                            Alert.alert('Info', 'Date picker will be implemented');
                                        }}
                                    >
                                        <Text style={styles.dateButtonText}>
                                            {formData.endDate
                                                ? formData.endDate.toLocaleDateString()
                                                : 'Select End Date'
                                            }
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        )}

                        {/* Advanced Options Toggle */}
                        <TouchableOpacity
                            style={styles.sectionToggle}
                            onPress={() => setShowAdvancedOptions(!showAdvancedOptions)}
                        >
                            <Text style={styles.sectionToggleText}>
                                {showAdvancedOptions ? 'Hide Advanced Options' : 'Show Advanced Options'}
                            </Text>
                        </TouchableOpacity>

                        {/* Advanced Options Section */}
                        {showAdvancedOptions && (
                            <View style={styles.advancedContainer}>
                                <Text style={styles.sectionTitle}>Advanced Options</Text>

                                {/* Target Group */}
                                <View style={styles.formGroup}>
                                    <Text style={styles.label}>Target Group</Text>
                                    <TextInput
                                        style={styles.input}
                                        value={formData.targetGroup}
                                        onChangeText={(text) => updateFormField('targetGroup', text)}
                                        placeholder="Choose group (optional)"
                                    />
                                </View>

                                {/* Tags */}
                                <View style={styles.formGroup}>
                                    <Text style={styles.label}>Tags</Text>
                                    <TextInput
                                        style={styles.input}
                                        value={tagsInput}
                                        onChangeText={handleTagsChange}
                                        placeholder="Enter tags separated by commas (e.g., fitness, daily, workout)"
                                    />
                                    {formData.tags.length > 0 && (
                                        <View style={styles.tagsPreview}>
                                            {formData.tags.map((tag, index) => (
                                                <View key={index} style={styles.tag}>
                                                    <Text style={styles.tagText}>{tag}</Text>
                                                </View>
                                            ))}
                                        </View>
                                    )}
                                </View>

                                {/* Reward */}
                                <View style={styles.formGroup}>
                                    <Text style={styles.label}>Reward</Text>
                                    <TextInput
                                        style={styles.input}
                                        value={formData.reward}
                                        onChangeText={(text) => updateFormField('reward', text)}
                                        placeholder="What's the reward for completing this challenge?"
                                    />
                                </View>

                                {/* Penalty */}
                                <View style={styles.formGroup}>
                                    <Text style={styles.label}>Penalty</Text>
                                    <TextInput
                                        style={styles.input}
                                        value={formData.penalty}
                                        onChangeText={(text) => updateFormField('penalty', text)}
                                        placeholder="What's the penalty for failing?"
                                    />
                                </View>
                            </View>
                        )}

                        {/* Submit Button */}
                        <TouchableOpacity
                            style={[styles.submitButton, isLoading && styles.submitButtonDisabled]}
                            onPress={handleSubmit}
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <ActivityIndicator color="white" size="small" />
                            ) : (
                                <Text style={styles.submitButtonText}>Create Challenge</Text>
                            )}
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
    keyboardAvoidingView: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
        paddingBottom: 20,
    },
    header: {
        backgroundColor: '#4CAF50',
        padding: 20,
        paddingTop: 40,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: 'white',
        marginBottom: 4,
    },
    subtitle: {
        fontSize: 16,
        color: 'rgba(255, 255, 255, 0.9)',
    },
    form: {
        flex: 1,
        backgroundColor: 'white',
        margin: 16,
        borderRadius: 12,
        padding: 20,
        elevation: 2,
        shadowOpacity: 0.1,
        shadowRadius: 4,
        shadowOffset: {width: 0, height: 2},
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
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
        backgroundColor: '#fafafa',
    },
    textArea: {
        height: 80,
        textAlignVertical: 'top',
    },
    pickerContainer: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        backgroundColor: '#fafafa',
    },
    picker: {
        height: 50,
    },
    sectionToggle: {
        backgroundColor: '#f0f0f0',
        padding: 12,
        borderRadius: 8,
        marginVertical: 10,
        alignItems: 'center',
    },
    sectionToggleText: {
        fontSize: 16,
        fontWeight: '500',
        color: '#4CAF50',
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        marginBottom: 16,
        color: '#333',
    },
    verificationContainer: {
        backgroundColor: '#f9f9f9',
        padding: 16,
        borderRadius: 8,
        marginVertical: 8,
    },
    verificationDetailsContainer: {
        marginTop: 16,
        padding: 12,
        backgroundColor: '#fff',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#e0e0e0',
    },
    switchContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginVertical: 12,
    },
    locationButton: {
        backgroundColor: '#4CAF50',
        padding: 12,
        borderRadius: 8,
        alignItems: 'center',
        marginVertical: 8,
    },
    locationButtonText: {
        color: 'white',
        fontWeight: '600',
        fontSize: 16,
    },
    locationInfo: {
        backgroundColor: '#f0f8f0',
        padding: 10,
        borderRadius: 6,
        marginVertical: 8,
    },
    locationText: {
        fontSize: 14,
        color: '#2e7d32',
        fontFamily: 'monospace',
    },
    dateContainer: {
        backgroundColor: '#f9f9f9',
        padding: 16,
        borderRadius: 8,
        marginVertical: 8,
    },
    dateButton: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        padding: 12,
        backgroundColor: '#fafafa',
        alignItems: 'center',
    },
    dateButtonText: {
        fontSize: 16,
        color: '#333',
    },
    advancedContainer: {
        backgroundColor: '#f9f9f9',
        padding: 16,
        borderRadius: 8,
        marginVertical: 8,
    },
    tagsPreview: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginTop: 8,
    },
    tag: {
        backgroundColor: '#e3f2fd',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        margin: 2,
    },
    tagText: {
        fontSize: 12,
        color: '#1976d2',
    },
    submitButton: {
        backgroundColor: '#4CAF50',
        padding: 16,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 20,
    },
    submitButtonDisabled: {
        backgroundColor: '#a5d6a7',
        opacity: 0.7,
    },
    submitButtonText: {
        color: 'white',
        fontSize: 18,
        fontWeight: 'bold',
    },
});

export default CreateChallengeScreen;