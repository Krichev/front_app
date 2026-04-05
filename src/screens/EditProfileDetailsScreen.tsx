// src/screens/EditProfileDetailsScreen.tsx
import React, { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Modal,
    Platform,
    SafeAreaView,
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import Geolocation from '@react-native-community/geolocation';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { RootStackParamList } from '../navigation/AppNavigator';
import { useGetMyProfileDetailsQuery, useUpdateMyProfileDetailsMutation } from '../entities/SoloQuestState/model/slice/soloQuestApi';
import { RelationshipStatus } from '../entities/SoloQuestState/model/types';
import { useAppStyles } from '../shared/ui/hooks/useAppStyles';
import { createStyles } from '../shared/ui/theme';
import InterestTagInput from '../shared/ui/InterestTagInput/InterestTagInput';

type EditProfileDetailsRouteProp = RouteProp<RootStackParamList, 'EditProfileDetails'>;
type EditProfileDetailsNavProp = NativeStackNavigationProp<RootStackParamList, 'EditProfileDetails'>;

const RELATIONSHIP_STATUS_VALUES: RelationshipStatus[] = [
    'SINGLE',
    'IN_RELATIONSHIP',
    'MARRIED',
    'DIVORCED',
    'WIDOWED',
    'PREFER_NOT_TO_SAY',
];

function calculateAge(dob: Date): number {
    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    const monthDiff = today.getMonth() - dob.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
        age -= 1;
    }
    return age;
}

