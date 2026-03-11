import React, { useState } from 'react';
import { 
    View, 
    Text, 
    StyleSheet, 
    Switch, 
    Alert, 
    TouchableOpacity, 
    Modal, 
    FlatList,
    ActivityIndicator 
} from 'react-native';
import { useTranslation } from 'react-i18next';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTheme } from '../../../shared/ui/theme';
import { 
    useToggleScreenTimeMutation,
    useDelegateScreenTimeControlMutation,
    useReleaseScreenTimeControlMutation,
    useToggleScreenTimeForUserMutation,
    useGetScreenTimeBudgetQuery
} from '../../../entities/WagerState/model/slice/wagerApi';
import { useGetRelationshipsQuery } from '../../../entities/UserState/model/slice/relationshipApi';
import { useSelector } from 'react-redux';
import { RootState } from '../../../app/providers/StoreProvider/store';

export const ScreenTimeSettingsSection: React.FC = () => {
    const { t } = useTranslation();
    const { theme } = useTheme();
    const { user: currentUser, isAuthenticated } = useSelector((state: RootState) => state.auth);
    
    const { data: budget, isLoading: isLoadingBudget } = useGetScreenTimeBudgetQuery(undefined, {
        skip: !isAuthenticated
    });
    const [toggleSelf, { isLoading: isTogglingSelf }] = useToggleScreenTimeMutation();
    const [delegate, { isLoading: isDelegating }] = useDelegateScreenTimeControlMutation();
    const [release, { isLoading: isReleasing }] = useReleaseScreenTimeControlMutation();
    const [toggleOther] = useToggleScreenTimeForUserMutation();
    
    const [showDelegateModal, setShowDelegateModal] = useState(false);
    const { data: friendsData, isLoading: isLoadingFriends } = useGetRelationshipsQuery(
        { status: 'ACCEPTED', size: 50 },
        { skip: !showDelegateModal }
    );

    const handleToggle = async (value: boolean) => {
        try {
            if (budget?.controlLocked && budget.controlledBy !== currentUser?.id) {
                // Should be disabled in UI, but safety check
                return;
            }
            await toggleSelf({ enabled: value }).unwrap();
        } catch (error) {
            Alert.alert(t('common.error'), t('settings.updateError'));
        }
    };

    const handleDelegate = async (friendId: number, friendName: string) => {
        Alert.alert(
            t('settings.screenTime.delegateConfirmTitle'),
            t('settings.screenTime.delegateConfirmMessage', { username: friendName }),
            [
                { text: t('common.cancel'), style: 'cancel' },
                { 
                    text: t('common.yes'), 
                    onPress: async () => {
                        try {
                            await delegate({ controllerUserId: friendId }).unwrap();
                            setShowDelegateModal(false);
                            Alert.alert(t('common.success'), t('settings.updateSuccess'));
                        } catch (e) {
                            Alert.alert(t('common.error'), t('settings.updateError'));
                        }
                    } 
                }
            ]
        );
    };

    if (isLoadingBudget) {
        return <ActivityIndicator size="small" color={theme.colors.primary.main} />;
    }

    if (!budget) return null;

    const isControlledByOthers = budget.controlLocked && budget.controlledBy !== currentUser?.id;
    const isSelfManaged = !budget.controlLocked;

    return (
        <View style={styles.container}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text.secondary }]}>
                {t('settings.screenTime.title')}
            </Text>

            <View style={styles.settingItem}>
                <View style={styles.settingInfo}>
                    <MaterialCommunityIcons 
                        name="timer-outline" 
                        size={24} 
                        color={theme.colors.primary.main} 
                    />
                    <View style={styles.settingText}>
                        <Text style={[styles.settingLabel, { color: theme.colors.text.primary }]}>
                            {t('settings.screenTime.enabled')}
                        </Text>
                        <Text style={[styles.settingDescription, { color: theme.colors.text.secondary }]}>
                            {isControlledByOthers 
                                ? t('settings.screenTime.controlLocked', { username: budget.controllerUsername || 'Parent' })
                                : t('settings.screenTime.enabledDescription')}
                        </Text>
                    </View>
                </View>
                <Switch
                    value={budget.screenTimeEnabled}
                    onValueChange={handleToggle}
                    disabled={isControlledByOthers || isTogglingSelf}
                    trackColor={{ 
                        false: theme.colors.neutral.gray[300], 
                        true: theme.colors.primary.light 
                    }}
                    thumbColor={
                        budget.screenTimeEnabled 
                            ? theme.colors.primary.main 
                            : theme.colors.neutral.gray[100]
                    }
                />
            </View>

            {isSelfManaged && (
                <TouchableOpacity 
                    style={styles.delegateButton}
                    onPress={() => setShowDelegateModal(true)}
                    disabled={isDelegating}
                >
                    <MaterialCommunityIcons name="account-lock-outline" size={20} color={theme.colors.primary.main} />
                    <Text style={[styles.delegateButtonText, { color: theme.colors.primary.main }]}>
                        {t('settings.screenTime.delegateButton')}
                    </Text>
                </TouchableOpacity>
            )}

            {!isSelfManaged && budget.controlledBy && (
                <View style={styles.controlledInfo}>
                    <MaterialCommunityIcons name="shield-account-outline" size={16} color={theme.colors.warning.main} />
                    <Text style={[styles.controlledText, { color: theme.colors.warning.main }]}>
                        {t('settings.screenTime.controlledBy', { username: budget.controllerUsername || 'Parent' })}
                    </Text>
                </View>
            )}

            {/* Delegation Modal */}
            <Modal
                visible={showDelegateModal}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setShowDelegateModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { backgroundColor: theme.colors.background.primary }]}>
                        <View style={styles.modalHeader}>
                            <Text style={[styles.modalTitle, { color: theme.colors.text.primary }]}>
                                {t('settings.screenTime.delegateTitle')}
                            </Text>
                            <TouchableOpacity onPress={() => setShowDelegateModal(false)}>
                                <MaterialCommunityIcons name="close" size={24} color={theme.colors.text.primary} />
                            </TouchableOpacity>
                        </View>
                        
                        <Text style={[styles.modalSubtitle, { color: theme.colors.text.secondary }]}>
                            {t('settings.screenTime.delegateDescription')}
                        </Text>

                        {isLoadingFriends ? (
                            <ActivityIndicator size="large" color={theme.colors.primary.main} style={{ margin: 20 }} />
                        ) : (
                            <FlatList
                                data={friendsData?.content || []}
                                keyExtractor={(item) => item.id.toString()}
                                renderItem={({ item }) => {
                                    const friend = item.relatedUser;
                                    if (!friend) return null;
                                    return (
                                        <TouchableOpacity 
                                            style={[styles.friendItem, { borderBottomColor: theme.colors.border.light }]}
                                            onPress={() => handleDelegate(Number(friend.id), friend.username)}
                                        >
                                            <MaterialCommunityIcons name="account" size={24} color={theme.colors.text.secondary} />
                                            <Text style={[styles.friendName, { color: theme.colors.text.primary }]}>{friend.username}</Text>
                                            <MaterialCommunityIcons name="chevron-right" size={20} color={theme.colors.text.disabled} />
                                        </TouchableOpacity>
                                    );
                                }}
                                ListEmptyComponent={
                                    <Text style={[styles.emptyText, { color: theme.colors.text.secondary }]}>
                                        {t('common.noResults')}
                                    </Text>
                                }
                            />
                        )}
                    </View>
                </View>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginTop: 8,
    },
    sectionTitle: {
        fontSize: 12,
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: 8,
        paddingHorizontal: 4,
    },
    settingItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 12,
        paddingHorizontal: 4,
    },
    settingInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    settingText: {
        marginLeft: 12,
        flex: 1,
    },
    settingLabel: {
        fontSize: 16,
        fontWeight: '500',
    },
    settingDescription: {
        fontSize: 12,
        marginTop: 2,
    },
    delegateButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 4,
        marginTop: 4,
    },
    delegateButtonText: {
        fontSize: 14,
        fontWeight: '600',
        marginLeft: 8,
    },
    controlledInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 4,
        marginTop: 4,
    },
    controlledText: {
        fontSize: 12,
        fontWeight: '600',
        marginLeft: 4,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 24,
        maxHeight: '80%',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
    },
    modalSubtitle: {
        fontSize: 14,
        marginBottom: 20,
    },
    friendItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 16,
        borderBottomWidth: 1,
    },
    friendName: {
        flex: 1,
        fontSize: 16,
        marginLeft: 12,
    },
    emptyText: {
        textAlign: 'center',
        marginVertical: 40,
        fontSize: 16,
    }
});
