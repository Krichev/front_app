import React, { useState } from 'react';
import { View, Text, ScrollView } from 'react-native';
import { useTranslation } from 'react-i18next';
import { StakeType, CreateWagerRequest } from '../../../entities/WagerState/model/types';
import { StakeSelector } from './StakeSelector';
import { Input } from '../../../shared/ui/Input/Input';
import { Button } from '../../../shared/ui/Button/Button';
import { useAppStyles } from '../../../shared/ui/hooks/useAppStyles';
import { createStyles } from '../../../shared/ui/theme/createStyles';

interface WagerSetupBottomSheetProps {
    initialData?: Partial<CreateWagerRequest>;
    onSave: (data: Partial<CreateWagerRequest>) => void;
}

export const WagerSetupBottomSheet: React.FC<WagerSetupBottomSheetProps> = ({
    initialData,
    onSave,
}) => {
    const { t } = useTranslation();
    const { theme } = useAppStyles();
    const styles = themeStyles;
    const [stakeType, setStakeType] = useState<StakeType>(initialData?.stakeType || 'POINTS');
    const [amount, setAmount] = useState(initialData?.stakeAmount?.toString() || '100');
    const [socialPenalty, setSocialPenalty] = useState(initialData?.socialPenaltyDescription || '');
    const [screenTime, setScreenTime] = useState(initialData?.screenTimeMinutes?.toString() || '30');

    const handleSave = () => {
        const data: Partial<CreateWagerRequest> = {
            wagerType: 'HEAD_TO_HEAD',
            stakeType,
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        };

        if (stakeType === 'POINTS' || stakeType === 'MONEY') {
            data.stakeAmount = parseFloat(amount) || 0;
        } else if (stakeType === 'SCREEN_TIME') {
            data.stakeAmount = parseInt(screenTime) || 0;
            data.screenTimeMinutes = parseInt(screenTime) || 0;
        } else if (stakeType === 'SOCIAL_QUEST') {
            data.stakeAmount = 0;
            data.socialPenaltyDescription = socialPenalty;
        }

        onSave(data);
    };

    return (
        <ScrollView style={styles.container}>
            <Text style={styles.title}>{t('wager.setup.title')}</Text>
            
            <StakeSelector selectedType={stakeType} onSelect={setStakeType} />

            {stakeType === 'POINTS' && (
                <Input
                    label={t('wager.setup.pointsAmount')}
                    value={amount}
                    onChangeText={setAmount}
                    keyboardType="numeric"
                    placeholder={t('wager.setup.pointsAmountPlaceholder')}
                />
            )}

            {stakeType === 'MONEY' && (
                <Input
                    label={t('wager.setup.moneyAmount')}
                    value={amount}
                    onChangeText={setAmount}
                    keyboardType="decimal-pad"
                    placeholder={t('wager.setup.moneyAmountPlaceholder')}
                />
            )}

            {stakeType === 'SCREEN_TIME' && (
                <Input
                    label={t('wager.setup.screenTime')}
                    value={screenTime}
                    onChangeText={setScreenTime}
                    keyboardType="numeric"
                    placeholder={t('wager.setup.screenTimePlaceholder')}
                />
            )}

            {stakeType === 'SOCIAL_QUEST' && (
                <Input
                    label={t('wager.setup.socialPenalty')}
                    value={socialPenalty}
                    onChangeText={setSocialPenalty}
                    multiline
                    numberOfLines={3}
                    placeholder={t('wager.setup.socialPenaltyPlaceholder')}
                />
            )}

            <View style={styles.footer}>
                <Button 
                    onPress={handleSave} 
                    fullWidth
                >
                    {t('wager.setup.confirmButton')}
                </Button>
            </View>
        </ScrollView>
    );
};

const themeStyles = createStyles(theme => ({
    container: {
        padding: theme.spacing.md,
        backgroundColor: theme.colors.background.primary,
        borderTopLeftRadius: theme.layout.borderRadius.lg,
        borderTopRightRadius: theme.layout.borderRadius.lg,
    },
    title: {
        fontSize: theme.typography.fontSize.xl,
        fontWeight: theme.typography.fontWeight.bold,
        marginBottom: theme.spacing.md,
        textAlign: 'center',
        color: theme.colors.text.primary,
    },
    footer: {
        marginTop: theme.spacing.lg,
        marginBottom: theme.spacing.xl * 2,
    },
}));
