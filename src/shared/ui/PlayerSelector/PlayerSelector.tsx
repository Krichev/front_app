// src/shared/ui/PlayerSelector/PlayerSelector.tsx
import React from 'react'
import {ScrollView, StyleSheet, Text, TouchableOpacity, View, ViewStyle} from 'react-native'
import {theme} from '../../styles/theme'

interface PlayerSelectorProps {
    players: string[]
    selectedPlayer: string
    onSelectPlayer: (player: string) => void
    style?: ViewStyle
    label?: string
    required?: boolean
    horizontal?: boolean
}

export const PlayerSelector: React.FC<PlayerSelectorProps> = ({
                                                                  players,
                                                                  selectedPlayer,
                                                                  onSelectPlayer,
                                                                  style,
                                                                  label,
                                                                  required = false,
                                                                  horizontal = true
                                                              }) => {
    const Container = horizontal ? ScrollView : View

    return (
        <View style={[styles.container, style]}>
            {label && (
                <Text style={styles.label}>
                    {label}
                    {required && <Text style={styles.required}> *</Text>}
                </Text>
            )}

            <Container
                style={horizontal ? styles.horizontalContainer : styles.verticalContainer}
                horizontal={horizontal}
                showsHorizontalScrollIndicator={false}
            >
                {players.map((player, index) => (
                    <TouchableOpacity
                        key={index}
                        style={[
                            styles.playerButton,
                            selectedPlayer === player && styles.selectedPlayerButton,
                            !horizontal && styles.verticalPlayerButton
                        ]}
                        onPress={() => onSelectPlayer(player)}
                    >
                        <Text
                            style={[
                                styles.playerText,
                                selectedPlayer === player && styles.selectedPlayerText
                            ]}
                        >
                            {player}
                        </Text>
                    </TouchableOpacity>
                ))}
            </Container>
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        marginBottom: theme.spacing.md,
    },
    label: {
        fontSize: theme.fontSize.md,
        fontWeight: theme.fontWeight.medium,
        color: theme.colors.text.secondary,
        marginBottom: theme.spacing.sm,
    },
    required: {
        color: theme.colors.error,
    },
    horizontalContainer: {
        flexDirection: 'row',
    },
    verticalContainer: {
        flexDirection: 'column',
    },
    playerButton: {
        paddingVertical: theme.spacing.sm,
        paddingHorizontal: theme.spacing.md,
        borderRadius: theme.borderRadius.round,
        backgroundColor: theme.colors.background,
        marginRight: theme.spacing.sm,
        borderWidth: 1,
        borderColor: theme.colors.border,
        minWidth: 80,
        alignItems: 'center',
    },
    verticalPlayerButton: {
        marginRight: 0,
        marginBottom: theme.spacing.sm,
    },
    selectedPlayerButton: {
        backgroundColor: theme.colors.primary,
        borderColor: theme.colors.primary,
    },
    playerText: {
        fontSize: theme.fontSize.sm,
        color: theme.colors.text.secondary,
        fontWeight: theme.fontWeight.medium,
    },
    selectedPlayerText: {
        color: theme.colors.text.inverse,
        fontWeight: theme.fontWeight.bold,
    },
})