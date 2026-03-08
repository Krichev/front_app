// src/screens/components/AnswerModeSelector.tsx
import React from 'react';
import {Text, TouchableOpacity, View} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import {useAppStyles} from '../../shared/ui/hooks/useAppStyles';
import {createStyles} from '../../shared/ui/theme';
import {useTranslation} from 'react-i18next';

export type AnswerInputMode = 'TAP' | 'AUDIO' | 'BOTH';

interface AnswerModeSelectorProps {
    selectedMode: AnswerInputMode;
    onChange: (mode: AnswerInputMode) => void;
    disabled?: boolean;
}

const AnswerModeSelector: React.FC<AnswerModeSelectorProps> = ({
    selectedMode,
    onChange,
    disabled = false,
}) => {
    const {t} = useTranslation();
    const {theme} = useAppStyles();
    const styles = themeStyles;

    const modes: {mode: AnswerInputMode; icon: string; label: string; description: string}[] = [
        {
            mode: 'TAP',
            icon: 'gesture-tap',
            label: t('audioQuestion.answerMode.tap'),
            description: t('audioQuestion.answerMode.tapDescription'),
        },
        {
            mode: 'AUDIO',
            icon: 'microphone',
            label: t('audioQuestion.answerMode.audio'),
            description: t('audioQuestion.answerMode.audioDescription'),
        },
        {
            mode: 'BOTH',
            icon: 'swap-horizontal',
            label: t('audioQuestion.answerMode.both'),
            description: t('audioQuestion.answerMode.bothDescription'),
        },
    ];

    return (
        <View style={styles.container}>
            <Text style={styles.title}>{t('audioQuestion.answerMode.title')}</Text>
            <View style={styles.pillsContainer}>
                {modes.map(item => {
                    const isActive = selectedMode === item.mode;
                    return (
                        <TouchableOpacity
                            key={item.mode}
                            style={[
                                styles.pill,
                                isActive && styles.activePill,
                                disabled && styles.disabledPill,
                            ]}
                            onPress={() => !disabled && onChange(item.mode)}
                            disabled={disabled}
                        >
                            <MaterialCommunityIcons
                                name={item.icon}
                                size={20}
                                color={isActive ? theme.colors.text.inverse : theme.colors.text.secondary}
                            />
                            <Text
                                style={[
                                    styles.pillLabel,
                                    isActive && styles.activePillLabel,
                                ]}
                            >
                                {item.label}
                            </Text>
                        </TouchableOpacity>
                    );
                })}
            </View>
            <Text style={styles.description}>
                {modes.find(m => m.mode === selectedMode)?.description}
            </Text>
        </View>
    );
};

const themeStyles = createStyles(theme => ({
    container: {
        marginBottom: theme.spacing.lg,
    },
    title: {
        ...theme.typography.body.medium,
        fontWeight: theme.typography.fontWeight.semibold,
        color: theme.colors.text.primary,
        marginBottom: theme.spacing.sm,
    },
    pillsContainer: {
        flexDirection: 'row',
        backgroundColor: theme.colors.background.secondary,
        borderRadius: theme.layout.borderRadius.md,
        padding: 4,
        gap: 4,
    },
    pill: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: theme.spacing.sm,
        borderRadius: theme.layout.borderRadius.sm,
        gap: theme.spacing.xs,
    },
    activePill: {
        backgroundColor: theme.colors.primary.main,
        ...theme.shadows.small,
    },
    disabledPill: {
        opacity: 0.5,
    },
    pillLabel: {
        ...theme.typography.caption,
        fontWeight: theme.typography.fontWeight.medium,
        color: theme.colors.text.secondary,
    },
    activePillLabel: {
        color: theme.colors.text.inverse,
        fontWeight: theme.typography.fontWeight.semibold,
    },
    description: {
        ...theme.typography.caption,
        color: theme.colors.text.secondary,
        marginTop: theme.spacing.xs,
        fontStyle: 'italic',
    },
}));

export default AnswerModeSelector;
