import { VerificationType } from '../../../app/types';
import { PhotoDetailsState, LocationDetailsState } from './useCreateChallengeForm';

export function buildVerificationDetails(
    verificationMethod: VerificationType | undefined,
    photoDetails: PhotoDetailsState,
    locationDetails: LocationDetailsState
): Record<string, any> | undefined {
    if (verificationMethod === 'PHOTO') {
        return {
            description: photoDetails.description,
            requiresComparison: photoDetails.requiresComparison,
            verificationMode: photoDetails.verificationMode
        };
    }
    
    if (verificationMethod === 'LOCATION') {
        return {
            latitude: locationDetails.latitude,
            longitude: locationDetails.longitude,
            radius: locationDetails.radius,
            locationName: locationDetails.locationName
        };
    }

    return undefined;
}
