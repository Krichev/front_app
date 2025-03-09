import React, {useState} from 'react';
import {
    ActivityIndicator,
    Alert,
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
import {useNavigation} from '@react-navigation/native';
import {useCreateChallengeMutation} from '../entities/ChallengeState/model/slice/challengeApi';
import {Picker} from '@react-native-picker/picker';

// Challenge type definition
type ChallengeType = 'CHALLENGE' | 'QUIZ' | 'ACTIVITY_PARTNER' | 'FITNESS_TRACKING' | 'HABIT_BUILDING';
type ChallengeVisibility = 'PUBLIC' | 'PRIVATE' | 'GROUP_ONLY';

interface CreateChallengeFormData {
    title: string;
    description: string;
    type: ChallengeType;
    visibility: ChallengeVisibility;
    reward?: string;
    penalty?: string;
    verificationMethod?: string;
    targetGroup?: string;
}

const CreateChallengeScreen: React.FC = () => {
    const navigation = useNavigation();
    const [createChallenge, {isLoading}] = useCreateChallengeMutation();

    // Form state
    const [formData, setFormData] = useState<CreateChallengeFormData>({
        title: '',
        description: '',
        type: 'CHALLENGE',
        visibility: 'PUBLIC',
        reward: '',
        penalty: '',
        verificationMethod: '',
        targetGroup: '',
    });

    // State for advanced options toggle
    const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);

    // Update form data
    const updateFormField = (field: keyof CreateChallengeFormData, value: string) => {
        setFormData({...formData, [field]: value});
    };

    // Handle submit
    const handleSubmit = async () => {
        if (!formData.title.trim()) {
            Alert.alert('Error', 'Please enter a title for your challenge');
            return;
        }

        try {
            await createChallenge({
                title: formData.title,
                description: formData.description,
                type: formData.type,
                visibility: formData.visibility,
                status: 'OPEN',
                reward: formData.reward,
                penalty: formData.penalty,
                verificationMethod: formData.verificationMethod,
                targetGroup: formData.targetGroup,
            }).unwrap();

            Alert.alert('Success', 'Challenge created successfully', [
                {text: 'OK', onPress: () => navigation.goBack()}
            ]);
        } catch (error) {
            Alert.alert('Error', 'Failed to create challenge. Please try again.');
            console.error('Create challenge error:', error);
        }
    };

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
                                    <Picker.Item label="Challenge" value="CHALLENGE"/>
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

                                {/* Verification Method */}
                                <View style={styles.formGroup}>
                                    <Text style={styles.label}>Verification Method</Text>
                                    <TextInput
                                        style={[styles.input, styles.textArea]}
                                        value={formData.verificationMethod}
                                        onChangeText={(text) => updateFormField('verificationMethod', text)}
                                        placeholder="How will completion be verified? (e.g., fitness tracker, photo, etc.)"
                                        multiline
                                        numberOfLines={3}
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
});

export default CreateChallengeScreen;