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
import {useCreateChallengeMutation} from '../entities/ChallengeState/model/slice/challengeApi';
import {Picker} from '@react-native-picker/picker';
import {ChallengeFrequency, ChallengeType, ChallengeVisibility, VerificationMethod} from '../app/types';
import Geolocation from '@react-native-community/geolocation';

interface CreateChallengeFormData {
    title: string;
    description: string;
    type: ChallengeType;
    visibility: ChallengeVisibility;
    reward?: string;
    penalty?: string;
    targetGroup?: string;
    verificationMethods: VerificationMethod[];
    frequency: ChallengeFrequency;
    startDate?: Date;
    endDate?: Date;
}

const CreateChallengeScreen: React.FC = () => {
    const navigation = useNavigation();
    const [createChallenge, {isLoading}] = useCreateChallengeMutation();
    const [locationFetching, setLocationFetching] = useState<boolean>(false);
    const [locationAddress, setLocationAddress] = useState<string>('');

    // Form state
    const [formData, setFormData] = useState<CreateChallengeFormData>({
        title: '',
        description: '',
        type: 'QUEST',
        visibility: 'PUBLIC',
        reward: '',
        penalty: '',
        targetGroup: '',
        verificationMethods: [
            {
                type: 'PHOTO',
                enabled: false,
                details: {
                    photoPrompt: '',
                    requiredItems: [],
                    aiPrompt: '',
                }
            },
            {
                type: 'LOCATION',
                enabled: false,
                details: {
                    locationData: {
                        latitude: 0,
                        longitude: 0,
                        address: '',
                        radius: 100, // Default 100 meters
                    }
                }
            },
            {
                type: 'FITNESS_DATA',
                enabled: false,
                details: {}
            },
            {
                type: 'MANUAL',
                enabled: false,
                details: {}
            }
        ],
        frequency: 'DAILY',
    });

    // State for advanced options toggle
    const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);
    const [showVerificationOptions, setShowVerificationOptions] = useState(false);

    // Update form data
    const updateFormField = (field: keyof CreateChallengeFormData, value: any) => {
        setFormData({...formData, [field]: value});
    };

    // Toggle verification method
    const toggleVerificationMethod = (index: number) => {
        const newVerificationMethods = [...formData.verificationMethods];
        newVerificationMethods[index].enabled = !newVerificationMethods[index].enabled;
        setFormData({...formData, verificationMethods: newVerificationMethods});
    };

    // Update verification method details
    const updateVerificationDetails = (index: number, details: any) => {
        const newVerificationMethods = [...formData.verificationMethods];
        newVerificationMethods[index].details = {
            ...newVerificationMethods[index].details,
            ...details
        };
        setFormData({...formData, verificationMethods: newVerificationMethods});
    };

    // Request location permission for Android
    const requestLocationPermission = async () => {
        if (Platform.OS === 'ios') {
            return true;
        }

        try {
            const granted = await PermissionsAndroid.request(
                PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
                {
                    title: "Location Permission",
                    message: "This app needs access to your location to verify challenges.",
                    buttonNeutral: "Ask Me Later",
                    buttonNegative: "Cancel",
                    buttonPositive: "OK"
                }
            );
            return granted === PermissionsAndroid.RESULTS.GRANTED;
        } catch (err) {
            console.warn(err);
            return false;
        }
    };

    // Fetch current location
    const fetchCurrentLocation = async () => {
        try {
            setLocationFetching(true);

            const hasPermission = await requestLocationPermission();

            if (!hasPermission) {
                Alert.alert('Permission Denied', 'Permission to access location was denied');
                setLocationFetching(false);
                return;
            }

            Geolocation.getCurrentPosition(
                (position) => {
                    const {latitude, longitude} = position.coords;

                    // Since we don't have direct reverse geocoding from react-native-geolocation-service,
                    // we'll just use coordinates and let users know they'll need to implement geocoding
                    const addressString = `Lat: ${latitude.toFixed(6)}, Long: ${longitude.toFixed(6)}`;

                    setLocationAddress(addressString);

                    // Update location in verification method
                    const locationIndex = formData.verificationMethods.findIndex(vm => vm.type === 'LOCATION');
                    if (locationIndex >= 0) {
                        updateVerificationDetails(locationIndex, {
                            locationData: {
                                latitude,
                                longitude,
                                address: addressString,
                                radius: formData.verificationMethods[locationIndex].details.locationData?.radius || 100
                            }
                        });
                    }

                    setLocationFetching(false);
                },
                (error) => {
                    console.error('Error fetching location:', error);
                    Alert.alert('Error', 'Failed to fetch your location: ' + error.message);
                    setLocationFetching(false);
                },
                {
                    enableHighAccuracy: true,
                    timeout: 15000,
                    maximumAge: 10000
                }
            );
        } catch (error) {
            console.error('Error fetching location:', error);
            Alert.alert('Error', 'Failed to fetch your location');
            setLocationFetching(false);
        }
    };

    // Handle submit
    const handleSubmit = async () => {
        if (!formData.title.trim()) {
            Alert.alert('Error', 'Please enter a title for your challenge');
            return;
        }
        for (const key in formData) {
            if (formData.hasOwnProperty(key)) {
                // @ts-ignore
                console.log(`${key}: ${formData[key]}`);
            }
        }
        // Format verification methods for API
        const activeVerificationMethods = formData.verificationMethods
            .filter(vm => vm.enabled)
            .map(({type, details}) => ({
                type,
                details
            }));

        // Make sure we have at least one verification method if we're creating a daily challenge
        if (formData.frequency === 'DAILY' && activeVerificationMethods.length === 0) {
            Alert.alert('Error', 'Daily challenges require at least one verification method');
            return;
        }

        try {
            await createChallenge({
                title: formData.title,
                description: formData.description,
                type: formData.type,
                visibility: formData.visibility,
                status: 'ACTIVE',
                reward: formData.reward,
                penalty: formData.penalty,
                verificationMethod: JSON.stringify(activeVerificationMethods), // Correctly stringify the array
                targetGroup: formData.targetGroup,
                frequency: formData.frequency,
                startDate: formData.startDate,
                endDate: formData.endDate
            }).unwrap();

            Alert.alert('Success', 'Challenge created successfully', [
                {text: 'OK', onPress: () => navigation.goBack()}
            ]);
        } catch (error) {
            Alert.alert('Error', 'Failed to create challenge. Please try again.');
            console.error('Create challenge error:', error);
        }
    };

    const photoVerificationIndex = formData.verificationMethods.findIndex(vm => vm.type === 'PHOTO');
    const locationVerificationIndex = formData.verificationMethods.findIndex(vm => vm.type === 'LOCATION');
    const photoVerification = formData.verificationMethods[photoVerificationIndex];
    const locationVerification = formData.verificationMethods[locationVerificationIndex];

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.keyboardAvoid}
            >
                <ScrollView contentContainerStyle={styles.scrollContainer}>
                    <View style={styles.header}>
                        <Text style={styles.headerTitle}>Create New Challenge</Text>
                    </View>

                    <View style={styles.formContainer}>
                        {/* Title */}
                        <View style={styles.formGroup}>
                            <Text style={styles.label}>Title *</Text>
                            <TextInput
                                style={styles.input}
                                value={formData.title}
                                onChangeText={(text) => updateFormField('title', text)}
                                placeholder="Enter a title for your challenge"
                                maxLength={255}
                            />
                        </View>

                        {/* Description */}
                        <View style={styles.formGroup}>
                            <Text style={styles.label}>Description</Text>
                            <TextInput
                                style={[styles.input, styles.textArea]}
                                value={formData.description}
                                onChangeText={(text) => updateFormField('description', text)}
                                placeholder="Describe your challenge..."
                                multiline
                                numberOfLines={4}
                            />
                        </View>

                        {/* Challenge Type */}
                        <View style={styles.formGroup}>
                            <Text style={styles.label}>Type</Text>
                            <View style={styles.pickerContainer}>
                                <Picker
                                    selectedValue={formData.type}
                                    onValueChange={(value: string) => updateFormField('type', value)}
                                    style={styles.picker}
                                >
                                    <Picker.Item label="QUEST" value="QUEST"/>
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

                        {/* Verification Methods Toggle */}
                        <TouchableOpacity
                            style={styles.advancedToggle}
                            onPress={() => setShowVerificationOptions(!showVerificationOptions)}
                        >
                            <Text style={styles.advancedToggleText}>
                                {showVerificationOptions ? 'Hide Verification Options' : 'Show Verification Options'}
                            </Text>
                        </TouchableOpacity>

                        {/* Verification Methods */}
                        {showVerificationOptions && (
                            <View style={styles.verificationContainer}>
                                <Text style={styles.sectionTitle}>Verification Methods</Text>

                                {/* Photo Verification */}
                                <View style={styles.verificationMethod}>
                                    <View style={styles.verificationHeader}>
                                        <Text style={styles.verificationTitle}>Photo Verification</Text>
                                        <Switch
                                            value={photoVerification.enabled}
                                            onValueChange={() => toggleVerificationMethod(photoVerificationIndex)}
                                            trackColor={{false: '#767577', true: '#81b0ff'}}
                                            thumbColor={photoVerification.enabled ? '#4CAF50' : '#f4f3f4'}
                                        />
                                    </View>

                                    {photoVerification.enabled && (
                                        <View style={styles.verificationDetails}>
                                            <Text style={styles.detailLabel}>What should be in the photo?</Text>
                                            <TextInput
                                                style={[styles.input, styles.textArea]}
                                                value={photoVerification.details.photoPrompt}
                                                onChangeText={(text) =>
                                                    updateVerificationDetails(photoVerificationIndex, {photoPrompt: text})
                                                }
                                                placeholder="E.g., Person wearing a different shirt each day"
                                                multiline
                                                numberOfLines={3}
                                            />

                                            <Text style={styles.detailLabel}>AI Instructions (Optional)</Text>
                                            <TextInput
                                                style={[styles.input, styles.textArea]}
                                                value={photoVerification.details.aiPrompt}
                                                onChangeText={(text) =>
                                                    updateVerificationDetails(photoVerificationIndex, {aiPrompt: text})
                                                }
                                                placeholder="E.g., Check if person is wearing a shirt different from previous days"
                                                multiline
                                                numberOfLines={3}
                                            />
                                        </View>
                                    )}
                                </View>

                                {/* Location Verification */}
                                <View style={styles.verificationMethod}>
                                    <View style={styles.verificationHeader}>
                                        <Text style={styles.verificationTitle}>Location Verification</Text>
                                        <Switch
                                            value={locationVerification.enabled}
                                            onValueChange={() => toggleVerificationMethod(locationVerificationIndex)}
                                            trackColor={{false: '#767577', true: '#81b0ff'}}
                                            thumbColor={locationVerification.enabled ? '#4CAF50' : '#f4f3f4'}
                                        />
                                    </View>

                                    {locationVerification.enabled && (
                                        <View style={styles.verificationDetails}>
                                            <Text style={styles.detailLabel}>Location</Text>

                                            <View style={styles.locationContainer}>
                                                <TextInput
                                                    style={[styles.input, {flex: 1}]}
                                                    value={locationVerification.details.locationData?.address || locationAddress}
                                                    placeholder="Set location for verification"
                                                    editable={false}
                                                />
                                                <TouchableOpacity
                                                    style={styles.locationButton}
                                                    onPress={fetchCurrentLocation}
                                                    disabled={locationFetching}
                                                >
                                                    {locationFetching ? (
                                                        <ActivityIndicator size="small" color="white"/>
                                                    ) : (
                                                        <Text style={styles.locationButtonText}>Get Current</Text>
                                                    )}
                                                </TouchableOpacity>
                                            </View>

                                            <Text style={styles.detailLabel}>Radius (meters)</Text>
                                            <TextInput
                                                style={styles.input}
                                                value={locationVerification.details.locationData?.radius.toString()}
                                                onChangeText={(text) => {
                                                    const radius = parseInt(text) || 100;
                                                    const locationData = {
                                                        ...locationVerification.details.locationData,
                                                        radius
                                                    };
                                                    updateVerificationDetails(locationVerificationIndex, {locationData});
                                                }}
                                                placeholder="100"
                                                keyboardType="numeric"
                                            />
                                        </View>
                                    )}
                                </View>
                            </View>
                        )}

                        {/* Advanced Options Toggle */}
                        <TouchableOpacity
                            style={styles.advancedToggle}
                            onPress={() => setShowAdvancedOptions(!showAdvancedOptions)}
                        >
                            <Text style={styles.advancedToggleText}>
                                {showAdvancedOptions ? 'Hide Advanced Options' : 'Show Advanced Options'}
                            </Text>
                        </TouchableOpacity>

                        {/* Advanced Options Section */}
                        {showAdvancedOptions && (
                            <>
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
                            </>
                        )}

                        {/* Submit Button */}
                        <TouchableOpacity
                            style={styles.submitButton}
                            onPress={handleSubmit}
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <ActivityIndicator color="white" size="small"/>
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
    keyboardAvoid: {
        flex: 1,
    },
    scrollContainer: {
        flexGrow: 1,
    },
    header: {
        padding: 16,
        backgroundColor: '#4CAF50',
        elevation: 4,
        shadowOpacity: 0.2,
        shadowRadius: 3,
        shadowOffset: {width: 0, height: 2},
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: 'white',
    },
    formContainer: {
        padding: 16,
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
        backgroundColor: 'white',
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
    },
    textArea: {
        minHeight: 100,
        textAlignVertical: 'top',
    },
    pickerContainer: {
        backgroundColor: 'white',
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        overflow: 'hidden',
    },
    picker: {
        height: 50,
    },
    advancedToggle: {
        padding: 10,
        alignItems: 'center',
        marginVertical: 8,
    },
    advancedToggleText: {
        color: '#4CAF50',
        fontWeight: '600',
        fontSize: 14,
    },
    submitButton: {
        backgroundColor: '#4CAF50',
        padding: 16,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 16,
    },
    submitButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },
    verificationContainer: {
        backgroundColor: 'white',
        borderRadius: 8,
        padding: 16,
        marginBottom: 16,
        elevation: 1,
        shadowOpacity: 0.1,
        shadowRadius: 2,
        shadowOffset: {width: 0, height: 1},
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        marginBottom: 16,
        color: '#333',
    },
    verificationMethod: {
        marginBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
        paddingBottom: 16,
    },
    verificationHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    verificationTitle: {
        fontSize: 16,
        fontWeight: '500',
        color: '#333',
    },
    verificationDetails: {
        marginLeft: 8,
    },
    detailLabel: {
        fontSize: 14,
        fontWeight: '500',
        marginBottom: 6,
        marginTop: 10,
        color: '#555',
    },
    locationContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    locationButton: {
        backgroundColor: '#4CAF50',
        padding: 12,
        borderRadius: 8,
        marginLeft: 8,
    },
    locationButtonText: {
        color: 'white',
        fontWeight: '500',
    },
});

export default CreateChallengeScreen;