import React, { useState } from 'react';
import { 
    View, 
    Text, 
    StyleSheet, 
    FlatList, 
    TouchableOpacity, 
    SafeAreaView,
    ActivityIndicator,
    RefreshControl
} from 'react-native';
import { useTheme } from '../shared/ui/theme';
import { useGetMyPenaltiesQuery } from '../entities/WagerState/model/slice/wagerApi';
import { Penalty, PenaltyStatus } from '../entities/WagerState/model/types';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';

type PenaltyTab = 'PENDING' | 'ACTIVE' | 'COMPLETED';

export const PenaltyDashboardScreen: React.FC = () => {
    const { theme } = useTheme();
    const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
    const [activeTab, setActiveTab] = useState<PenaltyTab>('PENDING');

    const getStatusForTab = (tab: PenaltyTab): PenaltyStatus | undefined => {
        if (tab === 'PENDING') return 'PENDING';
        if (tab === 'ACTIVE') return 'IN_PROGRESS';
        if (tab === 'COMPLETED') return 'VERIFIED';
        return undefined;
    };

    const { data, isLoading, refetch } = useGetMyPenaltiesQuery({ 
        status: getStatusForTab(activeTab),
        size: 50 
    });

    const penalties = data?.content || [];

    const getPenaltyIcon = (type: string) => {
        switch (type) {
            case 'SCREEN_TIME_LOCK': return 'timer-off';
            case 'SOCIAL_TASK': return 'account-group';
            case 'POINT_DEDUCTION': return 'database-minus';
            case 'PROFILE_CHANGE': return 'account-edit';
            default: return 'alert-circle';
        }
    };

    const renderPenaltyItem = ({ item }: { item: Penalty }) => (
        <TouchableOpacity 
            style={[
                styles.card, 
                { backgroundColor: theme.colors.background.primary, borderColor: theme.colors.border.light }
            ]}
            onPress={() => navigation.navigate('PenaltyProof', { penaltyId: item.id })}
        >
            <View style={[styles.iconContainer, { backgroundColor: theme.colors.background.secondary }]}>
                <MaterialCommunityIcons name={getPenaltyIcon(item.penaltyType)} size={24} color={theme.colors.primary.main} />
            </View>
            <View style={styles.cardContent}>
                <Text style={[styles.cardTitle, { color: theme.colors.text.primary }]} numberOfLines={1}>
                    {item.description}
                </Text>
                <Text style={[styles.cardDate, { color: theme.colors.text.secondary }]}>
                    Due: {new Date(item.dueDate).toLocaleDateString()}
                </Text>
            </View>
            <View style={[
                styles.badge, 
                { backgroundColor: item.status === 'VERIFIED' ? theme.colors.success.background : theme.colors.warning.background }
            ]}>
                <Text style={[
                    styles.badgeText, 
                    { color: item.status === 'VERIFIED' ? theme.colors.success.dark : theme.colors.warning.dark }
                ]}>
                    {item.status}
                </Text>
            </View>
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background.secondary }]}>
            <View style={[styles.header, { backgroundColor: theme.colors.background.primary }]}>
                <Text style={[styles.title, { color: theme.colors.text.primary }]}>My Penalties</Text>
            </View>

            <View style={[styles.tabs, { backgroundColor: theme.colors.background.primary }]}>
                {(['PENDING', 'ACTIVE', 'COMPLETED'] as PenaltyTab[]).map((tab) => (
                    <TouchableOpacity
                        key={tab}
                        style={[
                            styles.tab,
                            activeTab === tab && { borderBottomColor: theme.colors.primary.main }
                        ]}
                        onPress={() => setActiveTab(tab)}
                    >
                        <Text style={[
                            styles.tabText,
                            { color: activeTab === tab ? theme.colors.primary.main : theme.colors.text.secondary }
                        ]}>
                            {tab}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            {isLoading ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color={theme.colors.primary.main} />
                </View>
            ) : (
                <FlatList
                    data={penalties}
                    renderItem={renderPenaltyItem}
                    keyExtractor={(item) => item.id.toString()}
                    contentContainerStyle={styles.list}
                    refreshControl={
                        <RefreshControl refreshing={isLoading} onRefresh={refetch} />
                    }
                    ListEmptyComponent={
                        <View style={styles.empty}>
                            <MaterialCommunityIcons name="emoticon-happy-outline" size={64} color={theme.colors.text.disabled} />
                            <Text style={[styles.emptyText, { color: theme.colors.text.secondary }]}>
                                No penalties in this category!
                            </Text>
                        </View>
                    }
                />
            )}
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        padding: 16,
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
    },
    tabs: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    tab: {
        flex: 1,
        paddingVertical: 12,
        alignItems: 'center',
        borderBottomWidth: 2,
        borderBottomColor: 'transparent',
    },
    tabText: {
        fontWeight: '600',
        fontSize: 14,
    },
    list: {
        padding: 16,
    },
    card: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        borderRadius: 12,
        marginBottom: 12,
        borderWidth: 1,
    },
    iconContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    cardContent: {
        flex: 1,
    },
    cardTitle: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 4,
    },
    cardDate: {
        fontSize: 12,
    },
    badge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
    },
    badgeText: {
        fontSize: 10,
        fontWeight: 'bold',
        textTransform: 'uppercase',
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    empty: {
        alignItems: 'center',
        marginTop: 100,
    },
    emptyText: {
        marginTop: 16,
        fontSize: 16,
    }
});
