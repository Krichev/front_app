import React, { useEffect, useRef } from 'react';
import {
    View,
    Text,
    Modal,
    StyleSheet,
    Animated,
    BackHandler,
    StatusBar,
    TouchableOpacity,
    AccessibilityInfo,
    Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTheme } from '../../../shared/ui/theme';
import { useScreenTime } from '../../../shared/hooks/useScreenTime';
import { ResetCountdown } from './ResetCountdown';
import { useGetMyPenaltiesQuery } from '../../../entities/WagerState/model/slice/wagerApi';
import { LockAnimation } from './LockAnimation';
import { UnlockTransition } from './UnlockTransition';
import { TimeExtensionRequestModal } from './TimeExtensionRequestModal';
import { useGetLinkedParentsQuery, useRequestTimeExtensionMutation } from '../../../entities/ParentalState/model/slice/parentalApi';
import { Alert } from 'react-native';
import { useSelector } from 'react-redux';
import { RootState } from '../../../app/providers/StoreProvider/store';

interface AppLockOverlayProps {
    isLocked?: boolean;
    dailyResetTime?: string;
    minutesUntilReset?: number;
    pendingPenalties?: Array<{ id: number; description: string; minutesLocked: number }>;
    onViewPenalties?: () => void;
    onOpenSettings?: () => void;
    showPenaltyInfo?: boolean;
}

