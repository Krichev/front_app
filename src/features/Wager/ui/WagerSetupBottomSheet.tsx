import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useTranslation } from 'react-i18next';
import { StakeType, CreateWagerRequest } from '../../../entities/WagerState/model/types';
import { useTheme } from '../../../shared/ui/theme';
import { StakeSelector } from './StakeSelector';
import { Input } from '../../../shared/ui/Input/Input';
import { Button } from '../../../shared/ui/Button/Button';
import { useCreateWagerMutation } from '../../../entities/WagerState/model/slice/wagerApi';

interface WagerSetupBottomSheetProps {
    initialData?: Partial<CreateWagerRequest>;
    onSave: (data: Partial<CreateWagerRequest>) => void;
}

export const WagerSetupBottomSheet: React.FC<WagerSetupBottomSheetProps> = ({
    initialData,
    onSave,
}) => {
    const { t } = useTranslation();
    const { theme } = useTheme();
    const [stakeType, setStakeType] = useState<StakeType>(initialData?.stakeType || 'POINTS');
    const [amount, setAmount] = useState(initialData?.stakeAmount?.toString() || '100');
    const [socialPenalty, setSocialPenalty] = useState(initialData?.socialPenaltyDescription || '');
    const [screenTime, setScreenTime] = useState(initialData?.screenTimeMinutes?.toString() || '30');

    const handleSave = () => {
        const data: Partial<CreateWagerRequest> = {
            wagerType: 'HEAD_TO_HEAD',
            stakeType,
            stakeAmount: parseFloat(amount),
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        };

        if (stakeType === 'SOCIAL_QUEST') {
            data.socialPenaltyDescription = socialPenalty;
        }

        if (stakeType === 'SCREEN_TIME') {
            data.screenTimeMinutes = parseInt(screenTime);
        }

        onSave(data);
    };

    return (
        <ScrollView style={[styles.container, { backgroundColor: theme.colors.background.primary }]}>
            <Text style={[styles.title, { color: theme.colors.text.primary }]}>{t('wager.setup.title')}</Text>
            
            <StakeSelector selectedType={stakeType} onSelect={setStakeType} />

            <Input
                label={t('wager.setup.stakeAmount')}
                value={amount}
                onChangeText={setAmount}
                keyboardType="numeric"
                placeholder={t('wager.setup.stakeAmountPlaceholder')}
            />

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

const styles = StyleSheet.create({
    container: {
        padding: 16,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 16,
        textAlign: 'center',
    },
    footer: {
        marginTop: 24,
        marginBottom: 40,
    },
});
