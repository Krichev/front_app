import React, {useState} from 'react';
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    PermissionsAndroid,
    Platform,
    SafeAreaView,
    ScrollView,
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
import {useAppStyles} from '../shared/ui/hooks/useAppStyles';
import {createStyles} from '../shared/ui/theme';
import { LocalizedInput } from '../shared/ui/LocalizedInput';
import { LocalizedString, EMPTY_LOCALIZED_STRING, getLocalizedValue, isLocalizedStringEmpty } from '../shared/types/localized';
import { useI18n } from '../app/providers/I18nProvider';

interface CreateChallengeFormData {
    title: LocalizedString;
    description: LocalizedString;
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
    const {screen, theme} = useAppStyles();
    const styles = themeStyles;
    const { currentLanguage } = useI18n();

    // Loading states
    const [locationFetching, setLocationFetching] = useState<boolean>(false);

    // UI state
    const [showAdvancedOptions, setShowAdvancedOptions] = useState<boolean>(false);
    const [showVerificationOptions, setShowVerificationOptions] = useState<boolean>(false);
    const [showDateOptions, setShowDateOptions] = useState<boolean>(false);

    // Form state
    const [formData, setFormData] = useState<CreateChallengeFormData>({
        title: EMPTY_LOCALIZED_STRING,
        description: EMPTY_LOCALIZED_STRING,
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
        if (isLocalizedStringEmpty(formData.title)) {
            Alert.alert('Error', 'Please enter a challenge title');
            return;
        }

        if (isLocalizedStringEmpty(formData.description)) {
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
                title: getLocalizedValue(formData.title, currentLanguage),
                description: getLocalizedValue(formData.description, currentLanguage),
                titleLocalized: formData.title,
                descriptionLocalized: formData.description,
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
                        placeholderTextColor={theme.colors.text.disabled}
                    />

                    <View style={styles.switchContainer}>
                        <Text style={styles.label}>Require Photo Comparison</Text>
                        <Switch
                            value={photoDetails.requiresComparison}
                            onValueChange={(value) => setPhotoDetails(prev => ({...prev, requiresComparison: value}))}
                            trackColor={{false: theme.colors.neutral.gray[400], true: theme.colors.info.light}}
                            thumbColor={photoDetails.requiresComparison ? theme.colors.info.main : theme.colors.neutral.gray[50]}
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
                        placeholderTextColor={theme.colors.text.disabled}
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
                        placeholderTextColor={theme.colors.text.disabled}
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
                            <LocalizedInput
                                label="Title *"
                                value={formData.title}
                                onChangeLocalized={(text) => updateFormField('title', text)}
                                placeholder={{
                                    en: 'Enter challenge title',
                                    ru: 'Введите название челленджа'
                                }}
                                required
                            />
                        </View>

                        {/* Description */}
                        <View style={styles.formGroup}>
                            <LocalizedInput
                                label="Description *"
                                value={formData.description}
                                onChangeLocalized={(text) => updateFormField('description', text)}
                                placeholder={{
                                    en: 'Describe your challenge',
                                    ru: 'Опишите ваш челлендж'
                                }}
                                multiline
                                numberOfLines={3}
                                required
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
                                        placeholderTextColor={theme.colors.text.disabled}
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
                                        placeholderTextColor={theme.colors.text.disabled}
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
                                        placeholderTextColor={theme.colors.text.disabled}
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
                                        placeholderTextColor={theme.colors.text.disabled}
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
                                <ActivityIndicator color={theme.colors.text.inverse} size="small" />
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

const themeStyles = createStyles(theme => ({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background.secondary,
    },
    keyboardAvoidingView: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
        paddingBottom: theme.spacing.xl,
    },
    header: {
        backgroundColor: theme.colors.success.main,
        padding: theme.spacing.xl,
        paddingTop: theme.spacing['3xl'],
    },
    title: {
        ...theme.typography.heading.h5,
        fontWeight: theme.typography.fontWeight.bold,
        color: theme.colors.text.inverse,
        marginBottom: theme.spacing.xs,
    },
    subtitle: {
        ...theme.typography.body.medium,
        color: 'rgba(255, 255, 255, 0.9)',
    },
    form: {
        flex: 1,
        backgroundColor: theme.colors.background.primary,
        margin: theme.spacing.lg,
        borderRadius: theme.layout.borderRadius.lg,
        padding: theme.spacing.xl,
        ...theme.shadows.small,
    },
    formGroup: {
        marginBottom: theme.spacing.xl,
    },
    label: {
        ...theme.typography.body.medium,
        fontWeight: theme.typography.fontWeight.semibold,
        marginBottom: theme.spacing.sm,
        color: theme.colors.text.primary,
    },
    input: {
        borderWidth: 1,
        borderColor: theme.colors.border.light,
        borderRadius: theme.layout.borderRadius.md,
        padding: theme.spacing.md,
        ...theme.typography.body.medium,
        backgroundColor: theme.colors.background.secondary,
        color: theme.colors.text.primary,
    },
    textArea: {
        height: 80,
        textAlignVertical: 'top',
    },
    pickerContainer: {
        borderWidth: 1,
        borderColor: theme.colors.border.light,
        borderRadius: theme.layout.borderRadius.md,
        backgroundColor: theme.colors.background.secondary,
    },
    picker: {
        height: 50,
    },
    sectionToggle: {
        backgroundColor: theme.colors.background.tertiary,
        padding: theme.spacing.md,
        borderRadius: theme.layout.borderRadius.md,
        marginVertical: theme.spacing.sm,
        alignItems: 'center',
    },
    sectionToggleText: {
        ...theme.typography.body.medium,
        fontWeight: theme.typography.fontWeight.medium,
        color: theme.colors.success.main,
    },
    sectionTitle: {
        ...theme.typography.heading.h6,
        fontWeight: theme.typography.fontWeight.semibold,
        marginBottom: theme.spacing.lg,
        color: theme.colors.text.primary,
    },
    verificationContainer: {
        backgroundColor: theme.colors.background.tertiary,
        padding: theme.spacing.lg,
        borderRadius: theme.layout.borderRadius.md,
        marginVertical: theme.spacing.sm,
    },
    verificationDetailsContainer: {
        marginTop: theme.spacing.lg,
        padding: theme.spacing.md,
        backgroundColor: theme.colors.background.primary,
        borderRadius: theme.layout.borderRadius.md,
        borderWidth: 1,
        borderColor: theme.colors.border.light,
    },
    switchContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginVertical: theme.spacing.md,
    },
    locationButton: {
        backgroundColor: theme.colors.success.main,
        padding: theme.spacing.md,
        borderRadius: theme.layout.borderRadius.md,
        alignItems: 'center',
        marginVertical: theme.spacing.sm,
    },
    locationButtonText: {
        color: theme.colors.text.inverse,
        fontWeight: theme.typography.fontWeight.semibold,
        fontSize: theme.typography.fontSize.base,
    },
    locationInfo: {
        backgroundColor: theme.colors.success.background,
        padding: theme.spacing.sm,
        borderRadius: theme.layout.borderRadius.sm,
        marginVertical: theme.spacing.sm,
    },
    locationText: {
        ...theme.typography.body.small,
        color: theme.colors.success.dark,
        fontFamily: theme.typography.fontFamily.mono,
    },
    dateContainer: {
        backgroundColor: theme.colors.background.tertiary,
        padding: theme.spacing.lg,
        borderRadius: theme.layout.borderRadius.md,
        marginVertical: theme.spacing.sm,
    },
    dateButton: {
        borderWidth: 1,
        borderColor: theme.colors.border.light,
        borderRadius: theme.layout.borderRadius.md,
        padding: theme.spacing.md,
        backgroundColor: theme.colors.background.secondary,
        alignItems: 'center',
    },
    dateButtonText: {
        ...theme.typography.body.medium,
        color: theme.colors.text.primary,
    },
    advancedContainer: {
        backgroundColor: theme.colors.background.tertiary,
        padding: theme.spacing.lg,
        borderRadius: theme.layout.borderRadius.md,
        marginVertical: theme.spacing.sm,
    },
    tagsPreview: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginTop: theme.spacing.sm,
    },
    tag: {
        backgroundColor: theme.colors.info.background,
        paddingHorizontal: theme.spacing.sm,
        paddingVertical: theme.spacing.xs,
        borderRadius: theme.layout.borderRadius.md,
        margin: 2,
    },
    tagText: {
        ...theme.typography.caption,
        color: theme.colors.info.dark,
    },
    submitButton: {
        backgroundColor: theme.colors.success.main,
        padding: theme.spacing.lg,
        borderRadius: theme.layout.borderRadius.md,
        alignItems: 'center',
        marginTop: theme.spacing.xl,
    },
    submitButtonDisabled: {
        backgroundColor: theme.colors.success.light,
        opacity: 0.7,
    },
    submitButtonText: {
        color: theme.colors.text.inverse,
        ...theme.typography.body.large,
        fontWeight: theme.typography.fontWeight.bold,
    },
}));

export default CreateChallengeScreen;