export const AppLockOverlay: React.FC<AppLockOverlayProps> = ({
    isLocked: isLockedProp,
    dailyResetTime,
    minutesUntilReset: _minutesUntilReset,
    pendingPenalties: propPenalties,
    onViewPenalties,
    onOpenSettings,
    showPenaltyInfo = true,
}) => {
    const { theme } = useTheme();
    const screenTimeContext = useScreenTime();
    const { isAuthenticated } = useSelector((state: RootState) => state.auth);
    
    // Use prop override or context value
    const isLocked = isLockedProp ?? screenTimeContext.isLocked;
    const resetTime = dailyResetTime ?? screenTimeContext.status?.lastResetDate;

    // Parental control hooks
    const { data: parents } = useGetLinkedParentsQuery(undefined, { skip: !isAuthenticated });
    const [requestExtension, { isLoading: isRequesting }] = useRequestTimeExtensionMutation();
    const [showRequestModal, setShowRequestModal] = React.useState(false);

    const [isUnlocking, setIsUnlocking] = React.useState(false);
    const prevIsLocked = useRef(isLocked);

    // Fetch penalties if not provided and locked
    const { data: penaltyData } = useGetMyPenaltiesQuery(
        { status: 'PENDING', size: 5 }, 
        { skip: !isAuthenticated || (!isLocked || !!propPenalties) }
    );
    
    // Animation values
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const scaleAnim = useRef(new Animated.Value(0.9)).current;
    
    // Watch for unlock transition
    useEffect(() => {
        if (prevIsLocked.current && !isLocked) {
            setIsUnlocking(true);
        }
        prevIsLocked.current = isLocked;
    }, [isLocked]);

    const handleUnlockComplete = () => {
        setIsUnlocking(false);
    };

    // Entrance animation
    useEffect(() => {
        if (isLocked) {
            Animated.parallel([
                Animated.timing(fadeAnim, {
                    toValue: 1,
                    duration: 300,
                    useNativeDriver: true,
                }),
                Animated.spring(scaleAnim, {
                    toValue: 1,
                    friction: 8,
                    tension: 40,
                    useNativeDriver: true,
                }),
            ]).start();
        } else if (!isUnlocking) {
            // Exit animation only if not playing unlock transition
            Animated.parallel([
                Animated.timing(fadeAnim, {
                    toValue: 0,
                    duration: 200,
                    useNativeDriver: true,
                }),
                Animated.timing(scaleAnim, {
                    toValue: 1.1,
                    duration: 200,
                    useNativeDriver: true,
                }),
            ]).start();
        }
    }, [isLocked, isUnlocking, fadeAnim, scaleAnim]);

    
    // CRITICAL: Block hardware back button on Android
    useEffect(() => {
        if (!isLocked) return;
        
        const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
            // Return true to indicate we've handled the back press
            // This prevents the default behavior (exiting app/going back)
            return true;
        });
        
        return () => backHandler.remove();
    }, [isLocked]);

    // Intercept deep links when locked
    useEffect(() => {
        if (!isLocked) return;
        
        const handleDeepLink = (event: { url: string }) => {
            console.log('[AppLock] Blocked deep link:', event.url);
            // Optionally queue the link for when unlocked
            // Or just ignore it
        };
        
        const subscription = Linking.addEventListener('url', handleDeepLink);
        
        return () => subscription.remove();
    }, [isLocked]);
    
    // Announce to screen readers
    useEffect(() => {
        if (isLocked) {
            AccessibilityInfo.announceForAccessibility(
                'Screen time depleted. Your daily screen time has been used up.'
            );
        }
    }, [isLocked]);

    // Early return if not authenticated - user hasn't logged in yet
    if (!isAuthenticated) {
        return null;
    }

    const pendingPenalties = propPenalties || (penaltyData?.content?.map(p => ({
        id: p.id,
        description: p.description,
        minutesLocked: p.screenTimeMinutes || 30 // Default or from penalty
    })) || []);
    
    if (!isLocked && !isUnlocking) {
        return null;
    }

    if (isUnlocking) {
        return <UnlockTransition isUnlocking={isUnlocking} onComplete={handleUnlockComplete} />;
    }
    
    return (
        <Modal
            visible={isLocked}
            transparent
            animationType="none" // We handle animation manually
            statusBarTranslucent
            onRequestClose={() => {
                // Android back button - do nothing (blocked)
                return true;
            }}
        >
            <StatusBar
                barStyle="light-content"
                backgroundColor="rgba(0,0,0,0.95)"
                translucent
            />
            
            <Animated.View
                style={[
                    styles.overlay,
                    {
                        opacity: fadeAnim,
                    },
                ]}
            >
                <SafeAreaView style={styles.safeArea}>
                    <Animated.View
                        style={[
                            styles.content,
                            {
                                transform: [{ scale: scaleAnim }],
                            },
                        ]}
                    >
                        {/* Lock Icon */}
                        <View style={styles.iconContainer}>
                            <LockAnimation size={80} color={theme.colors.error.main} />
                        </View>
                        
                        {/* Main Message */}
                        <Text style={styles.title} accessibilityRole="header">
                            Time's Up!
                        </Text>
                        <Text style={styles.subtitle}>
                            Your screen time for today has been used up.
                        </Text>
                        
                        {/* Reset Countdown Card */}
                        <View style={styles.card}>
                            <MaterialCommunityIcons
                                name="timer-sand"
                                size={24}
                                color={theme.colors.primary.main}
                            />
                            <View style={styles.cardContent}>
                                <Text style={styles.cardLabel}>Resets in</Text>
                                <ResetCountdown targetTime={resetTime} />
                            </View>
                        </View>
                        
                        {/* Penalty Info Card */}
                        {showPenaltyInfo && pendingPenalties.length > 0 && (
                            <TouchableOpacity
                                style={styles.card}
                                onPress={onViewPenalties}
                                accessibilityRole="button"
                                accessibilityLabel={`View ${pendingPenalties.length} pending penalties`}
                            >
                                <MaterialCommunityIcons
                                    name="clipboard-list"
                                    size={24}
                                    color={theme.colors.warning.main}
                                />
                                <View style={styles.cardContent}>
                                    <Text style={styles.cardLabel}>
                                        {pendingPenalties.length} penalty can unlock time
                                    </Text>
                                    <Text style={styles.cardValue}>
                                        {pendingPenalties.reduce((sum, p) => sum + p.minutesLocked, 0)} minutes
                                    </Text>
                                </View>
                                <MaterialCommunityIcons
                                    name="chevron-right"
                                    size={24}
                                    color={theme.colors.text.secondary}
                                />
                            </TouchableOpacity>
                        )}
                        
                        {/* Settings Button */}
                        {onOpenSettings && (
                            <TouchableOpacity
                                style={styles.settingsButton}
                                onPress={onOpenSettings}
                                accessibilityRole="button"
                            >
                                <MaterialCommunityIcons
                                    name="cog"
                                    size={20}
                                    color={theme.colors.text.secondary}
                                />
                                <Text style={styles.settingsText}>
                                    Screen Time Settings
                                </Text>
                            </TouchableOpacity>
                        )}

                        {/* Request Time Button (Only if child account) */}
                        {parents && parents.length > 0 && (
                            <TouchableOpacity
                                style={styles.requestButton}
                                onPress={() => setShowRequestModal(true)}
                            >
                                <MaterialCommunityIcons name="clock-plus" size={20} color={theme.colors.primary.main} />
                                <Text style={styles.requestButtonText}>Request More Time</Text>
                            </TouchableOpacity>
                        )}
                    </Animated.View>
                </SafeAreaView>
                
                <TimeExtensionRequestModal
                    visible={showRequestModal}
                    onClose={() => setShowRequestModal(false)}
                    onSubmit={async (minutes, reason) => {
                        try {
                            await requestExtension({ minutes, reason }).unwrap();
                            setShowRequestModal(false);
                            Alert.alert('Request Sent', 'Your parent will be notified.');
                        } catch (error) {
                            Alert.alert('Error', 'Failed to send request. Please try again.');
                        }
                    }}
                    isLoading={isRequesting}
                />
            </Animated.View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.95)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    safeArea: {
        flex: 1,
        width: '100%',
        justifyContent: 'center',
        alignItems: 'center',
    },
    content: {
        width: '85%',
        maxWidth: 400,
        alignItems: 'center',
        paddingHorizontal: 20,
    },
    iconContainer: {
        marginBottom: 24,
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#FFFFFF',
        marginBottom: 8,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 16,
        color: 'rgba(255, 255, 255, 0.7)',
        textAlign: 'center',
        marginBottom: 32,
        lineHeight: 24,
    },
    card: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        borderRadius: 16,
        padding: 16,
        width: '100%',
        marginBottom: 16,
    },
    cardContent: {
        flex: 1,
        marginLeft: 12,
        justifyContent: 'center',
    },
    cardLabel: {
        fontSize: 14,
        color: 'rgba(255, 255, 255, 0.7)',
        marginBottom: 4,
    },
    cardValue: {
        fontSize: 20,
        fontWeight: '600',
        color: '#FFFFFF',
    },
    settingsButton: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 24,
        padding: 12,
    },
    settingsText: {
        fontSize: 14,
        color: 'rgba(255, 255, 255, 0.5)',
        marginLeft: 8,
    },
    requestButton: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 16,
        padding: 12,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        borderRadius: 24,
    },
    requestButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#FFFFFF',
        marginLeft: 8,
    },
});
