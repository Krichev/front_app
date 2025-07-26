// src/shared/ui/Modal/Modal.tsx
import React from 'react'
import {Modal as RNModal, Platform, StatusBar, StyleSheet, Text, TouchableOpacity, View, ViewStyle,} from 'react-native'
import {theme} from '../../styles/theme'
import {CustomIcon} from "../../components/Icon/CustomIcon.tsx";

interface ModalProps {
    visible: boolean
    onClose: () => void
    title?: string
    children: React.ReactNode
    actions?: React.ReactNode
    size?: 'sm' | 'md' | 'lg' | 'full'
    showCloseButton?: boolean
    style?: ViewStyle
}

export const CustomModal: React.FC<ModalProps> = ({
                                                visible,
                                                onClose,
                                                title,
                                                children,
                                                actions,
                                                size = 'md',
                                                showCloseButton = true,
                                                style
                                            }) => {
    return (
        <RNModal
            visible={visible}
            transparent
            animationType="fade"
            statusBarTranslucent={Platform.OS === 'android'}
        >
            <StatusBar backgroundColor="rgba(0,0,0,0.5)" />
            <View style={styles.overlay}>
                <View style={[styles.modal, styles[size], style]}>
                    {(title || showCloseButton) && (
                        <View style={styles.header}>
                            {title && <Text style={styles.title}>{title}</Text>}
                            {showCloseButton && (
                                <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                                    <CustomIcon name="close" size={24} color={theme.colors.text.secondary} />
                                </TouchableOpacity>
                            )}
                        </View>
                    )}

                    <View style={styles.content}>
                        {children}
                    </View>

                    {actions && (
                        <View style={styles.actions}>
                            {actions}
                        </View>
                    )}
                </View>
            </View>
        </RNModal>
    )
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: theme.colors.overlay,
        justifyContent: 'center',
        alignItems: 'center',
        padding: theme.spacing.lg,
    },
    modal: {
        backgroundColor: theme.colors.surface,
        borderRadius: theme.borderRadius.lg,
        ...theme.shadow.large,
    },

    // Sizes
    sm: {
        width: '70%',
        maxWidth: 300,
    },
    md: {
        width: '85%',
        maxWidth: 400,
    },
    lg: {
        width: '95%',
        maxWidth: 600,
    },
    full: {
        width: '95%',
        height: '90%',
    },

    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: theme.spacing.lg,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.borderLight,
    },
    title: {
        fontSize: theme.fontSize.lg,
        fontWeight: theme.fontWeight.bold,
        color: theme.colors.text.primary,
        flex: 1,
    },
    closeButton: {
        padding: theme.spacing.xs,
    },
    content: {
        padding: theme.spacing.lg,
    },
    actions: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        padding: theme.spacing.lg,
        borderTopWidth: 1,
        borderTopColor: theme.colors.borderLight,
    },
})