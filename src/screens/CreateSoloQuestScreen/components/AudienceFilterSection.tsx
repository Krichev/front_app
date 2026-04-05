// src/screens/CreateSoloQuestScreen/components/AudienceFilterSection.tsx
import React, { useCallback, useState } from 'react';
import { Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { createStyles } from '../../../shared/ui/theme';
import { useAppStyles } from '../../../shared/ui/hooks/useAppStyles';
import { RelationshipStatus, TargetGender } from '../../../entities/SoloQuestState/model/types';
import InterestTagInput from '../../../shared/ui/InterestTagInput/InterestTagInput';

const TARGET_GENDERS: TargetGender[] = ['ANY', 'MALE', 'FEMALE'];
const RELATIONSHIP_STATUSES: (RelationshipStatus | '')[] = [
    '',
    'SINGLE',
    'IN_RELATIONSHIP',
    'MARRIED',
    'DIVORCED',
    'WIDOWED',
    'PREFER_NOT_TO_SAY',
];
const DISTANCE_OPTIONS = [5, 10, 20, 30, 50];

interface AudienceFilterSectionProps {
    targetGender: TargetGender;
    targetAgeMin: string;
    targetAgeMax: string;
    targetRelationshipStatus: RelationshipStatus | '';
    requiredInterests: string[];
    maxDistanceKm: string;
    onTargetGenderChange: (value: TargetGender) => void;
    onTargetAgeMinChange: (value: string) => void;
    onTargetAgeMaxChange: (value: string) => void;
    onTargetRelationshipStatusChange: (value: RelationshipStatus | '') => void;
    onRequiredInterestsChange: (value: string[]) => void;
    onMaxDistanceKmChange: (value: string) => void;
}

const AudienceFilterSection: React.FC<AudienceFilterSectionProps> = ({
    targetGender,
    targetAgeMin,
    targetAgeMax,
    targetRelationshipStatus,
    requiredInterests,
    maxDistanceKm,
    onTargetGenderChange,
    onTargetAgeMinChange,
    onTargetAgeMaxChange,
    onTargetRelationshipStatusChange,
    onRequiredInterestsChange,
    onMaxDistanceKmChange,
}) => {
    const { t } = useTranslation();
    const { theme } = useAppStyles();
    const styles = themeStyles;
    const [expanded, setExpanded] = useState(false);

    const toggleExpand = useCallback(() => setExpanded(v => !v), []);

    return (
        <View style={[styles.container, { borderColor: theme.colors.border.light }]}>
            <TouchableOpacity style={styles.header} onPress={toggleExpand} activeOpacity={0.7}>
                <Text style={[styles.sectionTitle, { color: theme.colors.text.primary }]}>
                    {t('createSoloQuest.sections.who')}
                </Text>
                <MaterialCommunityIcons
                    name={expanded ? 'chevron-up' : 'chevron-down'}
                    size={22}
                    color={theme.colors.text.secondary}
                />
            </TouchableOpacity>

            {expanded && (
                <View style={styles.body}>
                    {/* Target gender */}
                    <Text style={[styles.label, { color: theme.colors.text.secondary }]}>
                        {t('soloQuest.form.targetGenderLabel')}
                    </Text>
                    <View style={[styles.segmentedControl, { borderColor: theme.colors.border.main }]}>
                        {TARGET_GENDERS.map(gender => (
                            <TouchableOpacity
                                key={gender}
                                style={[
                                    styles.segment,
                                    targetGender === gender && { backgroundColor: theme.colors.success.main },
                                ]}
                                onPress={() => onTargetGenderChange(gender)}
                            >
                                <Text
                                    style={[
                                        styles.segmentText,
                                        { color: theme.colors.text.primary },
                                        targetGender === gender && { color: theme.colors.text.inverse },
                                    ]}
                                >
                                    {t(`createSoloQuest.targetGender.${gender}`)}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    {/* Age range */}
                    <Text style={[styles.label, { color: theme.colors.text.secondary }]}>
                        {t('soloQuest.form.ageRangeLabel')}
                    </Text>
                    <View style={styles.ageRow}>
                        <TextInput
                            style={[styles.ageInput, {
                                borderColor: theme.colors.border.main,
                                color: theme.colors.text.primary,
                                backgroundColor: theme.colors.background.primary,
                            }]}
                            value={targetAgeMin}
                            onChangeText={onTargetAgeMinChange}
                            placeholder={t('soloQuest.form.agePlaceholderMin')}
                            placeholderTextColor={theme.colors.text.disabled}
                            keyboardType="numeric"
                            maxLength={3}
                        />
                        <Text style={[styles.ageSeparator, { color: theme.colors.text.secondary }]}>–</Text>
                        <TextInput
                            style={[styles.ageInput, {
                                borderColor: theme.colors.border.main,
                                color: theme.colors.text.primary,
                                backgroundColor: theme.colors.background.primary,
                            }]}
                            value={targetAgeMax}
                            onChangeText={onTargetAgeMaxChange}
                            placeholder={t('soloQuest.form.agePlaceholderMax')}
                            placeholderTextColor={theme.colors.text.disabled}
                            keyboardType="numeric"
                            maxLength={3}
                        />
                    </View>

                    {/* Relationship status */}
                    <Text style={[styles.label, { color: theme.colors.text.secondary }]}>
                        {t('createSoloQuest.relationshipStatusLabel')}
                    </Text>
                    <View style={styles.statusRow}>
                        {RELATIONSHIP_STATUSES.map(status => (
                            <TouchableOpacity
                                key={status || 'ANY'}
                                style={[
                                    styles.statusChip,
                                    { borderColor: theme.colors.border.main },
                                    targetRelationshipStatus === status && {
                                        backgroundColor: theme.colors.success.main,
                                        borderColor: theme.colors.success.main,
                                    },
                                ]}
                                onPress={() => onTargetRelationshipStatusChange(status as RelationshipStatus | '')}
                            >
                                <Text
                                    style={[
                                        styles.statusChipText,
                                        { color: theme.colors.text.primary },
                                        targetRelationshipStatus === status && { color: theme.colors.text.inverse },
                                    ]}
                                >
                                    {status
                                        ? t(`editProfileDetails.relationshipStatus.${status}`)
                                        : t('createSoloQuest.relationshipStatusAny')}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    {/* Required interests */}
                    <Text style={[styles.label, { color: theme.colors.text.secondary }]}>
                        {t('soloQuest.form.interestsLabel')}
                    </Text>
                    <InterestTagInput
                        tags={requiredInterests}
                        onTagsChange={onRequiredInterestsChange}
                        maxTags={10}
                        placeholder={t('soloQuest.form.interestsPlaceholder')}
                    />

                    {/* Max distance */}
                    <Text style={[styles.label, { color: theme.colors.text.secondary }]}>
                        {t('soloQuest.form.maxDistanceLabel')}
                    </Text>
                    <View style={styles.distanceRow}>
                        {DISTANCE_OPTIONS.map(d => (
                            <TouchableOpacity
                                key={d}
                                style={[
                                    styles.distanceChip,
                                    { borderColor: theme.colors.border.main },
                                    String(d) === maxDistanceKm && {
                                        backgroundColor: theme.colors.success.main,
                                        borderColor: theme.colors.success.main,
                                    },
                                ]}
                                onPress={() => onMaxDistanceKmChange(String(d))}
                            >
                                <Text
                                    style={[
                                        styles.distanceChipText,
                                        { color: theme.colors.text.primary },
                                        String(d) === maxDistanceKm && { color: theme.colors.text.inverse },
                                    ]}
                                >
                                    {d} {t('soloQuestFeed.distanceUnit')}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>
            )}
        </View>
    );
};

const themeStyles = createStyles(theme => ({
    container: {
        borderWidth: 1,
        borderRadius: theme.layout.borderRadius.md,
        overflow: 'hidden' as const,
        marginBottom: theme.spacing.md,
    },
    header: {
        flexDirection: 'row' as const,
        alignItems: 'center' as const,
        justifyContent: 'space-between' as const,
        paddingHorizontal: theme.spacing.md,
        paddingVertical: theme.spacing.md,
    },
    sectionTitle: {
        ...theme.typography.body.large,
        fontWeight: theme.typography.fontWeight.semibold,
    },
    body: {
        paddingHorizontal: theme.spacing.md,
        paddingBottom: theme.spacing.md,
    },
    label: {
        ...theme.typography.body.small,
        fontWeight: theme.typography.fontWeight.medium,
        textTransform: 'uppercase' as const,
        letterSpacing: 0.5,
        marginBottom: theme.spacing.xs,
        marginTop: theme.spacing.md,
    },
    segmentedControl: {
        flexDirection: 'row' as const,
        borderWidth: 1,
        borderRadius: theme.layout.borderRadius.md,
        overflow: 'hidden' as const,
    },
    segment: {
        flex: 1,
        paddingVertical: theme.spacing.sm,
        alignItems: 'center' as const,
    },
    segmentText: {
        ...theme.typography.body.small,
        fontWeight: theme.typography.fontWeight.medium,
    },
    ageRow: {
        flexDirection: 'row' as const,
        alignItems: 'center' as const,
        gap: theme.spacing.sm,
    },
    ageInput: {
        flex: 1,
        borderWidth: 1,
        borderRadius: theme.layout.borderRadius.sm,
        paddingHorizontal: theme.spacing.sm,
        paddingVertical: theme.spacing.sm,
        ...theme.typography.body.medium,
        textAlign: 'center' as const,
    },
    ageSeparator: {
        ...theme.typography.body.large,
    },
    statusRow: {
        flexDirection: 'row' as const,
        flexWrap: 'wrap' as const,
        gap: theme.spacing.xs,
    },
    statusChip: {
        paddingHorizontal: theme.spacing.sm,
        paddingVertical: theme.spacing.xs,
        borderRadius: theme.layout.borderRadius.xl,
        borderWidth: 1,
    },
    statusChipText: {
        ...theme.typography.caption,
        fontWeight: theme.typography.fontWeight.medium,
    },
    distanceRow: {
        flexDirection: 'row' as const,
        flexWrap: 'wrap' as const,
        gap: theme.spacing.xs,
    },
    distanceChip: {
        paddingHorizontal: theme.spacing.md,
        paddingVertical: theme.spacing.xs,
        borderRadius: theme.layout.borderRadius.xl,
        borderWidth: 1,
    },
    distanceChipText: {
        ...theme.typography.body.small,
        fontWeight: theme.typography.fontWeight.medium,
    },
}));

export default AudienceFilterSection;
