// src/entities/user/ui/user-card.tsx
// src/entities/user/ui/user-avatar.tsx
import React from 'react';
import {Image, StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import {CustomCard} from '../../../shared/ui';
import {theme} from '../../../shared/config';
import {UserAvatar} from './user-avatar';
import type {User} from '../model/types';

interface UserCardProps {
    user: User;
    onPress?: () => void;
    showStats?: boolean;
    showBio?: boolean;
}

export const UserCard: React.FC<UserCardProps> = ({
                                                      user,
                                                      onPress,
                                                      showStats = false,
                                                      showBio = true,
                                                  }) => {
    const CardContent = () => (
        <CustomCard style={styles.card}>
            <View style={styles.header}>
                <UserAvatar user={user} size="md" />
                <View style={styles.userInfo}>
                    <Text style={styles.username}>{user.username}</Text>
                    <Text style={styles.email}>{user.email}</Text>
                </View>
            </View>

            {showBio && user.bio && (
                <Text style={styles.bio} numberOfLines={2}>
                    {user.bio}
                </Text>
            )}

            {showStats && (
                <View style={styles.stats}>
                    <Text style={styles.joinDate}>
                        Joined {new Date(user.createdAt).toLocaleDateString()}
                    </Text>
                </View>
            )}
        </CustomCard>
    );

    if (onPress) {
        return (
            <TouchableOpacity onPress={onPress}>
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
    userInfo: {
        marginLeft: theme.spacing.md,
        flex: 1,
    },
    username: {
        fontSize: theme.fontSize.lg,
        fontWeight: theme.fontWeight.bold,
        color: theme.colors.text.primary,
    },
    email: {
        fontSize: theme.fontSize.sm,
        color: theme.colors.text.secondary,
    },
    bio: {
        fontSize: theme.fontSize.md,
        color: theme.colors.text.primary,
        lineHeight: 20,
        marginBottom: theme.spacing.sm,
    },
    stats: {
        marginTop: theme.spacing.sm,
    },
    joinDate: {
        fontSize: theme.fontSize.xs,
        color: theme.colors.text.light,
    },
});

interface UserAvatarProps {
    user: User;
    size?: 'sm' | 'md' | 'lg';
    showName?: boolean;
}

export const UserAvatar: React.FC<UserAvatarProps> = ({
                                                          user,
                                                          size = 'md',
                                                          showName = false,
                                                      }) => {
    const getSize = () => {
        switch (size) {
            case 'sm': return 32;
            case 'md': return 48;
            case 'lg': return 64;
            default: return 48;
        }
    };

    const avatarSize = getSize();
    const initials = user.username.slice(0, 2).toUpperCase();

    return (
        <View style={styles.container}>
            <View style={[styles.avatar, {width: avatarSize, height: avatarSize}]}>
                {user.avatar ? (
                    <Image
                        source={{uri: user.avatar}}
                        style={[styles.avatarImage, {width: avatarSize, height: avatarSize}]}
                    />
                ) : (
                    <Text style={[styles.initials, {fontSize: avatarSize / 2.5}]}>
                        {initials}
                    </Text>
                )}
            </View>

            {showName && (
                <Text style={styles.name} numberOfLines={1}>
                    {user.username}
                </Text>
            )}
        </View>
    );
};

const avatarStyles = StyleSheet.create({
    container: {
        alignItems: 'center',
    },
    avatar: {
        borderRadius: 50,
        backgroundColor: theme.colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
    },
    avatarImage: {
        borderRadius: 50,
    },
    initials: {
        color: theme.colors.text.inverse,
        fontWeight: theme.fontWeight.bold,
    },
    name: {
        marginTop: theme.spacing.xs,
        fontSize: theme.fontSize.sm,
        color: theme.colors.text.primary,
        textAlign: 'center',
    },
});

// Merge styles
const styles = {...avatarStyles};