// src/screens/components/ReplaySettingsSection.tsx
import React from 'react';
import {Text, TouchableOpacity, View, Switch} from 'react-native';
import {useAppStyles} from '../../shared/ui/hooks/useAppStyles';
import {createStyles} from '../../shared/ui/theme';
import {useTranslation} from 'react-i18next';

interface ReplaySettingsSectionProps {
    allowReplay: boolean;
    maxReplays: number;
    onAllowReplayChange: (v: boolean) => void;
    onMaxReplaysChange: (v: number) => void;
    disabled?: boolean;
}

const ReplaySettingsSection: React.FC<ReplaySettingsSectionProps> = ({
    allowReplay,
    maxReplays,
    onAllowReplayChange,
    onMaxReplaysChange,
    disabled = false,
}) => {
    const {t} = useTranslation();
    const {theme} = useAppStyles();
    const styles = themeStyles;

    const presets = [1, 2, 3, 5, 0]; // 0 = unlimited

    return (
        <View style={styles.container}>
            <View style={styles.headerRow}>
                <View style={styles.titleContainer}>
                    <Text style={styles.title}>{t('audioQuestion.replay.title')}</Text>
                    <Text style={styles.description}>{t('audioQuestion.replay.allowReplayDescription')}</Text>
                </View>
                <Switch
                    value={allowReplay}
                    onValueChange={onAllowReplayChange}
                    disabled={disabled}
                    trackColor={{false: theme.colors.background.secondary, true: theme.colors.primary.light}}
                    thumbColor={allowReplay ? theme.colors.primary.main : theme.colors.text.inverse}
                />
            </View>

            {allowReplay && (
                <View style={styles.replaysContainer}>
                    <Text style={styles.subtitle}>{t('audioQuestion.replay.maxReplays')}</Text>
                    <View style={styles.chipsContainer}>
                        {presets.map(value => {
                            const isActive = maxReplays === value;
                            const label = value === 0 ? '∞' : value.toString();
                            return (
                                <TouchableOpacity
                                    key={value}
                                    style={[
                                        styles.chip,
                                        isActive && styles.activeChip,
                                        disabled && styles.disabledChip,
                                    ]}
                                    onPress={() => !disabled && onMaxReplaysChange(value)}
                                    disabled={disabled}
                                >
                                    <Text
                                        style={[
                                            styles.chipLabel,
                                            isActive && styles.activeChipLabel,
                                        ]}
                                    >
                                        {label}
                                    </Text>
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                    <Text style={styles.summaryText}>
                        {maxReplays === 0 
                            ? t('audioQuestion.replay.unlimited') 
                            : t('audioQuestion.replay.replaysCount', {count: maxReplays})}
                    </Text>
                </View>
            )}
        </View>
    );
};

const themeStyles = createStyles(theme => ({
    container: {
        marginBottom: theme.spacing.lg,
        padding: theme.spacing.md,
        backgroundColor: theme.colors.background.secondary,
        borderRadius: theme.layout.borderRadius.md,
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    titleContainer: {
        flex: 1,
        marginRight: theme.spacing.md,
    },
    title: {
        ...theme.typography.body.medium,
        fontWeight: theme.typography.fontWeight.semibold,
        color: theme.colors.text.primary,
    },
    subtitle: {
        ...theme.typography.caption,
        fontWeight: theme.typography.fontWeight.semibold,
        color: theme.colors.text.secondary,
        marginBottom: theme.spacing.sm,
        marginTop: theme.spacing.md,
        textTransform: 'uppercase',
    },
    description: {
        ...theme.typography.caption,
        color: theme.colors.text.secondary,
        marginTop: 2,
    },
    replaysContainer: {
        marginTop: theme.spacing.sm,
        borderTopWidth: 1,
        borderTopColor: theme.colors.divider,
    },
    chipsContainer: {
        flexDirection: 'row',
        gap: theme.spacing.sm,
        flexWrap: 'wrap',
    },
    chip: {
        paddingHorizontal: theme.spacing.md,
        paddingVertical: theme.spacing.xs,
        borderRadius: theme.layout.borderRadius.full,
        backgroundColor: theme.colors.background.primary,
        borderWidth: 1,
        borderColor: theme.colors.divider,
        minWidth: 44,
        alignItems: 'center',
    },
    activeChip: {
        backgroundColor: theme.colors.primary.main,
        borderColor: theme.colors.primary.main,
    },
    disabledChip: {
        opacity: 0.5,
    },
    chipLabel: {
        ...theme.typography.body.small,
        fontWeight: theme.typography.fontWeight.medium,
        color: theme.colors.text.secondary,
    },
    activeChipLabel: {
        color: theme.colors.text.inverse,
        fontWeight: theme.typography.fontWeight.bold,
    },
    summaryText: {
        ...theme.typography.caption,
        color: theme.colors.primary.main,
        fontWeight: theme.typography.fontWeight.semibold,
        marginTop: theme.spacing.sm,
    },
}));

export default ReplaySettingsSection;
