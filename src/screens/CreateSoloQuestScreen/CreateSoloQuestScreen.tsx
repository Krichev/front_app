// src/screens/CreateSoloQuestScreen/CreateSoloQuestScreen.tsx
import React, { useCallback, useState } from 'react';
import {
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    SafeAreaView,
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { RootStackParamList } from '../../navigation/AppNavigator';
import { useAppStyles } from '../../shared/ui/hooks/useAppStyles';
import { createStyles } from '../../shared/ui/theme';
import { useLocationPermission } from '../../shared/hooks/useLocationPermission';
import { useCreateSoloQuestForm } from './hooks/useCreateSoloQuestForm';
import DepositPolicySelector from './components/DepositPolicySelector';
import AudienceFilterSection from './components/AudienceFilterSection';
import { DepositPolicy, RelationshipStatus, TargetGender } from '../../entities/SoloQuestState/model/types';

type NavProp = NativeStackNavigationProp<RootStackParamList>;
type DatePickerMode = 'date' | 'time' | null;

function formatDate(d: Date): string {
    return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

function formatTime(d: Date): string {
    return d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
}

const CreateSoloQuestScreen: React.FC = () => {
    const { t } = useTranslation();
    const { theme } = useAppStyles();
    const styles = themeStyles;
    const navigation = useNavigation<NavProp>();

    const { form, setField, fillLocation, handleSubmit, isLoading } = useCreateSoloQuestForm();
    const [datePickerMode, setDatePickerMode] = useState<DatePickerMode>(null);

    const {
        latitude: gpsLat,
        longitude: gpsLng,
        city: gpsCity,
        loading: gpsLoading,
        refresh: refreshLocation,
    } = useLocationPermission();

    const handleUseMyLocation = useCallback(() => {
        refreshLocation();
        if (gpsLat !== null && gpsLng !== null) {
            fillLocation(gpsLat, gpsLng, gpsCity ?? '');
        }
    }, [gpsLat, gpsLng, gpsCity, fillLocation, refreshLocation]);

    const handleDateChange = useCallback((_: any, selectedDate?: Date) => {
        if (Platform.OS === 'android') {
            setDatePickerMode(null);
        }
        if (selectedDate) {
            if (datePickerMode === 'date') {
                setField('meetupDate', selectedDate);
            } else {
                setField('meetupTime', selectedDate);
            }
        }
    }, [datePickerMode, setField]);

    const openDatePicker = useCallback(() => setDatePickerMode('date'), []);
    const openTimePicker = useCallback(() => setDatePickerMode('time'), []);
    const closeDatePicker = useCallback(() => setDatePickerMode(null), []);

    const handleTitleChange = useCallback((v: string) => setField('title', v), [setField]);
    const handleDescriptionChange = useCallback((v: string) => setField('description', v), [setField]);
    const handleLocationNameChange = useCallback((v: string) => setField('meetupLocationName', v), [setField]);
    const handleLatChange = useCallback((v: string) => setField('meetupLatitude', v), [setField]);
    const handleLngChange = useCallback((v: string) => setField('meetupLongitude', v), [setField]);
    const handleToggleManualCoords = useCallback(() => setField('showManualCoords', !form.showManualCoords), [form.showManualCoords, setField]);

    const handleTargetGenderChange = useCallback((v: TargetGender) => setField('targetGender', v), [setField]);
    const handleTargetAgeMinChange = useCallback((v: string) => setField('targetAgeMin', v), [setField]);
    const handleTargetAgeMaxChange = useCallback((v: string) => setField('targetAgeMax', v), [setField]);
    const handleRelationshipStatusChange = useCallback((v: RelationshipStatus | '') => setField('targetRelationshipStatus', v), [setField]);
    const handleInterestsChange = useCallback((v: string[]) => setField('requiredInterests', v), [setField]);
    const handleMaxDistanceChange = useCallback((v: string) => setField('maxDistanceKm', v), [setField]);

    const handleDepositPolicyChange = useCallback((v: DepositPolicy) => setField('depositPolicy', v), [setField]);
    const handleStakeTypeChange = useCallback((v: string) => setField('stakeType', v), [setField]);
    const handleStakeAmountChange = useCallback((v: string) => setField('stakeAmount', v), [setField]);
    const handleStakeCurrencyChange = useCallback((v: string) => setField('stakeCurrency', v), [setField]);
    const handleSocialPenaltyChange = useCallback((v: string) => setField('socialPenaltyDescription', v), [setField]);

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background.primary }]}>
            {/* Header */}
            <View style={[styles.header, { borderBottomColor: theme.colors.border.main }]}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconButton}>
                    <MaterialCommunityIcons name="arrow-left" size={24} color={theme.colors.text.primary} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: theme.colors.text.primary }]}>
                    {t('createSoloQuest.title')}
                </Text>
                <View style={styles.iconButton} />
            </View>

            <KeyboardAvoidingView
                style={styles.flex}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            >
                <ScrollView
                    style={styles.flex}
                    contentContainerStyle={styles.scrollContent}
                    keyboardShouldPersistTaps="handled"
                >
                    {/* ─── WHAT ─── */}
                    <Text style={[styles.sectionHeader, { color: theme.colors.text.primary }]}>
                        {t('createSoloQuest.sections.what')}
                    </Text>

                    <Text style={[styles.label, { color: theme.colors.text.secondary }]}>
                        {t('soloQuest.form.titleLabel')}
                    </Text>
                    <TextInput
                        style={[styles.input, {
                            borderColor: theme.colors.border.main,
                            color: theme.colors.text.primary,
                            backgroundColor: theme.colors.background.primary,
                        }]}
                        value={form.title}
                        onChangeText={handleTitleChange}
                        placeholder={t('soloQuest.form.titlePlaceholder')}
                        placeholderTextColor={theme.colors.text.disabled}
                        maxLength={100}
                        returnKeyType="next"
                    />

                    <Text style={[styles.label, { color: theme.colors.text.secondary }]}>
                        {t('soloQuest.form.descriptionLabel')}
                    </Text>
                    <TextInput
                        style={[styles.input, styles.multilineInput, {
                            borderColor: theme.colors.border.main,
                            color: theme.colors.text.primary,
                            backgroundColor: theme.colors.background.primary,
                        }]}
                        value={form.description}
                        onChangeText={handleDescriptionChange}
                        placeholder={t('soloQuest.form.descriptionPlaceholder')}
                        placeholderTextColor={theme.colors.text.disabled}
                        multiline
                        maxLength={1000}
                    />

                    {/* ─── WHEN ─── */}
                    <Text style={[styles.sectionHeader, { color: theme.colors.text.primary }]}>
                        {t('createSoloQuest.sections.when')}
                    </Text>
                    <Text style={[styles.label, { color: theme.colors.text.secondary }]}>
                        {t('soloQuest.form.datetimeLabel')}
                    </Text>
                    <View style={styles.dateRow}>
                        <TouchableOpacity
                            style={[styles.dateButton, { borderColor: theme.colors.border.main }]}
                            onPress={openDatePicker}
                        >
                            <MaterialCommunityIcons name="calendar" size={18} color={theme.colors.text.secondary} />
                            <Text style={[styles.dateButtonText, { color: theme.colors.text.primary }]}>
                                {formatDate(form.meetupDate)}
                            </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.dateButton, { borderColor: theme.colors.border.main }]}
                            onPress={openTimePicker}
                        >
                            <MaterialCommunityIcons name="clock-outline" size={18} color={theme.colors.text.secondary} />
                            <Text style={[styles.dateButtonText, { color: theme.colors.text.primary }]}>
                                {formatTime(form.meetupTime)}
                            </Text>
                        </TouchableOpacity>
                    </View>

                    {datePickerMode !== null && (
                        <DateTimePicker
                            value={datePickerMode === 'date' ? form.meetupDate : form.meetupTime}
                            mode={datePickerMode}
                            display={Platform.OS === 'ios' ? 'inline' : 'default'}
                            minimumDate={datePickerMode === 'date' ? new Date() : undefined}
                            onChange={handleDateChange}
                            onTouchCancel={closeDatePicker}
                        />
                    )}

                    {/* ─── WHERE ─── */}
                    <Text style={[styles.sectionHeader, { color: theme.colors.text.primary }]}>
                        {t('createSoloQuest.sections.where')}
                    </Text>

                    <Text style={[styles.label, { color: theme.colors.text.secondary }]}>
                        {t('soloQuest.form.locationLabel')}
                    </Text>
                    <TextInput
                        style={[styles.input, {
                            borderColor: theme.colors.border.main,
                            color: theme.colors.text.primary,
                            backgroundColor: theme.colors.background.primary,
                        }]}
                        value={form.meetupLocationName}
                        onChangeText={handleLocationNameChange}
                        placeholder={t('soloQuest.form.locationPlaceholder')}
                        placeholderTextColor={theme.colors.text.disabled}
                        maxLength={200}
                        returnKeyType="next"
                    />

                    <TouchableOpacity
                        style={[styles.locationButton, { borderColor: theme.colors.success.main }]}
                        onPress={handleUseMyLocation}
                        disabled={gpsLoading}
                    >
                        <MaterialCommunityIcons name="crosshairs-gps" size={18} color={theme.colors.success.main} />
                        <Text style={[styles.locationButtonText, { color: theme.colors.success.main }]}>
                            {gpsLoading ? t('createSoloQuest.locating') : t('createSoloQuest.useMyLocation')}
                        </Text>
                        {gpsLoading && <ActivityIndicator size="small" color={theme.colors.success.main} />}
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.toggleRow} onPress={handleToggleManualCoords}>
                        <MaterialCommunityIcons
                            name={form.showManualCoords ? 'chevron-up' : 'chevron-down'}
                            size={18}
                            color={theme.colors.text.secondary}
                        />
                        <Text style={[styles.toggleText, { color: theme.colors.text.secondary }]}>
                            {t('createSoloQuest.showManualCoords')}
                        </Text>
                    </TouchableOpacity>

                    {form.showManualCoords && (
                        <View style={styles.coordsRow}>
                            <View style={styles.coordField}>
                                <Text style={[styles.label, { color: theme.colors.text.secondary, marginTop: 0 }]}>
                                    {t('createSoloQuest.latLabel')}
                                </Text>
                                <TextInput
                                    style={[styles.input, {
                                        borderColor: theme.colors.border.main,
                                        color: theme.colors.text.primary,
                                        backgroundColor: theme.colors.background.primary,
                                    }]}
                                    value={form.meetupLatitude}
                                    onChangeText={handleLatChange}
                                    placeholder={t('createSoloQuest.latPlaceholder')}
                                    placeholderTextColor={theme.colors.text.disabled}
                                    keyboardType="numeric"
                                />
                            </View>
                            <View style={styles.coordField}>
                                <Text style={[styles.label, { color: theme.colors.text.secondary, marginTop: 0 }]}>
                                    {t('createSoloQuest.lngLabel')}
                                </Text>
                                <TextInput
                                    style={[styles.input, {
                                        borderColor: theme.colors.border.main,
                                        color: theme.colors.text.primary,
                                        backgroundColor: theme.colors.background.primary,
                                    }]}
                                    value={form.meetupLongitude}
                                    onChangeText={handleLngChange}
                                    placeholder={t('createSoloQuest.lngPlaceholder')}
                                    placeholderTextColor={theme.colors.text.disabled}
                                    keyboardType="numeric"
                                />
                            </View>
                        </View>
                    )}

                    {!form.showManualCoords && (form.meetupLatitude || form.meetupLongitude) ? (
                        <Text style={[styles.coordsDisplay, { color: theme.colors.text.secondary }]}>
                            {form.meetupLatitude}, {form.meetupLongitude}
                        </Text>
                    ) : null}

                    {/* ─── WHO (collapsible) ─── */}
                    <AudienceFilterSection
                        targetGender={form.targetGender}
                        targetAgeMin={form.targetAgeMin}
                        targetAgeMax={form.targetAgeMax}
                        targetRelationshipStatus={form.targetRelationshipStatus}
                        requiredInterests={form.requiredInterests}
                        maxDistanceKm={form.maxDistanceKm}
                        onTargetGenderChange={handleTargetGenderChange}
                        onTargetAgeMinChange={handleTargetAgeMinChange}
                        onTargetAgeMaxChange={handleTargetAgeMaxChange}
                        onTargetRelationshipStatusChange={handleRelationshipStatusChange}
                        onRequiredInterestsChange={handleInterestsChange}
                        onMaxDistanceKmChange={handleMaxDistanceChange}
                    />

                    {/* ─── DEPOSIT / PENALTY ─── */}
                    <Text style={[styles.sectionHeader, { color: theme.colors.text.primary }]}>
                        {t('createSoloQuest.sections.deposit')}
                    </Text>
                    <DepositPolicySelector
                        depositPolicy={form.depositPolicy}
                        stakeType={form.stakeType}
                        stakeAmount={form.stakeAmount}
                        stakeCurrency={form.stakeCurrency}
                        socialPenaltyDescription={form.socialPenaltyDescription}
                        onDepositPolicyChange={handleDepositPolicyChange}
                        onStakeTypeChange={handleStakeTypeChange}
                        onStakeAmountChange={handleStakeAmountChange}
                        onStakeCurrencyChange={handleStakeCurrencyChange}
                        onSocialPenaltyChange={handleSocialPenaltyChange}
                    />

                    <View style={styles.spacer} />
                </ScrollView>

                {/* Submit footer */}
                <View style={[styles.footer, {
                    borderTopColor: theme.colors.border.main,
                    backgroundColor: theme.colors.background.primary,
                }]}>
                    <TouchableOpacity
                        style={[
                            styles.submitButton,
                            { backgroundColor: theme.colors.success.main },
                            isLoading && styles.submitButtonDisabled,
                        ]}
                        onPress={handleSubmit}
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <>
                                <ActivityIndicator size="small" color={theme.colors.text.inverse} />
                                <Text style={[styles.submitButtonText, { color: theme.colors.text.inverse }]}>
                                    {t('createSoloQuest.creating')}
                                </Text>
                            </>
                        ) : (
                            <Text style={[styles.submitButtonText, { color: theme.colors.text.inverse }]}>
                                {t('soloQuest.form.submitButton')}
                            </Text>
                        )}
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

