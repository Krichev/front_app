import React, { useState } from 'react';
import { Modal, View, Text, StyleSheet, TextInput, ScrollView, Alert, Platform } from 'react-native';
import { useTheme } from '../../../shared/ui/theme';
import { Button, ButtonVariant } from '../../../shared/ui/Button/Button';
import { StakeSelector } from '../../Wager/ui/StakeSelector';
import { StakeType, CurrencyType } from '../../../entities/WagerState/model/types';
import { CreateQuestInvitationRequest } from '../../../entities/InvitationState/model/types';
import { useCanInviteUserQuery } from '../../../entities/InvitationState/model/slice/invitationApi';
import DateTimePicker from '@react-native-community/datetimepicker';

interface InviteUserModalProps {
    visible: boolean;
    questId: number;
    questTitle: string;
    onSuccess: (request: CreateQuestInvitationRequest) => void;
    onClose: () => void;
    isLoading?: boolean;
}

export const InviteUserModal: React.FC<InviteUserModalProps> = ({ visible, questId, questTitle, onSuccess, onClose, isLoading }) => {
    const { theme } = useTheme();
    const [targetUserId, setTargetUserId] = useState('');
    const [stakeType, setStakeType] = useState<StakeType>('POINTS');
    const [stakeAmount, setStakeAmount] = useState('');
    const [screenTime, setScreenTime] = useState('');
    const [socialPenalty, setSocialPenalty] = useState('');
    const [message, setMessage] = useState('');
    const [expirationDate, setExpirationDate] = useState(new Date(Date.now() + 24 * 60 * 60 * 1000)); // +1 day
    const [showDatePicker, setShowDatePicker] = useState(false);

    // Can invite check
    const { data: inviteCheck, isFetching: isChecking } = useCanInviteUserQuery(
        targetUserId ? parseInt(targetUserId) : 0, 
        { skip: !targetUserId || targetUserId.length < 1 }
    );

    const handleSubmit = () => {
        if (!targetUserId) {
            Alert.alert('Error', 'Please enter a user ID');
            return;
        }

        if (inviteCheck && !inviteCheck.canInvite) {
            Alert.alert('Error', 'This user does not accept invitations from you.');
            return;
        }

        if (!stakeAmount && stakeType !== 'SOCIAL_QUEST') {
            Alert.alert('Error', 'Please enter a stake amount');
            return;
        }

        const request: CreateQuestInvitationRequest = {
            questId,
            inviteeId: parseInt(targetUserId),
            stakeType,
            stakeAmount: parseFloat(stakeAmount) || 0,
            stakeCurrency: stakeType === 'MONEY' ? 'USD' as CurrencyType : undefined,
            screenTimeMinutes: stakeType === 'SCREEN_TIME' ? parseInt(screenTime) : undefined,
            socialPenaltyDescription: stakeType === 'SOCIAL_QUEST' ? socialPenalty : undefined,
            message,
            expiresAt: expirationDate.toISOString(),
        };
        
        onSuccess(request);
    };

    return (
        <Modal visible={visible} animationType="slide" transparent>
            <View style={styles.overlay}>
                <View style={[styles.container, { backgroundColor: theme.colors.background.paper }]}>
                    <Text style={[styles.title, { color: theme.colors.text.primary }]}>Invite to "{questTitle}"</Text>
                    
                    <ScrollView contentContainerStyle={styles.scrollContent}>
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>User ID to Invite</Text>
                            <TextInput
                                style={[styles.input, { borderColor: theme.colors.border.main, color: theme.colors.text.primary }]}
                                value={targetUserId}
                                onChangeText={setTargetUserId}
                                keyboardType="numeric"
                                placeholder="Enter User ID"
                                placeholderTextColor={theme.colors.text.disabled}
                            />
                            {isChecking && <Text style={styles.helper}>Checking privacy...</Text>}
                            {!isChecking && inviteCheck && !inviteCheck.canInvite && (
                                <Text style={[styles.helper, { color: theme.colors.error.main }]}>User cannot be invited.</Text>
                            )}
                        </View>

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
                            <Text style={styles.label}>Expires At</Text>
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
                        <Button onPress={handleSubmit} loading={isLoading} style={styles.button} disabled={!targetUserId || (inviteCheck && !inviteCheck.canInvite)}>Send Invite</Button>
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
        maxHeight: '90%',
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
    helper: {
        fontSize: 12,
        marginTop: 4,
        color: '#888',
        fontStyle: 'italic',
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
