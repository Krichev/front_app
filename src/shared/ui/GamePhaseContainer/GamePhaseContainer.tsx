// src/shared/ui/GamePhaseContainer/GamePhaseContainer.tsx
import React from 'react'
import {StyleSheet, Text, View, ViewStyle} from 'react-native'
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons'
import {theme} from '../../styles/theme'

export type GamePhase = 'waiting' | 'question' | 'discussion' | 'answer' | 'feedback' | 'results'

interface GamePhaseContainerProps {
    phase: GamePhase
    title?: string
    subtitle?: string
    icon?: string
    children: React.ReactNode
    style?: ViewStyle
}

export const GamePhaseContainer: React.FC<GamePhaseContainerProps> = ({
                                                                          phase,
                                                                          title,
                                                                          subtitle,
                                                                          icon,
                                                                          children,
                                                                          style
                                                                      }) => {
    const getPhaseConfig = (phase: GamePhase) => {
        switch (phase) {
            case 'waiting':
                return {
                    icon: icon || 'play-circle',
                    color: theme.colors.primary,
                    backgroundColor: theme.colors.primaryLight
                }
            case 'question':
                return {
                    icon: icon || 'help-circle',
                    color: theme.colors.secondary,
                    backgroundColor: '#E3F2FD'
                }
            case 'discussion':
                return {
                    icon: icon || 'account-group',
                    color: theme.colors.warning,
                    backgroundColor: '#FFF9C4'
                }
            case 'answer':
                return {
                    icon: icon || 'pencil',
                    color: theme.colors.primary,
                    backgroundColor: theme.colors.primaryLight
                }
            case 'feedback':
                return {
                    icon: icon || 'comment-text',
                    color: theme.colors.secondary,
                    backgroundColor: '#E3F2FD'
                }
            case 'results':
                return {
                    icon: icon || 'trophy',
                    color: '#FFD700',
                    backgroundColor: '#FFFDE7'
                }
            default:
                return {
                    icon: icon || 'information',
                    color: theme.colors.text.secondary,
                    backgroundColor: theme.colors.background
                }
        }
    }

    const config = getPhaseConfig(phase)

    return (
        <View style={[styles.container, style]}>
            {(title || subtitle || icon) && (
                <View style={[styles.header, { backgroundColor: config.backgroundColor }]}>
                    {config.icon && (
                        <MaterialCommunityIcons
                            name={config.icon}
                            size={24}
                            color={config.color}
                            style={styles.headerIcon}
                        />
                    )}
                    <View style={styles.headerText}>
                        {title && (
                            <Text style={[styles.title, { color: config.color }]}>
                                {title}
                            </Text>
                        )}
                        {subtitle && (
                            <Text style={styles.subtitle}>{subtitle}</Text>
                        )}
                    </View>
                </View>
            )}

            <View style={styles.content}>
                {children}
            </View>
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: theme.colors.surface,
        borderRadius: theme.borderRadius.lg,
        marginBottom: theme.spacing.lg,
        overflow: 'hidden',
        ...theme.shadow.medium,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: theme.spacing.lg,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.borderLight,
    },
    headerIcon: {
        marginRight: theme.spacing.md,
    },
    headerText: {
        flex: 1,
    },
    title: {
        fontSize: theme.fontSize.lg,
        fontWeight: theme.fontWeight.bold,
        marginBottom: theme.spacing.xs,
    },
    subtitle: {
        fontSize: theme.fontSize.sm,
        color: theme.colors.text.secondary,
    },
    content: {
        padding: theme.spacing.lg,
    },
})