import type {User} from "../model/types.ts";
import React from "react";
import {Image, StyleSheet, Text, View} from "react-native";
import {theme} from "../../../shared/styles";

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