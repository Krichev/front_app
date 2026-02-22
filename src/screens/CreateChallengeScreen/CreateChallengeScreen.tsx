import React from 'react';
import {
    Alert,
    KeyboardAvoidingView,
    Platform,
    SafeAreaView,
    ScrollView,
    View,
    ActivityIndicator,
    Text,
    TouchableOpacity,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSelector } from 'react-redux';
import { RootState } from '../../app/providers/StoreProvider/store';
import { CreateChallengeRequest, useCreateChallengeMutation } from '../../entities/ChallengeState/model/slice/challengeApi';
import { useAppStyles } from '../../shared/ui/hooks/useAppStyles';
import { getLocalizedValue } from '../../shared/types/localized';
import { useI18n } from '../../app/providers/I18nProvider';

// Hooks
import { useCreateChallengeForm } from './hooks/useCreateChallengeForm';
import { useGeolocation } from './hooks/useGeolocation';
import { buildVerificationDetails } from './hooks/useVerificationConfig';

// Components
import { ChallengeBasicInfoSection } from './components/ChallengeBasicInfoSection';
import { AdvancedOptionsSection } from './components/AdvancedOptionsSection';
import { VerificationMethodPicker } from './components/VerificationMethodPicker';
import { DateOptionsSection } from './components/DateOptionsSection';

// Lib
import { validateChallengeForm } from './lib/challengeFormValidator';

// Styles
import { styles as localStyles } from './styles';

const CreateChallengeScreen: React.FC = () => {
    const navigation = useNavigation();
    const { user } = useSelector((state: RootState) => state.auth);
    const [createChallenge, { isLoading }] = useCreateChallengeMutation();
    const { theme } = useAppStyles();
    const styles = localStyles;
    const { currentLanguage } = useI18n();

    const form = useCreateChallengeForm();
    const { getCurrentLocation, locationFetching } = useGeolocation();

    const handleSubmit = async () => {
        const validation = validateChallengeForm(form.formData, form.photoDetails, form.locationDetails);
        
        if (!validation.isValid) {
            Alert.alert('Error', validation.errorMessage || 'Invalid form data');
            return;
        }

        const verificationDetails = buildVerificationDetails(
            form.formData.verificationMethod,
            form.photoDetails,
            form.locationDetails
        );

        try {
            const requestData: CreateChallengeRequest = {
                title: getLocalizedValue(form.formData.title, currentLanguage),
                description: getLocalizedValue(form.formData.description, currentLanguage),
                titleLocalized: form.formData.title,
                descriptionLocalized: form.formData.description,
                type: form.formData.type,
                visibility: form.formData.visibility,
                status: 'ACTIVE',
                reward: form.formData.reward?.trim() || undefined,
                penalty: form.formData.penalty?.trim() || undefined,
                verificationMethod: form.formData.verificationMethod,
                verificationDetails: verificationDetails,
                targetGroup: form.formData.targetGroup?.trim() || undefined,
                frequency: form.formData.frequency,
                startDate: form.formData.startDate?.toISOString(),
                endDate: form.formData.endDate?.toISOString(),
                tags: form.formData.tags.length > 0 ? form.formData.tags : undefined,
                userId: user?.id || ''
            };

            await createChallenge(requestData).unwrap();

            Alert.alert('Success', 'Challenge created successfully!', [
                { text: 'OK', onPress: () => navigation.goBack() }
            ]);
        } catch (error: any) {
            console.error('Create challenge error:', error);
            const errorMessage = error?.data?.message || 'Failed to create challenge. Please try again.';
            Alert.alert('Error', errorMessage);
        }
    };

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
                        <ChallengeBasicInfoSection
                            formData={form.formData}
                            onUpdate={form.updateFormField}
                        />

                        <TouchableOpacity
                            style={styles.sectionToggle}
                            onPress={form.toggleVerificationOptions}
                        >
                            <Text style={styles.sectionToggleText}>
                                {form.showVerificationOptions ? 'Hide Verification Options' : 'Show Verification Options'}
                            </Text>
                        </TouchableOpacity>

                        {form.showVerificationOptions && (
                            <VerificationMethodPicker
                                selectedMethod={form.formData.verificationMethod}
                                onMethodChange={(method) => form.updateFormField('verificationMethod', method)}
                                photoDetails={form.photoDetails}
                                locationDetails={form.locationDetails}
                                onPhotoDetailsChange={(details) => form.setPhotoDetails(prev => ({ ...prev, ...details }))}
                                onLocationDetailsChange={(details) => form.setLocationDetails(prev => ({ ...prev, ...details }))}
                                onGetCurrentLocation={() => getCurrentLocation((latitude, longitude) => {
                                    form.setLocationDetails(prev => ({ ...prev, latitude, longitude }));
                                })}
                                locationFetching={locationFetching}
                                theme={theme}
                            />
                        )}

                        <DateOptionsSection
                            formData={form.formData}
                            showDateOptions={form.showDateOptions}
                            onToggle={form.toggleDateOptions}
                        />

                        <AdvancedOptionsSection
                            formData={form.formData}
                            tagsInput={form.tagsInput}
                            onUpdate={form.updateFormField}
                            onTagsChange={form.handleTagsChange}
                            showAdvancedOptions={form.showAdvancedOptions}
                            onToggle={form.toggleAdvancedOptions}
                            theme={theme}
                        />

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

export default CreateChallengeScreen;
