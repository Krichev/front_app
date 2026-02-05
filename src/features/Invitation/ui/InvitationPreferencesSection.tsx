import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { useTheme } from '../../../shared/ui/theme';
import { 
    useGetInvitationPreferencesQuery, 
    useUpdateInvitationPreferencesMutation 
} from '../../../entities/InvitationState/model/slice/invitationApi';
import { InvitationPreference, GenderPreference } from '../../../entities/InvitationState/model/types';
import { Button } from '../../../shared/ui/Button/Button';

export const InvitationPreferencesSection: React.FC = () => {
    const { theme } = useTheme();
    const { data: preferences, isLoading } = useGetInvitationPreferencesQuery();
    const [updatePreferences, { isLoading: isUpdating }] = useUpdateInvitationPreferencesMutation();
    
    const [invitationPref, setInvitationPref] = useState<InvitationPreference>('ANYONE');
    const [genderPref, setGenderPref] = useState<GenderPreference>('ANY_GENDER');

    useEffect(() => {
        if (preferences) {
            setInvitationPref(preferences.questInvitationPreference);
            setGenderPref(preferences.genderPreferenceForInvites);
        }
    }, [preferences]);

    const handleSave = async () => {
        try {
            await updatePreferences({
                questInvitationPreference: invitationPref,
                genderPreferenceForInvites: genderPref
            }).unwrap();
            Alert.alert('Success', 'Preferences updated');
        } catch (error) {
            Alert.alert('Error', 'Failed to update preferences');
        }
    };

    if (isLoading) {
        return <ActivityIndicator size="small" color={theme.colors.primary.main} />;
    }

    return (
        <View style={styles.container}>
            <Text style={[styles.title, { color: theme.colors.text.primary }]}>Invitation Privacy</Text>
            
            <View style={styles.field}>
                <Text style={styles.label}>Allow invitations from:</Text>
                <View style={[styles.pickerContainer, { borderColor: theme.colors.border.main }]}>
                    <Picker
                        selectedValue={invitationPref}
                        onValueChange={(itemValue) => setInvitationPref(itemValue)}
                    >
                        <Picker.Item label="Anyone" value="ANYONE" />
                        <Picker.Item label="Friends Only" value="FRIENDS_ONLY" />
                        <Picker.Item label="Family Only" value="FAMILY_ONLY" />
                        <Picker.Item label="Friends & Family" value="FRIENDS_AND_FAMILY" />
                        <Picker.Item label="Nobody" value="NOBODY" />
                    </Picker>
                </View>
            </View>

            <View style={styles.field}>
                <Text style={styles.label}>Gender preference:</Text>
                <View style={[styles.pickerContainer, { borderColor: theme.colors.border.main }]}>
                    <Picker
                        selectedValue={genderPref}
                        onValueChange={(itemValue) => setGenderPref(itemValue)}
                    >
                        <Picker.Item label="Any Gender" value="ANY_GENDER" />
                        <Picker.Item label="Male Only" value="MALE_ONLY" />
                        <Picker.Item label="Female Only" value="FEMALE_ONLY" />
                    </Picker>
                </View>
            </View>

            <Button onPress={handleSave} loading={isUpdating} style={styles.saveButton}>
                Save Changes
            </Button>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginTop: 16,
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 16,
    },
    field: {
        marginBottom: 16,
    },
    label: {
        fontSize: 14,
        marginBottom: 8,
        color: '#666',
        fontWeight: '600',
    },
    pickerContainer: {
        borderWidth: 1,
        borderRadius: 8,
        backgroundColor: '#fff',
    },
    saveButton: {
        marginTop: 8,
    }
});
