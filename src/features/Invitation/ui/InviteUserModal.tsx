import React, { useState } from 'react';
import { Modal, View, Text, TextInput, ScrollView, Alert } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Button, ButtonVariant } from '../../../shared/ui/Button/Button';
import { Input } from '../../../shared/ui/Input/Input';
import { StakeSelector } from '../../Wager/ui/StakeSelector';
import { StakeType, CurrencyType } from '../../../entities/WagerState/model/types';
import { CreateQuestInvitationRequest } from '../../../entities/InvitationState/model/types';
import { useCanInviteUserQuery } from '../../../entities/InvitationState/model/slice/invitationApi';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useAppStyles } from '../../../shared/ui/hooks/useAppStyles';
import { createStyles } from '../../../shared/ui/theme/createStyles';

interface InviteUserModalProps {
    visible: boolean;
    questId: number;
    questTitle: string;
    onSuccess: (request: CreateQuestInvitationRequest) => void;
    onClose: () => void;
    isLoading?: boolean;
}

export const InviteUserModal: React.FC<InviteUserModalProps> = ({ 
    visible, 
    questId, 
    questTitle, 
    onSuccess, 
    onClose, 
    isLoading 
}) => {
    const { t } = useTranslation();
    const { theme } = useAppStyles();
    const styles = themeStyles;
    const [targetUserId, setTargetUserId] = useState('');
    const [stakeType, setStakeType] = useState<StakeType>('POINTS');
    const [amount, setAmount] = useState('100');
    const [screenTime, setScreenTime] = useState('30');
    const [socialPenalty, setSocialPenalty] = useState('');
    const [message, setMessage] = useState('');
    const [expirationDate, setExpirationDate] = useState(new Date(Date.now() + 24 * 60 * 60 * 1000));
    const [showDatePicker, setShowDatePicker] = useState(false);

    const { data: inviteCheck, isFetching: isChecking } = useCanInviteUserQuery(
        targetUserId ? parseInt(targetUserId) : 0, 
        { skip: !targetUserId || targetUserId.length < 1 }
    );

    const handleSubmit = () => {
        if (!targetUserId) {
            Alert.alert(t('invitation.modal.errorTitle'), t('invitation.modal.errorUserId'));
            return;
        }

        if (inviteCheck && !inviteCheck.canInvite) {
            Alert.alert(t('invitation.modal.errorTitle'), t('invitation.modal.errorCannotInvite'));
            return;
        }

        const isStakeRequired = stakeType !== 'SOCIAL_QUEST';
        if (isStakeRequired && !amount && stakeType !== 'SCREEN_TIME') {
            Alert.alert(t('invitation.modal.errorTitle'), t('invitation.modal.errorStake'));
            return;
        }

        const request: CreateQuestInvitationRequest = {
            questId,
            inviteeId: parseInt(targetUserId),
            stakeType,
            stakeAmount: 0,
            message,
            expiresAt: expirationDate.toISOString(),
        };

        if (stakeType === 'POINTS' || stakeType === 'MONEY') {
            request.stakeAmount = parseFloat(amount) || 0;
            if (stakeType === 'MONEY') request.stakeCurrency = 'USD' as CurrencyType;
        } else if (stakeType === 'SCREEN_TIME') {
            request.stakeAmount = parseInt(screenTime) || 0;
            request.screenTimeMinutes = parseInt(screenTime) || 0;
        } else if (stakeType === 'SOCIAL_QUEST') {
            request.stakeAmount = 0;
            request.socialPenaltyDescription = socialPenalty;
        }
        
        onSuccess(request);
    };

    return (
        <Modal visible={visible} animationType="slide" transparent>
            <View style={styles.overlay}>
                <View style={styles.container}>
                    <Text style={styles.title}>{t('invitation.modal.title', { title: questTitle })}</Text>
                    
                    <ScrollView contentContainerStyle={styles.scrollContent}>
                        <Input
                            label={t('invitation.modal.userIdLabel')}
                            value={targetUserId}
                            onChangeText={setTargetUserId}
                            keyboardType="numeric"
                            placeholder={t('invitation.modal.userIdPlaceholder')}
                            helperText={isChecking ? t('invitation.modal.checkingPrivacy') : undefined}
                            errorText={!isChecking && inviteCheck && !inviteCheck.canInvite ? t('invitation.modal.cannotInvite') : undefined}
                            error={!!(!isChecking && inviteCheck && !inviteCheck.canInvite)}
                        />

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
                                label={t('invitation.modal.minutesLabel')}
                                value={screenTime}
                                onChangeText={setScreenTime}
                                keyboardType="numeric"
                                placeholder={t('invitation.modal.minutesPlaceholder')}
                            />
                        )}

                        {stakeType === 'SOCIAL_QUEST' && (
                            <Input
                                label={t('invitation.modal.penaltyLabel')}
                                value={socialPenalty}
                                onChangeText={setSocialPenalty}
                                multiline
                                numberOfLines={3}
                                placeholder={t('invitation.modal.penaltyPlaceholder')}
                            />
                        )}

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>{t('invitation.modal.expiresAtLabel')}</Text>
                            <Button 
                                variant={ButtonVariant.OUTLINE} 
                                onPress={() => setShowDatePicker(true)}
                            >
                                {expirationDate.toLocaleString()}
                            </Button>
                            {showDatePicker && (
                                <DateTimePicker
                                    value={expirationDate}
                                    mode="datetime"
                                    display="default"
                                    onChange={(event, date) => {
                                        setShowDatePicker(false);
                                        if (date) setExpirationDate(date);
                                    }}
                                    minimumDate={new Date()}
                                />
                            )}
                        </View>

                        <Input
                            label={t('invitation.modal.messageLabel')}
                            value={message}
                            onChangeText={setMessage}
                            multiline
                            numberOfLines={3}
                            placeholder={t('invitation.modal.messagePlaceholder')}
                        />
                    </ScrollView>

                    <View style={styles.actions}>
                        <Button variant={ButtonVariant.GHOST} onPress={onClose} style={styles.button}>
                            {t('invitation.modal.cancelButton')}
                        </Button>
                        <Button 
                            onPress={handleSubmit} 
                            loading={isLoading} 
                            style={styles.button} 
                            disabled={!targetUserId || (inviteCheck && !inviteCheck.canInvite)}
                        >
                            {t('invitation.modal.sendButton')}
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
        borderRadius: theme.layout.borderRadius.lg,
        padding: theme.spacing.lg,
        maxHeight: '90%',
        backgroundColor: theme.colors.background.paper,
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
    helper: {
        fontSize: theme.typography.fontSize.xs,
        marginTop: theme.spacing.xs / 2,
        color: theme.colors.text.disabled,
        fontStyle: 'italic',
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
    }
}));
