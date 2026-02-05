import React, { useState } from 'react';
import { Modal, View, Text, StyleSheet, TextInput, ScrollView, Alert } from 'react-native';
import { useTheme } from '../../../shared/ui/theme';
import { Button, ButtonVariant } from '../../../shared/ui/Button/Button';
import { StakeSelector } from '../../Wager/ui/StakeSelector';
import { StakeType, CurrencyType } from '../../../entities/WagerState/model/types';
import { CreateCounterOfferRequest, QuestInvitationDTO } from '../../../entities/InvitationState/model/types';

interface CounterOfferModalProps {
    visible: boolean;
    invitation: QuestInvitationDTO;
    onSubmit: (request: CreateCounterOfferRequest) => void;
    onClose: () => void;
    isLoading?: boolean;
}

export const CounterOfferModal: React.FC<CounterOfferModalProps> = ({ visible, invitation, onSubmit, onClose, isLoading }) => {
    const { theme } = useTheme();
    const [stakeType, setStakeType] = useState<StakeType>(invitation.stakeType);
    const [stakeAmount, setStakeAmount] = useState<string>(invitation.stakeAmount.toString());
    const [screenTime, setScreenTime] = useState<string>(invitation.screenTimeMinutes?.toString() || '');
    const [socialPenalty, setSocialPenalty] = useState<string>(invitation.socialPenaltyDescription || '');
    const [message, setMessage] = useState('');

    const handleSubmit = () => {
        if (!stakeAmount && stakeType !== 'SOCIAL_QUEST') {
            Alert.alert('Error', 'Please enter a stake amount');
            return;
        }

        const request: CreateCounterOfferRequest = {
            stakeType,
            stakeAmount: parseFloat(stakeAmount) || 0,
            stakeCurrency: stakeType === 'MONEY' ? 'USD' as CurrencyType : undefined, // Default USD for now
            screenTimeMinutes: stakeType === 'SCREEN_TIME' ? parseInt(screenTime) : undefined,
            socialPenaltyDescription: stakeType === 'SOCIAL_QUEST' ? socialPenalty : undefined,
            message,
        };
        
        onSubmit(request);
    };

    return (
        <Modal visible={visible} animationType="slide" transparent>
            <View style={styles.overlay}>
                <View style={[styles.container, { backgroundColor: theme.colors.background.paper }]}>
                    <Text style={[styles.title, { color: theme.colors.text.primary }]}>Propose Counter Offer</Text>
                    
                    <ScrollView contentContainerStyle={styles.scrollContent}>
                        <StakeSelector selectedType={stakeType} onSelect={setStakeType} />

                        {stakeType === 'SCREEN_TIME' ? (
                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Minutes</Text>
                                <TextInput
                                    style={[styles.input, { borderColor: theme.colors.border.main, color: theme.colors.text.primary }]}
                                    value={screenTime}
                                    onChangeText={setScreenTime}
                                    keyboardType="numeric"
                                    placeholder="e.g. 30"
                                    placeholderTextColor={theme.colors.text.disabled}
                                />
                            </View>
                        ) : stakeType === 'SOCIAL_QUEST' ? (
                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Penalty Description</Text>
                                <TextInput
                                    style={[styles.input, styles.textArea, { borderColor: theme.colors.border.main, color: theme.colors.text.primary }]}
                                    value={socialPenalty}
                                    onChangeText={setSocialPenalty}
                                    multiline
                                    placeholder="What must the loser do?"
                                    placeholderTextColor={theme.colors.text.disabled}
                                />
                            </View>
                        ) : (
                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Amount</Text>
                                <TextInput
                                    style={[styles.input, { borderColor: theme.colors.border.main, color: theme.colors.text.primary }]}
                                    value={stakeAmount}
                                    onChangeText={setStakeAmount}
                                    keyboardType="numeric"
                                    placeholder="0"
                                    placeholderTextColor={theme.colors.text.disabled}
                                />
                            </View>
                        )}

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Message (Optional)</Text>
                            <TextInput
                                style={[styles.input, styles.textArea, { borderColor: theme.colors.border.main, color: theme.colors.text.primary }]}
                                value={message}
                                onChangeText={setMessage}
                                multiline
                                placeholder="Add a note..."
                                placeholderTextColor={theme.colors.text.disabled}
                            />
                        </View>
                    </ScrollView>

                    <View style={styles.actions}>
                        <Button variant={ButtonVariant.GHOST} onPress={onClose} style={styles.button}>Cancel</Button>
                        <Button onPress={handleSubmit} loading={isLoading} style={styles.button}>Submit Proposal</Button>
                    </View>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        padding: 20,
    },
    container: {
        borderRadius: 16,
        padding: 20,
        maxHeight: '80%',
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 16,
        textAlign: 'center',
    },
    scrollContent: {
        paddingBottom: 20,
    },
    inputGroup: {
        marginBottom: 16,
    },
    label: {
        fontSize: 14,
        marginBottom: 8,
        fontWeight: '600',
        color: '#666',
    },
    input: {
        borderWidth: 1,
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
    },
    textArea: {
        height: 80,
        textAlignVertical: 'top',
    },
    actions: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 10,
    },
    button: {
        flex: 1,
    }
});
