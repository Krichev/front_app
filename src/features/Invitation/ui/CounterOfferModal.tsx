import React, { useState } from 'react';
import { Modal, View, Text, TextInput, ScrollView } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useAppStyles } from '../../../shared/ui/hooks/useAppStyles';
import { createStyles } from '../../../shared/ui/theme/createStyles';
import { Button, ButtonVariant } from '../../../shared/ui/Button/Button';
import { Input } from '../../../shared/ui/Input/Input';
import { StakeSelector } from '../../Wager/ui/StakeSelector';
import { StakeType } from '../../../entities/WagerState/model/types';
import { CreateCounterOfferRequest } from '../../../entities/InvitationState/model/types';

interface CounterOfferModalProps {
    visible: boolean;
    initialStakeType: StakeType;
    initialAmount: number;
    onSubmit: (data: Partial<CreateCounterOfferRequest>) => void;
    onClose: () => void;
    isLoading?: boolean;
}

export const CounterOfferModal: React.FC<CounterOfferModalProps> = ({
    visible,
    initialStakeType,
    initialAmount,
    onSubmit,
    onClose,
    isLoading,
}) => {
    const { t } = useTranslation();
    const { theme } = useAppStyles();
    const styles = themeStyles;
    const [stakeType, setStakeType] = useState<StakeType>(initialStakeType);
    const [amount, setAmount] = useState(initialAmount.toString());
    const [screenTime, setScreenTime] = useState(initialAmount.toString());
    const [socialPenalty, setSocialPenalty] = useState('');
    const [message, setMessage] = useState('');

    const handleSubmit = () => {
        const data: Partial<CreateCounterOfferRequest> = {
            stakeType,
            message,
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

        onSubmit(data);
    };

    return (
        <Modal visible={visible} animationType="slide" transparent>
            <View style={styles.overlay}>
                <View style={styles.container}>
                    <Text style={styles.title}>{t('wager.setup.counterOffer.title')}</Text>

                    <ScrollView contentContainerStyle={styles.scrollContent}>
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

                        <Input
                            label={t('wager.setup.counterOffer.messageLabel')}
                            value={message}
                            onChangeText={setMessage}
                            multiline
                            numberOfLines={3}
                            placeholder={t('wager.setup.counterOffer.messagePlaceholder')}
                        />
                    </ScrollView>

                    <View style={styles.actions}>
                        <Button variant={ButtonVariant.GHOST} onPress={onClose} style={styles.button}>
                            {t('wager.setup.counterOffer.cancelButton')}
                        </Button>
                        <Button onPress={handleSubmit} loading={isLoading} style={styles.button}>
                            {t('wager.setup.counterOffer.submitButton')}
                        </Button>
                    </View>
                </View>
            </View>
        </Modal>
    );
};

const themeStyles = createStyles(theme => ({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        padding: theme.spacing.md,
    },
    container: {
        backgroundColor: theme.colors.background.paper,
        borderRadius: theme.layout.borderRadius.lg,
        padding: theme.spacing.lg,
        maxHeight: '90%',
    },
    title: {
        fontSize: theme.typography.fontSize.lg,
        fontWeight: theme.typography.fontWeight.bold,
        marginBottom: theme.spacing.md,
        textAlign: 'center',
        color: theme.colors.text.primary,
    },
    scrollContent: {
        paddingBottom: theme.spacing.md,
    },
    inputGroup: {
        marginBottom: theme.spacing.md,
    },
    label: {
        fontSize: theme.typography.fontSize.sm,
        marginBottom: theme.spacing.xs,
        fontWeight: theme.typography.fontWeight.semibold,
        color: theme.colors.text.secondary,
    },
    input: {
        borderWidth: theme.layout.borderWidth.thin,
        borderColor: theme.colors.border.main,
        borderRadius: theme.layout.borderRadius.md,
        padding: theme.spacing.sm,
        fontSize: theme.typography.fontSize.base,
        color: theme.colors.text.primary,
    },
    textArea: {
        height: 80,
        textAlignVertical: 'top',
    },
    actions: {
        flexDirection: 'row',
        gap: theme.spacing.sm,
        marginTop: theme.spacing.sm,
    },
    button: {
        flex: 1,
    },
}));
