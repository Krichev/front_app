import i18n from 'i18next';
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
        return { isValid: false, errorMessage: i18n.t('createChallenge.validation.titleRequired') };
    }

    if (isLocalizedStringEmpty(formData.description)) {
        return { isValid: false, errorMessage: i18n.t('createChallenge.validation.descriptionRequired') };
    }

    // PHOTO verification validation
    if (formData.verificationMethod === 'PHOTO') {
        if (!photoDetails.description.trim()) {
            return { isValid: false, errorMessage: i18n.t('createChallenge.validation.photoDescRequired') };
        }
    }

    // LOCATION verification validation
    if (formData.verificationMethod === 'LOCATION') {
        if (!locationDetails.latitude || !locationDetails.longitude) {
            return { isValid: false, errorMessage: i18n.t('createChallenge.validation.locationRequired') };
        }
    }

    return { isValid: true, errorMessage: null };
}