const themeStyles = createStyles(theme => ({
    container: {
        flex: 1,
    },
    flex: {
        flex: 1,
    },
    header: {
        flexDirection: 'row' as const,
        alignItems: 'center' as const,
        justifyContent: 'space-between' as const,
        paddingHorizontal: theme.spacing.md,
        paddingVertical: theme.spacing.sm,
        borderBottomWidth: 1,
    },
    iconButton: {
        width: 44,
        height: 44,
        justifyContent: 'center' as const,
        alignItems: 'center' as const,
    },
    headerTitle: {
        ...theme.typography.heading.h6,
        fontWeight: theme.typography.fontWeight.bold,
    },
    scrollContent: {
        paddingHorizontal: theme.spacing.lg,
        paddingTop: theme.spacing.md,
        paddingBottom: theme.spacing.xl,
    },
    sectionHeader: {
        ...theme.typography.heading.h6,
        fontWeight: theme.typography.fontWeight.bold,
        marginTop: theme.spacing.xl,
        marginBottom: theme.spacing.sm,
    },
    label: {
        ...theme.typography.body.small,
        fontWeight: theme.typography.fontWeight.medium,
        textTransform: 'uppercase' as const,
        letterSpacing: 0.5,
        marginBottom: theme.spacing.xs,
        marginTop: theme.spacing.md,
    },
    input: {
        borderWidth: 1,
        borderRadius: theme.layout.borderRadius.sm,
        paddingHorizontal: theme.spacing.sm,
        paddingVertical: theme.spacing.sm,
        ...theme.typography.body.medium,
    },
    multilineInput: {
        minHeight: 88,
        textAlignVertical: 'top' as const,
    },
    dateRow: {
        flexDirection: 'row' as const,
        gap: theme.spacing.sm,
    },
    dateButton: {
        flex: 1,
        flexDirection: 'row' as const,
        alignItems: 'center' as const,
        gap: theme.spacing.xs,
        borderWidth: 1,
        borderRadius: theme.layout.borderRadius.sm,
        paddingHorizontal: theme.spacing.sm,
        paddingVertical: theme.spacing.sm,
    },
    dateButtonText: {
        ...theme.typography.body.medium,
    },
    locationButton: {
        flexDirection: 'row' as const,
        alignItems: 'center' as const,
        gap: theme.spacing.xs,
        borderWidth: 1,
        borderRadius: theme.layout.borderRadius.sm,
        paddingHorizontal: theme.spacing.md,
        paddingVertical: theme.spacing.sm,
        marginTop: theme.spacing.sm,
        alignSelf: 'flex-start' as const,
    },
    locationButtonText: {
        ...theme.typography.body.medium,
        fontWeight: theme.typography.fontWeight.medium,
    },
    toggleRow: {
        flexDirection: 'row' as const,
        alignItems: 'center' as const,
        gap: theme.spacing.xs,
        marginTop: theme.spacing.sm,
        paddingVertical: theme.spacing.xs,
    },
    toggleText: {
        ...theme.typography.body.small,
    },
    coordsRow: {
        flexDirection: 'row' as const,
        gap: theme.spacing.sm,
        marginTop: theme.spacing.xs,
    },
    coordField: {
        flex: 1,
    },
    coordsDisplay: {
        ...theme.typography.caption,
        marginTop: theme.spacing.xs,
    },
    spacer: {
        height: theme.spacing['3xl'],
    },
    footer: {
        padding: theme.spacing.md,
        borderTopWidth: 1,
    },
    submitButton: {
        flexDirection: 'row' as const,
        alignItems: 'center' as const,
        justifyContent: 'center' as const,
        paddingVertical: theme.spacing.md,
        borderRadius: theme.layout.borderRadius.md,
        gap: theme.spacing.sm,
    },
    submitButtonDisabled: {
        opacity: 0.6,
    },
    submitButtonText: {
        ...theme.typography.body.large,
        fontWeight: theme.typography.fontWeight.bold,
    },
}));

export default CreateSoloQuestScreen;
