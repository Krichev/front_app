// src/screens/competitive/MatchmakingScreen.tsx
import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { AudioChallengeType } from '../../types/audioChallenge.types';
import { useJoinMatchmakingMutation, useGetMatchmakingStatusQuery, useLeaveMatchmakingMutation } from '../../entities/CompetitiveMatch/model/slice/competitiveApi';
import { MatchmakingSpinner } from '../../features/CompetitiveMatch/ui/MatchmakingSpinner';
import { Button, ButtonVariant } from '../../shared/ui/Button/Button';
import { useTheme } from '../../shared/ui/theme';

type MatchmakingRouteProp = RouteProp<{ params: { challengeType: AudioChallengeType; rounds: number } }, 'params'>;

export const MatchmakingScreen = () => {
    const navigation = useNavigation<any>();
    const route = useRoute<MatchmakingRouteProp>();
    const { challengeType, rounds } = route.params;
    const { theme } = useTheme();

    const [joinQueue, { isError }] = useJoinMatchmakingMutation();
    const [leaveQueue] = useLeaveMatchmakingMutation();
    
    // Poll every 3 seconds
    const { data: status, isLoading } = useGetMatchmakingStatusQuery(undefined, {
        pollingInterval: 3000,
    });

    useEffect(() => {
        // Join queue on mount
        joinQueue({ audioChallengeType: challengeType, preferredRounds: rounds });
        
        return () => {
            // Leave queue on unmount if not matched
            // BUT we can't check status easily in cleanup.
            // Best practice: explicit cancel button.
            // If we auto-leave, we might cancel a match that just happened.
            // Let's rely on explicit cancel or backend timeout.
        };
    }, []);

    useEffect(() => {
        if (status?.status === 'MATCHED' && status.matchId) {
            navigation.replace('LiveMatch', { matchId: status.matchId });
        }
    }, [status, navigation]);

    const handleCancel = () => {
        leaveQueue();
        navigation.goBack();
    };

    return (
        <View style={[styles.container, { backgroundColor: theme.colors.background.primary }]}>
            <MatchmakingSpinner 
                queuePosition={status?.queuePosition}
                estimatedWait={status?.estimatedWaitSeconds}
            />
            
            <View style={styles.footer}>
                <Button 
                    variant={ButtonVariant.OUTLINE} 
                    onPress={handleCancel}
                    style={styles.cancelButton}
                >
                    Cancel
                </Button>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
    },
    footer: {
        padding: 24,
        position: 'absolute',
        bottom: 0,
        width: '100%',
    },
    cancelButton: {
        width: '100%',
    }
});
