import React from 'react';
import { View, Text } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { styles } from '../styles';
import { Theme } from '../../../shared/ui/theme/types';
import { VerificationType } from '../../../app/types';
import { PhotoDetailsState, LocationDetailsState } from '../hooks/useCreateChallengeForm';
import { PhotoVerificationFields } from './PhotoVerificationFields';
import { LocationVerificationFields } from './LocationVerificationFields';

interface VerificationMethodPickerProps {
    selectedMethod: VerificationType | undefined;
    onMethodChange: (method: VerificationType | undefined) => void;
    photoDetails: PhotoDetailsState;
    locationDetails: LocationDetailsState;
    onPhotoDetailsChange: (details: Partial<PhotoDetailsState>) => void;
    onLocationDetailsChange: (details: Partial<LocationDetailsState>) => void;
    onGetCurrentLocation: () => void;
    locationFetching: boolean;
    theme: Theme;
}

const VERIFICATION_METHOD_OPTIONS = [
    { label: 'No Verification', value: 'NONE' },
    { label: 'Photo Verification', value: 'PHOTO' },
    { label: 'Location Verification', value: 'LOCATION' },
    { label: 'Quiz Verification', value: 'QUIZ' },
    { label: 'Manual Verification', value: 'MANUAL' },
    { label: 'Fitness API', value: 'FITNESS_API' },
    { label: 'Activity Tracking', value: 'ACTIVITY' },
];

export const VerificationMethodPicker: React.FC<VerificationMethodPickerProps> = ({
    selectedMethod,
    onMethodChange,
    photoDetails,
    locationDetails,
    onPhotoDetailsChange,
    onLocationDetailsChange,
    onGetCurrentLocation,
    locationFetching,
    theme,
}) => {
    return (
        <View style={styles.verificationContainer}>
            <Text style={styles.sectionTitle}>Verification Method</Text>

            <View style={styles.pickerContainer}>
                <Picker
                    selectedValue={selectedMethod || 'NONE'}
                    onValueChange={(value) => {
                        if (value === 'NONE') {
                            onMethodChange(undefined);
                        } else {
                            onMethodChange(value as VerificationType);
                        }
                    }}
                    style={styles.picker}
                >
                    {VERIFICATION_METHOD_OPTIONS.map((option) => (
                        <Picker.Item key={option.value} label={option.label} value={option.value} />
                    ))}
                </Picker>
            </View>

            {selectedMethod === 'PHOTO' && (
                <PhotoVerificationFields
                    photoDetails={photoDetails}
                    onUpdate={onPhotoDetailsChange}
                    theme={theme}
                />
            )}

            {selectedMethod === 'LOCATION' && (
                <LocationVerificationFields
                    locationDetails={locationDetails}
                    onUpdate={onLocationDetailsChange}
                    onGetCurrentLocation={onGetCurrentLocation}
                    locationFetching={locationFetching}
                    theme={theme}
                />
            )}
        </View>
    );
};
