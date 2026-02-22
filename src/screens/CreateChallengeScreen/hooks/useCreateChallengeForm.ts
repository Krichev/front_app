import { useState, useCallback } from 'react';
import { LocalizedString, EMPTY_LOCALIZED_STRING } from '../../../shared/types/localized';
import { ChallengeFrequency, ChallengeType, ChallengeVisibility, VerificationType } from '../../../app/types';

export interface CreateChallengeFormData {
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

export interface PhotoDetailsState {
    description: string;
    requiresComparison: boolean;
    verificationMode: 'standard' | 'selfie' | 'comparison';
}

export interface LocationDetailsState {
    latitude: number;
    longitude: number;
    radius: number;
    locationName: string;
}

export interface UseCreateChallengeFormResult {
    formData: CreateChallengeFormData;
    photoDetails: PhotoDetailsState;
    locationDetails: LocationDetailsState;
    tagsInput: string;
    showAdvancedOptions: boolean;
    showVerificationOptions: boolean;
    showDateOptions: boolean;
    updateFormField: (field: keyof CreateChallengeFormData, value: any) => void;
    setPhotoDetails: React.Dispatch<React.SetStateAction<PhotoDetailsState>>;
    setLocationDetails: React.Dispatch<React.SetStateAction<LocationDetailsState>>;
    setTagsInput: (text: string) => void;
    handleTagsChange: (text: string) => void;
    toggleAdvancedOptions: () => void;
    toggleVerificationOptions: () => void;
    toggleDateOptions: () => void;
    resetForm: () => void;
}

export function useCreateChallengeForm(): UseCreateChallengeFormResult {
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
    const updateFormField = useCallback((field: keyof CreateChallengeFormData, value: any) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
    }, []);

    // Handle tags input
    const handleTagsChange = useCallback((text: string) => {
        setTagsInput(text);
        const tagsArray = text
            .split(',')
            .map(tag => tag.trim())
            .filter(tag => tag.length > 0);
        updateFormField('tags', tagsArray);
    }, [updateFormField]);

    const toggleAdvancedOptions = useCallback(() => setShowAdvancedOptions(prev => !prev), []);
    const toggleVerificationOptions = useCallback(() => setShowVerificationOptions(prev => !prev), []);
    const toggleDateOptions = useCallback(() => setShowDateOptions(prev => !prev), []);

    const resetForm = useCallback(() => {
        setFormData({
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
        setPhotoDetails({
            description: '',
            requiresComparison: false,
            verificationMode: 'standard'
        });
        setLocationDetails({
            latitude: 0,
            longitude: 0,
            radius: 100,
            locationName: ''
        });
        setTagsInput('');
    }, []);

    return {
        formData,
        photoDetails,
        locationDetails,
        tagsInput,
        showAdvancedOptions,
        showVerificationOptions,
        showDateOptions,
        updateFormField,
        setPhotoDetails,
        setLocationDetails,
        setTagsInput,
        handleTagsChange,
        toggleAdvancedOptions,
        toggleVerificationOptions,
        toggleDateOptions,
        resetForm,
    };
}
