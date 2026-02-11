// src/components/CreateChallengeForm/CreateChallengeForm.tsx
import React, {useState} from 'react';
import {Alert, ScrollView, StyleSheet, Switch, Text, TextInput, TouchableOpacity, View,} from 'react-native';
import {Picker} from '@react-native-picker/picker';
import {useSelector} from 'react-redux';
import {useCreateChallengeMutation} from '../../entities/ChallengeState/model/slice/challengeApi';
import {CurrencyType, PaymentType} from '../../entities/ChallengeState/model/types/challenge.types';
import {useTranslation} from 'react-i18next';
import {useAppStyles} from '../../shared/ui/hooks/useAppStyles';
import {RootState} from '../../app/providers/StoreProvider/store';

interface CreateChallengeFormProps {
    navigation: any;
}

export const CreateChallengeForm: React.FC<CreateChallengeFormProps> = ({ navigation }) => {
    const { t } = useTranslation();
    const { theme } = useAppStyles();
    const [createChallenge, { isLoading }] = useCreateChallengeMutation();
    const {user} = useSelector((state: RootState) => state.auth);

    // Basic fields
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [type, setType] = useState('PERSONAL');
    const [visibility, setVisibility] = useState<'PUBLIC' | 'PRIVATE'>('PUBLIC');
    const [frequency, setFrequency] = useState<'DAILY' | 'WEEKLY' | 'ONE_TIME'>('ONE_TIME');

    // Payment fields
    const [paymentType, setPaymentType] = useState<PaymentType>(PaymentType.FREE);
    const [hasEntryFee, setHasEntryFee] = useState(false);
    const [entryFeeAmount, setEntryFeeAmount] = useState('0');
    const [entryFeeCurrency, setEntryFeeCurrency] = useState<CurrencyType>(CurrencyType.USD);
    const [hasPrize, setHasPrize] = useState(false);
    const [prizeAmount, setPrizeAmount] = useState('0');
    const [prizeCurrency, setPrizeCurrency] = useState<CurrencyType>(CurrencyType.USD);

    // Access control fields
    const [requiresApproval, setRequiresApproval] = useState(false);
    const [invitedUserIds, setInvitedUserIds] = useState('');

    const handleSubmit = async () => {
        if (!title.trim()) {
            Alert.alert(t('userQuestions.errorTitle'), t('alerts.validationError'));
            return;
        }

        const challengeData = {
            title: title.trim(),
            description: description.trim(),
            type,
            visibility,
            status: 'ACTIVE' as any,
            frequency,
            paymentType,
            hasEntryFee,
            entryFeeAmount: hasEntryFee ? parseFloat(entryFeeAmount) : undefined,
            entryFeeCurrency: hasEntryFee ? entryFeeCurrency : undefined,
            hasPrize,
            prizeAmount: hasPrize ? parseFloat(prizeAmount) : undefined,
            prizeCurrency: hasPrize ? prizeCurrency : undefined,
            requiresApproval,
            invitedUserIds: visibility === 'PRIVATE' && invitedUserIds
                ? invitedUserIds.split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id))
                : undefined,
            userId: user?.id || '',
        };

        try {
            await createChallenge(challengeData).unwrap();
            Alert.alert(t('userQuestions.successTitle'), t('alerts.createSuccess'), [
                { text: t('common.ok'), onPress: () => navigation.goBack() }
            ]);
        } catch (error) {
            console.error('Failed to create challenge:', error);
            Alert.alert(t('userQuestions.errorTitle'), t('alerts.createError'));
        }
    };

    return (
        <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
            <View style={styles.content}>
                {/* Basic Information Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>{t('createQuest.basicInfo.sectionTitle')}</Text>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>{t('createQuest.basicInfo.title')} *</Text>
                        <TextInput
                            style={styles.input}
                            value={title}
                            onChangeText={setTitle}
                            placeholder={t('createQuest.basicInfo.titlePlaceholder')}
                            placeholderTextColor={theme.colors.text.disabled}
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>{t('createQuest.basicInfo.description')}</Text>
                        <TextInput
                            style={[styles.input, styles.textArea]}
                            value={description}
                            onChangeText={setDescription}
                            placeholder={t('createQuest.basicInfo.descriptionPlaceholder')}
                            placeholderTextColor={theme.colors.text.disabled}
                            multiline
                            numberOfLines={4}
                            textAlignVertical="top"
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>{t('createQuest.quizConfig.gameType')} *</Text>
                        <View style={styles.pickerContainer}>
                            <Picker
                                selectedValue={type}
                                onValueChange={setType}
                                style={styles.picker}
                            >
                                <Picker.Item label="Personal" value="PERSONAL" />
                                <Picker.Item label="Fitness" value="FITNESS" />
                                <Picker.Item label="Learning" value="LEARNING" />
                                <Picker.Item label="Habit" value="HABIT" />
                                <Picker.Item label="Quiz" value="QUIZ" />
                            </Picker>
                        </View>
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>{t('mediaQuestion.visibilityLabel')} *</Text>
                        <View style={styles.pickerContainer}>
                            <Picker
                                selectedValue={visibility}
                                onValueChange={(value) => setVisibility(value as 'PUBLIC' | 'PRIVATE')}
                                style={styles.picker}
                            >
                                <Picker.Item label={`${t('mediaQuestion.public')} - Anyone can find and join`} value="PUBLIC" />
                                <Picker.Item label={`${t('mediaQuestion.private')} - Only invited users`} value="PRIVATE" />
                            </Picker>
                        </View>
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Frequency</Text>
                        <View style={styles.pickerContainer}>
                            <Picker
                                selectedValue={frequency}
                                onValueChange={(value) => setFrequency(value as any)}
                                style={styles.picker}
                            >
                                <Picker.Item label="One Time" value="ONE_TIME" />
                                <Picker.Item label="Daily" value="DAILY" />
                                <Picker.Item label="Weekly" value="WEEKLY" />
                            </Picker>
                        </View>
                    </View>
                </View>

                {/* Payment Options Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>💰 {t('challenge.paymentOptions')}</Text>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>{t('challenge.paymentType')}</Text>
                        <View style={styles.pickerContainer}>
                            <Picker
                                selectedValue={paymentType}
                                onValueChange={(value) => setPaymentType(value as PaymentType)}
                                style={styles.picker}
                            >
                                <Picker.Item label={t('challenge.free')} value={PaymentType.FREE} />
                                <Picker.Item label={t('challenge.entryFee')} value={PaymentType.ENTRY_FEE} />
                                <Picker.Item label={t('challenge.prizePool')} value={PaymentType.PRIZE_POOL} />
                            </Picker>
                        </View>
                    </View>

                    {paymentType !== PaymentType.FREE && (
                        <>
                            <View style={styles.switchGroup}>
                                <Text style={styles.label}>{t('challenge.requireEntryFee')}</Text>
                                <Switch
                                    value={hasEntryFee}
                                    onValueChange={setHasEntryFee}
                                    trackColor={{ false: '#ddd', true: '#4CAF50' }}
                                />
                            </View>

                            {hasEntryFee && (
                                <View style={styles.rowGroup}>
                                    <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                                        <Text style={styles.label}>{t('challenge.amount')}</Text>
                                        <TextInput
                                            style={styles.input}
                                            value={entryFeeAmount}
                                            onChangeText={setEntryFeeAmount}
                                            placeholder="0.00"
                                            keyboardType="decimal-pad"
                                            placeholderTextColor={theme.colors.text.disabled}
                                        />
                                    </View>
                                    <View style={[styles.inputGroup, { flex: 1 }]}>
                                        <Text style={styles.label}>{t('challenge.currency')}</Text>
                                        <View style={styles.pickerContainer}>
                                            <Picker
                                                selectedValue={entryFeeCurrency}
                                                onValueChange={(value) => setEntryFeeCurrency(value as CurrencyType)}
                                                style={styles.picker}
                                            >
                                                <Picker.Item label="Points" value={CurrencyType.POINTS} />
                                                <Picker.Item label="USD ($)" value={CurrencyType.USD} />
                                                <Picker.Item label="EUR (€)" value={CurrencyType.EUR} />
                                                <Picker.Item label="GBP (£)" value={CurrencyType.GBP} />
                                            </Picker>
                                        </View>
                                    </View>
                                </View>
                            )}
                        </>
                    )}

                    <View style={styles.switchGroup}>
                        <Text style={styles.label}>Offer Prize to Winner(s)</Text>
                        <Switch
                            value={hasPrize}
                            onValueChange={setHasPrize}
                            trackColor={{ false: '#ddd', true: '#4CAF50' }}
                        />
                    </View>

                    {hasPrize && (
                        <View style={styles.rowGroup}>
                            <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                                <Text style={styles.label}>Prize Amount</Text>
                                <TextInput
                                    style={styles.input}
                                    value={prizeAmount}
                                    onChangeText={setPrizeAmount}
                                    placeholder="0.00"
                                    keyboardType="decimal-pad"
                                    placeholderTextColor={theme.colors.text.disabled}
                                />
                            </View>
                            <View style={[styles.inputGroup, { flex: 1 }]}>
                                <Text style={styles.label}>{t('challenge.currency')}</Text>
                                <View style={styles.pickerContainer}>
                                    <Picker
                                        selectedValue={prizeCurrency}
                                        onValueChange={(value) => setPrizeCurrency(value as CurrencyType)}
                                        style={styles.picker}
                                    >
                                        <Picker.Item label="Points" value={CurrencyType.POINTS} />
                                        <Picker.Item label="USD ($)" value={CurrencyType.USD} />
                                        <Picker.Item label="EUR (€)" value={CurrencyType.EUR} />
                                        <Picker.Item label="GBP (£)" value={CurrencyType.GBP} />
                                    </Picker>
                                </View>
                            </View>
                        </View>
                    )}
                </View>

                {/* Access Control Section (only for private challenges) */}
                {visibility === 'PRIVATE' && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>🔒 Access Control</Text>

                        <View style={styles.switchGroup}>
                            <Text style={styles.label}>Require approval to join</Text>
                            <Switch
                                value={requiresApproval}
                                onValueChange={setRequiresApproval}
                                trackColor={{ false: '#ddd', true: '#4CAF50' }}
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>{t('groups.inviteMembers')} (comma-separated IDs)</Text>
                            <TextInput
                                style={styles.input}
                                value={invitedUserIds}
                                onChangeText={setInvitedUserIds}
                                placeholder="e.g., 1, 2, 5, 10"
                                keyboardType="number-pad"
                                placeholderTextColor={theme.colors.text.disabled}
                            />
                            <Text style={styles.helperText}>
                                Leave empty to manually invite users later
                            </Text>
                        </View>
                    </View>
                )}

                {/* Action Buttons */}
                <View style={styles.actions}>
                    <TouchableOpacity
                        style={[styles.button, styles.cancelButton]}
                        onPress={() => navigation.goBack()}
                        disabled={isLoading}
                    >
                        <Text style={styles.cancelButtonText}>{t('common.cancel')}</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.button, styles.submitButton]}
                        onPress={handleSubmit}
                        disabled={isLoading}
                    >
                        <Text style={styles.submitButtonText}>
                            {isLoading ? t('createQuest.creating') : t('challenges.createTitle')}
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    content: {
        padding: 16,
    },
    section: {
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1a1a1a',
        marginBottom: 16,
    },
    inputGroup: {
        marginBottom: 16,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: '#333',
        marginBottom: 8,
    },
    input: {
        backgroundColor: '#f5f5f5',
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
        color: '#1a1a1a',
        borderWidth: 1,
        borderColor: '#e0e0e0',
    },
    textArea: {
        height: 100,
        paddingTop: 12,
    },
    pickerContainer: {
        backgroundColor: '#f5f5f5',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#e0e0e0',
        overflow: 'hidden',
    },
    picker: {
        height: 50,
    },
    switchGroup: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    rowGroup: {
        flexDirection: 'row',
        marginBottom: 16,
    },
    helperText: {
        fontSize: 12,
        color: '#888',
        marginTop: 4,
    },
    actions: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 8,
        marginBottom: 32,
    },
    button: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
    },
    cancelButton: {
        backgroundColor: '#f5f5f5',
        marginRight: 8,
    },
    cancelButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#666',
    },
    submitButton: {
        backgroundColor: '#4CAF50',
        marginLeft: 8,
    },
    submitButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#FFFFFF',
    },
});