const EditProfileDetailsScreen: React.FC = () => {
    const { t } = useTranslation();
    const { theme } = useAppStyles();
    const styles = themeStyles;
    const route = useRoute<EditProfileDetailsRouteProp>();
    const navigation = useNavigation<EditProfileDetailsNavProp>();

    const { data: profile, isLoading: profileLoading } = useGetMyProfileDetailsQuery();
    const [updateMyProfileDetails, { isLoading: isSaving }] = useUpdateMyProfileDetailsMutation();

    // Form state
    const [dateOfBirth, setDateOfBirth] = useState<Date | null>(null);
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [relationshipStatus, setRelationshipStatus] = useState<RelationshipStatus | undefined>(undefined);
    const [showStatusPicker, setShowStatusPicker] = useState(false);
    const [city, setCity] = useState('');
    const [latitude, setLatitude] = useState<number | undefined>(undefined);
    const [longitude, setLongitude] = useState<number | undefined>(undefined);
    const [aboutMe, setAboutMe] = useState('');
    const [interests, setInterests] = useState<string[]>([]);
    const [isLocating, setIsLocating] = useState(false);

    // Pre-fill from existing profile
    useEffect(() => {
        if (profile) {
            if (profile.dateOfBirth) {
                setDateOfBirth(new Date(profile.dateOfBirth));
            }
            setRelationshipStatus(profile.relationshipStatus);
            setCity(profile.city || '');
            setLatitude(profile.latitude);
            setLongitude(profile.longitude);
            setAboutMe(profile.aboutMe || '');
            setInterests(profile.interests.map(i => i.tag));
        }
    }, [profile]);

    const validate = useCallback((): string | null => {
        if (dateOfBirth) {
            const today = new Date();
            if (dateOfBirth > today) {
                return t('editProfileDetails.validation.dobFuture');
            }
            if (calculateAge(dateOfBirth) < 18) {
                return t('editProfileDetails.validation.dobTooYoung');
            }
        }
        if (aboutMe.length > 500) {
            return t('editProfileDetails.validation.aboutMeTooLong');
        }
        if (city.length > 100) {
            return t('editProfileDetails.validation.cityTooLong');
        }
        if (interests.length > 20) {
            return t('editProfileDetails.validation.tooManyTags');
        }
        return null;
    }, [dateOfBirth, aboutMe, city, interests, t]);

    const handleSave = useCallback(async () => {
        const error = validate();
        if (error) {
            Alert.alert('', error);
            return;
        }
        try {
            await updateMyProfileDetails({
                dateOfBirth: dateOfBirth ? dateOfBirth.toISOString().split('T')[0] : undefined,
                relationshipStatus,
                city: city || undefined,
                latitude,
                longitude,
                aboutMe: aboutMe || undefined,
                interestTags: interests.length > 0 ? interests : undefined,
            }).unwrap();
            Alert.alert('', t('editProfileDetails.saveSuccess'));
            navigation.goBack();
        } catch {
            Alert.alert('', t('editProfileDetails.saveError'));
        }
    }, [validate, updateMyProfileDetails, dateOfBirth, relationshipStatus, city, latitude, longitude, aboutMe, interests, t, navigation]);

    const handleUseLocation = useCallback(() => {
        setIsLocating(true);
        Geolocation.getCurrentPosition(
            async (position) => {
                const { latitude: lat, longitude: lng } = position.coords;
                setLatitude(lat);
                setLongitude(lng);
                // Reverse geocode using a public endpoint
                try {
                    const resp = await fetch(
                        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
                        { headers: { 'User-Agent': 'ChallengerApp/1.0' } }
                    );
                    const json = await resp.json();
                    const cityName =
                        json?.address?.city ||
                        json?.address?.town ||
                        json?.address?.village ||
                        json?.address?.county ||
                        '';
                    if (cityName) {
                        setCity(cityName);
                    }
                } catch {
                    // ignore geocoding errors, coords were still saved
                }
                setIsLocating(false);
            },
            () => {
                setIsLocating(false);
                Alert.alert('', t('editProfileDetails.locationError'));
            },
            { enableHighAccuracy: false, timeout: 10000 }
        );
    }, [t]);

    const handleDateChange = useCallback((_: any, selected?: Date) => {
        setShowDatePicker(Platform.OS === 'ios');
        if (selected) {
            setDateOfBirth(selected);
        }
    }, []);

    if (profileLoading) {
        return (
            <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background.secondary }]}>
                <View style={styles.centered}>
                    <ActivityIndicator size="large" color={theme.colors.success.main} />
                </View>
            </SafeAreaView>
        );
    }

    const maxDOB = new Date();
    maxDOB.setFullYear(maxDOB.getFullYear() - 18);

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background.secondary }]}>
            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            >
                {/* Header */}
                <View style={[styles.header, { backgroundColor: theme.colors.background.primary, borderBottomColor: theme.colors.border.light }]}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                        <MaterialCommunityIcons name="arrow-left" size={24} color={theme.colors.text.primary} />
                    </TouchableOpacity>
                    <Text style={[styles.headerTitle, { color: theme.colors.text.primary }]}>
                        {t('editProfileDetails.title')}
                    </Text>
                    <View style={styles.backButton} />
                </View>

                <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">

                    {/* Date of Birth */}
                    <View style={[styles.section, { backgroundColor: theme.colors.background.primary }]}>
                        <Text style={[styles.label, { color: theme.colors.text.secondary }]}>
                            {t('editProfileDetails.dateOfBirthLabel')}
                        </Text>
                        <TouchableOpacity
                            style={[styles.pickerButton, { borderColor: theme.colors.border.main }]}
                            onPress={() => setShowDatePicker(true)}
                        >
                            <MaterialCommunityIcons name="calendar" size={20} color={theme.colors.text.secondary} />
                            <Text style={[styles.pickerButtonText, { color: dateOfBirth ? theme.colors.text.primary : theme.colors.text.disabled }]}>
                                {dateOfBirth
                                    ? `${dateOfBirth.toLocaleDateString()} (${calculateAge(dateOfBirth)} years)`
                                    : t('editProfileDetails.dateOfBirthPlaceholder')}
                            </Text>
                        </TouchableOpacity>
                        {showDatePicker && (
                            <DateTimePicker
                                value={dateOfBirth || maxDOB}
                                mode="date"
                                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                                maximumDate={maxDOB}
                                onChange={handleDateChange}
                            />
                        )}
                    </View>

                    {/* Relationship Status */}
                    <View style={[styles.section, { backgroundColor: theme.colors.background.primary }]}>
                        <Text style={[styles.label, { color: theme.colors.text.secondary }]}>
                            {t('editProfileDetails.relationshipStatusLabel')}
                        </Text>
                        <TouchableOpacity
                            style={[styles.pickerButton, { borderColor: theme.colors.border.main }]}
                            onPress={() => setShowStatusPicker(true)}
                        >
                            <MaterialCommunityIcons name="heart-outline" size={20} color={theme.colors.text.secondary} />
                            <Text style={[styles.pickerButtonText, { color: relationshipStatus ? theme.colors.text.primary : theme.colors.text.disabled }]}>
                                {relationshipStatus
                                    ? t(`editProfileDetails.relationshipStatus.${relationshipStatus}`)
                                    : t('editProfileDetails.relationshipStatusPlaceholder')}
                            </Text>
                            <MaterialCommunityIcons name="chevron-down" size={20} color={theme.colors.text.secondary} />
                        </TouchableOpacity>
                    </View>

                    {/* City */}
                    <View style={[styles.section, { backgroundColor: theme.colors.background.primary }]}>
                        <Text style={[styles.label, { color: theme.colors.text.secondary }]}>
                            {t('editProfileDetails.cityLabel')}
                        </Text>
                        <View style={styles.cityRow}>
                            <TextInput
                                style={[styles.textInput, { flex: 1, borderColor: theme.colors.border.main, color: theme.colors.text.primary }]}
                                value={city}
                                onChangeText={setCity}
                                placeholder={t('editProfileDetails.cityPlaceholder')}
                                placeholderTextColor={theme.colors.text.disabled}
                                maxLength={100}
                            />
                            <TouchableOpacity
                                style={[styles.locationButton, { backgroundColor: theme.colors.success.background }]}
                                onPress={handleUseLocation}
                                disabled={isLocating}
                            >
                                {isLocating ? (
                                    <ActivityIndicator size="small" color={theme.colors.success.main} />
                                ) : (
                                    <MaterialCommunityIcons name="crosshairs-gps" size={20} color={theme.colors.success.main} />
                                )}
                            </TouchableOpacity>
                        </View>
                        {isLocating && (
                            <Text style={[styles.hintText, { color: theme.colors.text.disabled }]}>
                                {t('editProfileDetails.locating')}
                            </Text>
                        )}
                    </View>

                    {/* About Me */}
                    <View style={[styles.section, { backgroundColor: theme.colors.background.primary }]}>
                        <View style={styles.labelRow}>
                            <Text style={[styles.label, { color: theme.colors.text.secondary }]}>
                                {t('editProfileDetails.aboutMeLabel')}
                            </Text>
                            <Text style={[styles.charCount, { color: aboutMe.length > 500 ? theme.colors.error.main : theme.colors.text.disabled }]}>
                                {aboutMe.length}/500
                            </Text>
                        </View>
                        <TextInput
                            style={[styles.textArea, { borderColor: theme.colors.border.main, color: theme.colors.text.primary }]}
                            value={aboutMe}
                            onChangeText={setAboutMe}
                            placeholder={t('editProfileDetails.aboutMePlaceholder')}
                            placeholderTextColor={theme.colors.text.disabled}
                            multiline
                            numberOfLines={4}
                            maxLength={510}
                        />
                    </View>

                    {/* Interests */}
                    <View style={[styles.section, { backgroundColor: theme.colors.background.primary }]}>
                        <View style={styles.labelRow}>
                            <Text style={[styles.label, { color: theme.colors.text.secondary }]}>
                                {t('editProfileDetails.interestsLabel')}
                            </Text>
                            <Text style={[styles.charCount, { color: theme.colors.text.disabled }]}>
                                {interests.length}/20
                            </Text>
                        </View>
                        <InterestTagInput
                            tags={interests}
                            onTagsChange={setInterests}
                            maxTags={20}
                            placeholder={t('editProfileDetails.interestsPlaceholder')}
                        />
                    </View>

                    {/* Save Button */}
                    <TouchableOpacity
                        style={[
                            styles.saveButton,
                            { backgroundColor: theme.colors.success.main },
                            isSaving && { opacity: 0.7 },
                        ]}
                        onPress={handleSave}
                        disabled={isSaving}
                    >
                        {isSaving ? (
                            <ActivityIndicator size="small" color={theme.colors.text.inverse} />
                        ) : (
                            <Text style={[styles.saveButtonText, { color: theme.colors.text.inverse }]}>
                                {isSaving ? t('editProfileDetails.saving') : t('editProfileDetails.save')}
                            </Text>
                        )}
                    </TouchableOpacity>
                </ScrollView>
            </KeyboardAvoidingView>

            {/* Relationship Status Modal */}
            <Modal
                visible={showStatusPicker}
                transparent
                animationType="fade"
                onRequestClose={() => setShowStatusPicker(false)}
            >
                <TouchableOpacity
                    style={styles.modalOverlay}
                    activeOpacity={1}
                    onPress={() => setShowStatusPicker(false)}
                >
                    <View style={[styles.modalSheet, { backgroundColor: theme.colors.background.primary }]}>
                        <Text style={[styles.modalTitle, { color: theme.colors.text.primary }]}>
                            {t('editProfileDetails.relationshipStatusLabel')}
                        </Text>
                        {RELATIONSHIP_STATUS_VALUES.map((status) => (
                            <TouchableOpacity
                                key={status}
                                style={[
                                    styles.modalOption,
                                    relationshipStatus === status && { backgroundColor: theme.colors.success.background },
                                ]}
                                onPress={() => {
                                    setRelationshipStatus(status);
                                    setShowStatusPicker(false);
                                }}
                            >
                                <Text style={[
                                    styles.modalOptionText,
                                    { color: theme.colors.text.primary },
                                    relationshipStatus === status && { color: theme.colors.success.main, fontWeight: 'bold' },
                                ]}>
                                    {t(`editProfileDetails.relationshipStatus.${status}`)}
                                </Text>
                                {relationshipStatus === status && (
                                    <MaterialCommunityIcons name="check" size={18} color={theme.colors.success.main} />
                                )}
                            </TouchableOpacity>
                        ))}
                    </View>
                </TouchableOpacity>
            </Modal>
        </SafeAreaView>
    );
};

