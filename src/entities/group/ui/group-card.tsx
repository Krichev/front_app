// src/entities/group/ui/group-card.tsx
import React from 'react';
import {StyleSheet, Text, TouchableOpacity, View, ViewStyle} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import {Badge, CustomCard} from '../../../shared/ui';
import {theme} from '../../../shared/styles';
import type {Group} from '../model/types';

interface GroupCardProps {
    group: Group;
    onPress?: () => void;
    showJoinButton?: boolean;
    onJoin?: () => void;
    style?: ViewStyle;
}

export const GroupCard: React.FC<GroupCardProps> = ({
                                                        group,
                                                        onPress,
                                                        showJoinButton = false,
                                                        onJoin,
                                                        style,
                                                    }) => {
    const getTypeIcon = () => {
        switch (group.type) {
            case 'CHALLENGE': return 'trophy';
            case 'SOCIAL': return 'account-group';
            case 'STUDY': return 'book';
            case 'GAMING': return 'gamepad-variant';
            default: return 'account-group';
        }
    };

    const getPrivacyIcon = () => {
        switch (group.privacy) {
            case 'PUBLIC': return 'earth';
            case 'PRIVATE': return 'lock';
            case 'INVITATION_ONLY': return 'email';
            default: return 'earth';
        }
    };

    const getTypeVariant = () => {
        switch (group.type) {
            case 'CHALLENGE': return 'warning';
            case 'SOCIAL': return 'primary';
            case 'STUDY': return 'success';
            case 'GAMING': return 'error';
            default: return 'neutral';
        }
    };

    const CardContent = () => (
        <CustomCard style={[styles.card, style]}>
            {/* Header */}
            <View style={styles.header}>
                <View style={styles.iconContainer}>
                    <MaterialCommunityIcons
                        name={getTypeIcon()}
                        size={24}
                        color={theme.colors.primary}
                    />
                </View>
                <View style={styles.headerInfo}>
                    <Text style={styles.groupName} numberOfLines={1}>
                        {group.name}
                    </Text>
                    <View style={styles.metadata}>
                        <MaterialCommunityIcons
                            name={getPrivacyIcon()}
                            size={16}
                            color={theme.colors.text.light}
                        />
                        <Text style={styles.memberCount}>
                            {group.memberCount} members
                        </Text>
                    </View>
                </View>
                {group.userRole && (
                    <Badge
                        text={group.userRole}
                        variant="primary"
                        size="sm"
                    />
                )}
            </View>

            {/* Description */}
            <Text style={styles.description} numberOfLines={2}>
                {group.description}
            </Text>

            {/* Tags and Type */}
            <View style={styles.footer}>
                <View style={styles.tags}>
                    <Badge
                        text={group.type}
                        variant={getTypeVariant()}
                        size="sm"
                    />
                    {group.tags.slice(0, 2).map((tag, index) => (
                        <Badge
                            key={index}
                            text={tag}
                            variant="neutral"
                            size="sm"
                            style={styles.tag}
                        />
                    ))}
                </View>

                {showJoinButton && !group.userIsMember && onJoin && (
                    <TouchableOpacity
                        style={styles.joinButton}
                        onPress={onJoin}
                    >
                        <Text style={styles.joinButtonText}>Join</Text>
                    </TouchableOpacity>
                )}
            </View>
        </CustomCard>
    );

    if (onPress) {
        return (
            <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
                <CardContent />
            </TouchableOpacity>
        );
    }

    return <CardContent />;
};

const styles = StyleSheet.create({
    card: {
        marginBottom: theme.spacing.md,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: theme.spacing.sm,
    },
    iconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: theme.colors.primaryLight,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: theme.spacing.md,
    },
    headerInfo: {
        flex: 1,
    },
    groupName: {
        fontSize: theme.fontSize.lg,
        fontWeight: theme.fontWeight.bold,
        color: theme.colors.text.primary,
        marginBottom: theme.spacing.xs,
    },
    metadata: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    memberCount: {
        fontSize: theme.fontSize.sm,
        color: theme.colors.text.light,
        marginLeft: theme.spacing.xs,
    },
    description: {
        fontSize: theme.fontSize.md,
        color: theme.colors.text.secondary,
        lineHeight: 20,
        marginBottom: theme.spacing.md,
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    tags: {
        flexDirection: 'row',
        flex: 1,
        flexWrap: 'wrap',
    },
    tag: {
        marginLeft: theme.spacing.xs,
    },
    joinButton: {
        backgroundColor: theme.colors.primary,
        paddingVertical: theme.spacing.xs,
        paddingHorizontal: theme.spacing.md,
        borderRadius: theme.borderRadius.md,
    },
    joinButtonText: {
        fontSize: theme.fontSize.sm,
        fontWeight: theme.fontWeight.bold,
        color: theme.colors.text.inverse,
    },
});
