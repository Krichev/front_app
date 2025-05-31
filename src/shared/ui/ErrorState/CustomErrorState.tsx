// src/shared/ui/ErrorState/ErrorState.tsx
import React from 'react'
import {StyleSheet, Text, View} from 'react-native'
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons'
import {theme} from "../../styles/theme.ts";
import {CustomButton} from "../Button/CustomButton.tsx";

interface ErrorStateProps {
    title?: string
    message: string
    onRetry?: () => void
    retryText?: string
}

export const CustomErrorState: React.FC<ErrorStateProps> = ({
                                                          title = 'Something went wrong',
                                                          message,
                                                          onRetry,
                                                          retryText = 'Try Again'
                                                      }) => {
    return (
        <View style={styles.container}>
            <MaterialCommunityIcons
                name="alert-circle-outline"
                size={64}
                color={theme.colors.error}
            />
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.message}>{message}</Text>
            {onRetry && (
                <CustomButton
                    variant="outline"
                    onPress={onRetry}
                    style={styles.retryButton}
                >
                    {retryText}
                </CustomButton>
            )}
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: theme.spacing.xl,
    },
    title: {
        fontSize: theme.fontSize.lg,
        fontWeight: theme.fontWeight.bold,
        color: theme.colors.text.primary,
        marginTop: theme.spacing.lg,
        marginBottom: theme.spacing.sm,
        textAlign: 'center',
    },
    message: {
        fontSize: theme.fontSize.md,
        color: theme.colors.text.secondary,
        textAlign: 'center',
        marginBottom: theme.spacing.xl,
    },
    retryButton: {
        marginTop: theme.spacing.md,
    },
})