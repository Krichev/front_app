import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
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
            <Text style={[styles.title, { color: theme.colors.text.primary }]}>Setup Your Wager</Text>
            
            <StakeSelector selectedType={stakeType} onSelect={setStakeType} />

            <Input
                label="Stake Amount"
                value={amount}
                onChangeText={setAmount}
                keyboardType="numeric"
                placeholder="e.g. 100"
            />

            {stakeType === 'SCREEN_TIME' && (
                <Input
                    label="Screen Time (Minutes)"
                    value={screenTime}
                    onChangeText={setScreenTime}
                    keyboardType="numeric"
                    placeholder="e.g. 30"
                />
            )}

            {stakeType === 'SOCIAL_QUEST' && (
                <Input
                    label="Social Penalty Description"
                    value={socialPenalty}
                    onChangeText={setSocialPenalty}
                    multiline
                    numberOfLines={3}
                    placeholder="e.g. Change profile pic to a clown for 24h"
                />
            )}

            <View style={styles.footer}>
                <Button 
                    onPress={handleSave} 
                    fullWidth
                >
                    Confirm Wager
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