const themeStyles = createStyles(theme => ({
    container: {
        flex: 1,
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: theme.spacing.md,
        paddingVertical: theme.spacing.sm,
        borderBottomWidth: 1,
    },
    backButton: {
        width: 44,
        height: 44,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        ...theme.typography.heading.h6,
        fontWeight: theme.typography.fontWeight.bold,
    },
    scrollContent: {
        padding: theme.spacing.md,
        gap: theme.spacing.sm,
        paddingBottom: theme.spacing['3xl'],
    },
    section: {
        borderRadius: theme.layout.borderRadius.md,
        padding: theme.spacing.md,
        ...theme.shadows.small,
    },
    label: {
        ...theme.typography.body.small,
        fontWeight: theme.typography.fontWeight.medium,
        marginBottom: theme.spacing.xs,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    labelRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: theme.spacing.xs,
    },
    charCount: {
        ...theme.typography.caption,
    },
    pickerButton: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderRadius: theme.layout.borderRadius.sm,
        padding: theme.spacing.sm,
        gap: theme.spacing.xs,
    },
    pickerButtonText: {
        flex: 1,
        ...theme.typography.body.medium,
    },
    cityRow: {
        flexDirection: 'row',
        gap: theme.spacing.xs,
    },
    textInput: {
        borderWidth: 1,
        borderRadius: theme.layout.borderRadius.sm,
        paddingHorizontal: theme.spacing.sm,
        paddingVertical: theme.spacing.sm,
        ...theme.typography.body.medium,
    },
    textArea: {
        borderWidth: 1,
        borderRadius: theme.layout.borderRadius.sm,
        paddingHorizontal: theme.spacing.sm,
        paddingVertical: theme.spacing.sm,
        ...theme.typography.body.medium,
        minHeight: 100,
        textAlignVertical: 'top',
    },
    locationButton: {
        width: 44,
        height: 44,
        borderRadius: theme.layout.borderRadius.sm,
        justifyContent: 'center',
        alignItems: 'center',
    },
    hintText: {
        ...theme.typography.caption,
        marginTop: theme.spacing.xs,
    },
    saveButton: {
        borderRadius: theme.layout.borderRadius.md,
        paddingVertical: theme.spacing.md,
        alignItems: 'center',
        marginTop: theme.spacing.sm,
    },
    saveButtonText: {
        ...theme.typography.body.large,
        fontWeight: theme.typography.fontWeight.bold,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalSheet: {
        borderTopLeftRadius: theme.layout.borderRadius.xl,
        borderTopRightRadius: theme.layout.borderRadius.xl,
        padding: theme.spacing.xl,
        paddingBottom: theme.spacing['3xl'],
        ...theme.shadows.large,
    },
    modalTitle: {
        ...theme.typography.heading.h6,
        fontWeight: theme.typography.fontWeight.bold,
        marginBottom: theme.spacing.md,
    },
    modalOption: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: theme.spacing.md,
        paddingHorizontal: theme.spacing.sm,
        borderRadius: theme.layout.borderRadius.sm,
    },
    modalOptionText: {
        ...theme.typography.body.medium,
    },
}));

export default EditProfileDetailsScreen;
