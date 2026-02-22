import React from 'react';
import { Image, Text, TouchableOpacity, View } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTranslation } from 'react-i18next';
import { UserSearchResult } from '../../entities/QuizState/model/types/question.types';
import { useAppStyles } from '../../shared/ui/hooks/useAppStyles';
import { createStyles } from '../../shared/ui/theme/createStyles';

/**
 * Props for the UserSearchCard component
 */
export interface UserSearchCardProps {
  /** The user search result to display */
  user: UserSearchResult;
  /** Callback function when the card is pressed */
  onPress: (userId: string) => void;
}

/**
 * Component to display a user in search results
 */
export const UserSearchCard: React.FC<UserSearchCardProps> = React.memo(({ user, onPress }) => {
    const { theme } = useAppStyles();
    const { t } = useTranslation();
    const styles = themeStyles;

    return (
        <TouchableOpacity
            style={styles.resultCard}
            onPress={() => onPress(user.id)}
        >
            <View style={styles.avatarContainer}>
                {user.avatar ? (
                    <Image source={{ uri: user.avatar }} style={styles.avatar} />
                ) : (
                    <View style={styles.avatarPlaceholder}>
                        <Text style={styles.avatarInitial}>
                            {user.username.charAt(0).toUpperCase()}
                        </Text>
                    </View>
                )}
            </View>
            <View style={styles.cardContent}>
                <View style={styles.cardHeader}>
                    <Text style={styles.cardTitle}>{user.username}</Text>
                    {user.connectionStatus && user.connectionStatus !== 'NONE' && (
                        <View style={[
                            styles.statusBadge,
                            user.connectionStatus === 'ACCEPTED' ? styles.statusConnected : styles.statusPending
                        ]}>
                            <Text style={styles.statusText}>
                                {user.connectionStatus === 'ACCEPTED' ? t('search.connected') : t('search.pending')}
                            </Text>
                        </View>
                    )}
                </View>
                {user.bio && (
                    <Text style={styles.cardSubtitle} numberOfLines={1}>{user.bio}</Text>
                )}
            </View>
            <MaterialCommunityIcons 
                name='chevron-right' 
                size={20} 
                color={theme.colors.text.disabled} 
            />
        </TouchableOpacity>
    );
});

const themeStyles = createStyles(theme => ({
    resultCard: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: theme.spacing.lg,
        paddingVertical: theme.spacing.md,
        backgroundColor: theme.colors.background.primary,
        borderBottomWidth: theme.layout.borderWidth.thin,
        borderBottomColor: theme.colors.background.secondary,
    },
    avatarContainer: {
        width: 44,
        height: 44,
        marginRight: theme.spacing.md,
    },
    avatar: {
        width: 44,
        height: 44,
        borderRadius: 22,
    },
    avatarPlaceholder: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: theme.colors.primary.main,
        alignItems: 'center',
        justifyContent: 'center',
    },
    avatarInitial: {
        color: theme.colors.neutral.white,
        fontSize: theme.typography.fontSize.lg,
        fontWeight: theme.typography.fontWeight.bold,
    },
    cardContent: {
        flex: 1,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    cardTitle: {
        fontSize: theme.typography.fontSize.base,
        fontWeight: theme.typography.fontWeight.semibold,
        color: theme.colors.text.primary,
    },
    cardSubtitle: {
        fontSize: theme.typography.fontSize.sm,
        color: theme.colors.text.secondary,
        marginTop: 2,
    },
    statusBadge: {
        paddingHorizontal: theme.spacing.sm,
        paddingVertical: 2,
        borderRadius: theme.layout.borderRadius.lg,
        marginLeft: theme.spacing.sm,
    },
    statusConnected: {
        backgroundColor: theme.colors.success.background,
    },
    statusPending: {
        backgroundColor: theme.colors.warning.background,
    },
    statusText: {
        fontSize: theme.typography.fontSize.xs,
        fontWeight: theme.typography.fontWeight.medium,
        color: theme.colors.text.secondary,
    },
}));
