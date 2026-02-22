import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../../shared/ui/theme';
import { 
    useGetInvitationPreferencesQuery, 
    useUpdateInvitationPreferencesMutation 
} from '../../../entities/InvitationState/model/slice/invitationApi';
import { InvitationPreference, GenderPreference } from '../../../entities/InvitationState/model/types';
import { Button } from '../../../shared/ui/Button/Button';

export const InvitationPreferencesSection: React.FC = () => {
    const { t } = useTranslation();
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
            Alert.alert(t('common.success'), t('settings.invitationPreferences.updateSuccess'));
        } catch (error) {
            Alert.alert(t('common.error'), t('settings.invitationPreferences.updateError'));
        }
    };

    if (isLoading) {
        return <ActivityIndicator size="small" color={theme.colors.primary.main} />;
    }

    return (
        <View style={styles.container}>
            <Text style={[styles.title, { color: theme.colors.text.primary }]}>{t('settings.invitationPreferences.title')}</Text>
            
            <View style={styles.field}>
                <Text style={styles.label}>{t('settings.invitationPreferences.allowInvitationsFrom')}</Text>
                <View style={[styles.pickerContainer, { borderColor: theme.colors.border.main }]}>
                    <Picker
                        selectedValue={invitationPref}
                        onValueChange={(itemValue) => setInvitationPref(itemValue)}
                    >
                        <Picker.Item label={t('settings.invitationPreferences.options.ANYONE')} value="ANYONE" />
                        <Picker.Item label={t('settings.invitationPreferences.options.FRIENDS_ONLY')} value="FRIENDS_ONLY" />
                        <Picker.Item label={t('settings.invitationPreferences.options.FAMILY_ONLY')} value="FAMILY_ONLY" />
                        <Picker.Item label={t('settings.invitationPreferences.options.FRIENDS_AND_FAMILY')} value="FRIENDS_AND_FAMILY" />
                        <Picker.Item label={t('settings.invitationPreferences.options.NOBODY')} value="NOBODY" />
                    </Picker>
                </View>
            </View>

            <View style={styles.field}>
                <Text style={styles.label}>{t('settings.invitationPreferences.genderPreference')}</Text>
                <View style={[styles.pickerContainer, { borderColor: theme.colors.border.main }]}>
                    <Picker
                        selectedValue={genderPref}
                        onValueChange={(itemValue) => setGenderPref(itemValue)}
                    >
                        <Picker.Item label={t('settings.invitationPreferences.options.ANY_GENDER')} value="ANY_GENDER" />
                        <Picker.Item label={t('settings.invitationPreferences.options.MALE_ONLY')} value="MALE_ONLY" />
                        <Picker.Item label={t('settings.invitationPreferences.options.FEMALE_ONLY')} value="FEMALE_ONLY" />
                    </Picker>
                </View>
            </View>

            <Button onPress={handleSave} loading={isUpdating} style={styles.saveButton}>
                {t('settings.invitationPreferences.saveChanges')}
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
