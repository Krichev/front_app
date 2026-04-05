// src/screens/CreateSoloQuestScreen/components/DepositPolicySelector.tsx
import React, { useCallback } from 'react';
import { Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { createStyles } from '../../../shared/ui/theme';
import { useAppStyles } from '../../../shared/ui/hooks/useAppStyles';
import { DepositPolicy } from '../../../entities/SoloQuestState/model/types';

const DEPOSIT_POLICIES: DepositPolicy[] = ['NONE', 'APPLICANT_ONLY', 'BOTH_PARTIES'];
const STAKE_TYPES = ['POINTS', 'MONEY', 'SOCIAL'];
const CURRENCIES = ['USD', 'EUR', 'GBP', 'RUB'];

interface DepositPolicySelectorProps {
    depositPolicy: DepositPolicy;
    stakeType: string;
    stakeAmount: string;
    stakeCurrency: string;
    socialPenaltyDescription: string;
    onDepositPolicyChange: (value: DepositPolicy) => void;
    onStakeTypeChange: (value: string) => void;
    onStakeAmountChange: (value: string) => void;
    onStakeCurrencyChange: (value: string) => void;
    onSocialPenaltyChange: (value: string) => void;
}

const DepositPolicySelector: React.FC<DepositPolicySelectorProps> = ({
    depositPolicy,
    stakeType,
    stakeAmount,
    stakeCurrency,
    socialPenaltyDescription,
    onDepositPolicyChange,
    onStakeTypeChange,
    onStakeAmountChange,
    onStakeCurrencyChange,
    onSocialPenaltyChange,
}) => {
    const { t } = useTranslation();
    const { theme } = useAppStyles();
    const styles = themeStyles;

    const handleDepositPolicyChange = useCallback((policy: DepositPolicy) => {
        onDepositPolicyChange(policy);
    }, [onDepositPolicyChange]);

    return (
        <View>
            {/* Deposit Policy segmented control */}
            <Text style={[styles.label, { color: theme.colors.text.secondary }]}>
                {t('soloQuest.form.depositPolicyLabel')}
            </Text>
            <View style={[styles.segmentedControl, { borderColor: theme.colors.border.main }]}>
                {DEPOSIT_POLICIES.map(policy => (
                    <TouchableOpacity
                        key={policy}
                        style={[
                            styles.segment,
                            depositPolicy === policy && { backgroundColor: theme.colors.success.main },
                        ]}
                        onPress={() => handleDepositPolicyChange(policy)}
                    >
                        <Text
                            style={[
                                styles.segmentText,
                                { color: theme.colors.text.primary },
                                depositPolicy === policy && { color: theme.colors.text.inverse },
                            ]}
                            numberOfLines={1}
                        >
                            {t(`soloQuest.depositPolicy.${policy}`)}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            {/* Stake fields (visible when policy !== NONE) */}
            {depositPolicy !== 'NONE' && (
                <View style={styles.stakeContainer}>
                    {/* Stake type */}
                    <Text style={[styles.label, { color: theme.colors.text.secondary }]}>
                        {t('soloQuest.form.stakeTypeLabel')}
                    </Text>
                    <View style={[styles.segmentedControl, { borderColor: theme.colors.border.main }]}>
                        {STAKE_TYPES.map(type => (
                            <TouchableOpacity
                                key={type}
                                style={[
                                    styles.segment,
                                    stakeType === type && { backgroundColor: theme.colors.success.main },
                                ]}
                                onPress={() => onStakeTypeChange(type)}
                            >
                                <Text
                                    style={[
                                        styles.segmentText,
                                        { color: theme.colors.text.primary },
                                        stakeType === type && { color: theme.colors.text.inverse },
                                    ]}
                                >
                                    {t(`createSoloQuest.stakeType.${type}`)}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    {/* Stake amount */}
                    <Text style={[styles.label, { color: theme.colors.text.secondary }]}>
                        {t('soloQuest.form.stakeAmountLabel')}
                    </Text>
                    <TextInput
                        style={[styles.input, {
                            borderColor: theme.colors.border.main,
                            color: theme.colors.text.primary,
                            backgroundColor: theme.colors.background.primary,
                        }]}
                        value={stakeAmount}
                        onChangeText={onStakeAmountChange}
                        keyboardType="numeric"
                        placeholder="0"
                        placeholderTextColor={theme.colors.text.disabled}
                    />

                    {/* Currency picker (only for MONEY) */}
                    {stakeType === 'MONEY' && (
                        <>
                            <Text style={[styles.label, { color: theme.colors.text.secondary }]}>
                                {t('soloQuest.form.stakeCurrencyLabel')}
                            </Text>
                            <View style={styles.currencyRow}>
                                {CURRENCIES.map(currency => (
                                    <TouchableOpacity
                                        key={currency}
                                        style={[
                                            styles.currencyChip,
                                            { borderColor: theme.colors.border.main },
                                            stakeCurrency === currency && {
                                                backgroundColor: theme.colors.success.main,
                                                borderColor: theme.colors.success.main,
                                            },
                                        ]}
                                        onPress={() => onStakeCurrencyChange(currency)}
                                    >
                                        <Text
                                            style={[
                                                styles.currencyText,
                                                { color: theme.colors.text.primary },
                                                stakeCurrency === currency && { color: theme.colors.text.inverse },
                                            ]}
                                        >
                                            {currency}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </>
                    )}
                </View>
            )}

            {/* Social penalty description */}
            <Text style={[styles.label, { color: theme.colors.text.secondary }]}>
                {t('soloQuest.form.socialPenaltyLabel')}
            </Text>
            <TextInput
                style={[styles.input, styles.multilineInput, {
                    borderColor: theme.colors.border.main,
                    color: theme.colors.text.primary,
                    backgroundColor: theme.colors.background.primary,
                }]}
                value={socialPenaltyDescription}
                onChangeText={onSocialPenaltyChange}
                placeholder={t('soloQuest.form.socialPenaltyPlaceholder')}
                placeholderTextColor={theme.colors.text.disabled}
                multiline
                maxLength={500}
            />
        </View>
    );
};

const themeStyles = createStyles(theme => ({
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
        justifyContent: 'center' as const,
    },
    segmentText: {
        ...theme.typography.body.small,
        fontWeight: theme.typography.fontWeight.medium,
        textAlign: 'center' as const,
    },
    stakeContainer: {
        marginTop: theme.spacing.xs,
    },
    input: {
        borderWidth: 1,
        borderRadius: theme.layout.borderRadius.sm,
        paddingHorizontal: theme.spacing.sm,
        paddingVertical: theme.spacing.sm,
        ...theme.typography.body.medium,
    },
    multilineInput: {
        minHeight: 72,
        textAlignVertical: 'top' as const,
    },
    currencyRow: {
        flexDirection: 'row' as const,
        gap: theme.spacing.xs,
        flexWrap: 'wrap' as const,
    },
    currencyChip: {
        paddingHorizontal: theme.spacing.md,
        paddingVertical: theme.spacing.xs,
        borderRadius: theme.layout.borderRadius.xl,
        borderWidth: 1,
    },
    currencyText: {
        ...theme.typography.body.small,
        fontWeight: theme.typography.fontWeight.medium,
    },
}));

export default DepositPolicySelector;
