import React from 'react';
import { View, Text, TextInput, TouchableOpacity } from 'react-native';
import { styles } from '../styles';
import { Theme } from '../../../shared/ui/theme/types';
import { LocationDetailsState } from '../hooks/useCreateChallengeForm';

interface LocationVerificationFieldsProps {
    locationDetails: LocationDetailsState;
    onUpdate: (details: Partial<LocationDetailsState>) => void;
    onGetCurrentLocation: () => void;
    locationFetching: boolean;
    theme: Theme;
}

export const LocationVerificationFields: React.FC<LocationVerificationFieldsProps> = ({
    locationDetails,
    onUpdate,
    onGetCurrentLocation,
    locationFetching,
    theme,
}) => {
    return (
        <View style={styles.verificationDetailsContainer}>
            <Text style={styles.label}>Location Name</Text>
            <TextInput
                style={styles.input}
                value={locationDetails.locationName}
                onChangeText={(text) => onUpdate({ locationName: text })}
                placeholder="e.g., Central Park Gym, Downtown Library"
                placeholderTextColor={theme.colors.text.disabled}
            />

            <TouchableOpacity
                style={styles.locationButton}
                onPress={onGetCurrentLocation}
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
                    onUpdate({ radius });
                }}
                keyboardType="numeric"
                placeholder="100"
                placeholderTextColor={theme.colors.text.disabled}
            />
        </View>
    );
};
