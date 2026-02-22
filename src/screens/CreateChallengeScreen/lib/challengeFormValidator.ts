import { isLocalizedStringEmpty } from '../../../shared/types/localized';
import { VerificationType } from '../../../app/types';
import { CreateChallengeFormData, PhotoDetailsState, LocationDetailsState } from '../hooks/useCreateChallengeForm';

export interface ValidationResult {
    isValid: boolean;
    errorMessage: string | null;
}

export function validateChallengeForm(
    formData: CreateChallengeFormData,
    photoDetails: PhotoDetailsState,
    locationDetails: LocationDetailsState
): ValidationResult {
    // Basic validation
    if (isLocalizedStringEmpty(formData.title)) {
        return { isValid: false, errorMessage: 'Please enter a challenge title' };
    }

    if (isLocalizedStringEmpty(formData.description)) {
        return { isValid: false, errorMessage: 'Please enter a challenge description' };
    }

    // PHOTO verification validation
    if (formData.verificationMethod === 'PHOTO') {
        if (!photoDetails.description.trim()) {
            return { isValid: false, errorMessage: 'Please provide a description for photo verification' };
        }
    }

    // LOCATION verification validation
    if (formData.verificationMethod === 'LOCATION') {
        if (!locationDetails.latitude || !locationDetails.longitude) {
            return { isValid: false, errorMessage: 'Please set location coordinates for location verification' };
        }
    }

    return { isValid: true, errorMessage: null };
}
