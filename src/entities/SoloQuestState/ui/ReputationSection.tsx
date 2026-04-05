// src/entities/SoloQuestState/ui/ReputationSection.tsx
import React, { useCallback, useState } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { useAppStyles } from '../../../shared/ui/hooks/useAppStyles';
import { createStyles } from '../../../shared/ui/theme';
import { useGetUserReputationQuery } from '../model/slice/soloQuestApi';
import { RootStackParamList } from '../../../navigation/AppNavigator';
import ReputationScoreBadge from './ReputationScoreBadge';
import ReputationMarkCard from './ReputationMarkCard';
import ReputationMarksList from './ReputationMarksList';

interface ReputationSectionProps {
    userId: number | string;
    isOwnProfile: boolean;
}

type NavProp = NativeStackNavigationProp<RootStackParamList>;

const PREVIEW_COUNT = 3;

const ReputationSection: React.FC<ReputationSectionProps> = ({ userId, isOwnProfile }) => {
    const { t } = useTranslation();
    const { theme } = useAppStyles();
    const styles = themeStyles;
    const navigation = useNavigation<NavProp>();

    const numericId = typeof userId === 'string' ? parseInt(userId, 10) : userId;
    const { data } = useGetUserReputationQuery(numericId, { skip: !numericId });

    const [expanded, setExpanded] = useState(false);

    const handleViewAll = useCallback(() => {
        navigation.navigate('ReputationDetail', { userId: String(userId) });
    }, [navigation, userId]);

    const toggleExpanded = useCallback(() => setExpanded(v => !v), []);

    const marks = data?.marks ?? [];
    const previewMarks = marks.slice(0, PREVIEW_COUNT);
    const hasMore = marks.length > PREVIEW_COUNT;

    return (
        <View style={[styles.container, { backgroundColor: theme.colors.background.primary }]}>
            {/* Header row */}
            <TouchableOpacity style={styles.headerRow} onPress={toggleExpanded} activeOpacity={0.7}>
                <Text style={[styles.sectionTitle, { color: theme.colors.text.primary }]}>
                    {t('soloQuest.reputation.title')}
                </Text>
                <View style={styles.headerRight}>
                    <ReputationScoreBadge score={data?.reputationScore} size="medium" />
                </View>
            </TouchableOpacity>

            {expanded && (
                <View style={styles.marksContainer}>
                    {marks.length === 0 ? (
                        <Text style={[styles.emptyText, { color: theme.colors.text.disabled }]}>
                            {t('soloQuest.reputation.noMarks')}
                        </Text>
                    ) : (
                        <>
                            {previewMarks.map(mark => (
                                <ReputationMarkCard
                                    key={mark.id}
                                    mark={mark}
                                    showAppeal={false}
                                    onAppeal={() => {}}
                                />
                            ))}
                            {hasMore && (
                                <TouchableOpacity onPress={handleViewAll} style={styles.viewAllLink}>
                                    <Text style={[styles.viewAllText, { color: theme.colors.success.main }]}>
                                        {t('soloQuest.reputation.viewAllMarks')}
                                    </Text>
                                </TouchableOpacity>
                            )}
                        </>
                    )}
                </View>
            )}
        </View>
    );
};

const themeStyles = createStyles(theme => ({
    container: {
        borderRadius: theme.layout.borderRadius.md,
        padding: theme.spacing.md,
        marginTop: theme.spacing.sm,
        ...theme.shadows.small,
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    headerRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing.xs,
    },
    sectionTitle: {
        ...theme.typography.body.medium,
        fontWeight: theme.typography.fontWeight.bold,
    },
    marksContainer: {
        marginTop: theme.spacing.md,
    },
    emptyText: {
        ...theme.typography.body.small,
        textAlign: 'center',
        padding: theme.spacing.sm,
    },
    viewAllLink: {
        alignItems: 'center',
        paddingVertical: theme.spacing.sm,
    },
    viewAllText: {
        ...theme.typography.body.small,
        fontWeight: theme.typography.fontWeight.semibold,
    },
}));

export default ReputationSection;
