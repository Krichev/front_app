// src/features/challenge-verification/ui/VerificationMethodSelector.tsx
import React from 'react';
import {ActivityIndicator, StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import {MaterialCommunityIcons} from '@expo/vector-icons';
import type {VerificationStep} from '../model/types';

interface VerificationMethodSelectorProps {
    step: VerificationStep;
    isActive: boolean;
    isProcessing: boolean;
    onExecute: (method: string) => void;
    onRetry: () => void;
}

export const VerificationMethodSelector: React.FC<VerificationMethodSelectorProps> = ({
                                                                                          step,
                                                                                          isActive,
                                                                                          isProcessing,
                                                                                          onExecute,
                                                                                          onRetry,
                                                                                      }) => {
    const getMethodIcon = (method: string) => {
        const icons: Record<string, string> = {
            photo: 'camera',
            location: 'map-marker',
            audio: 'microphone',
            video: 'video',
            manual: 'pencil',
            qr_code: 'qrcode-scan',
            biometric: 'fingerprint',
        };
        return icons[method] || 'help-circle';
    };

    const getStatusColor = () => {
        if (step.error) return '#ff4444';
        if (step.isCompleted) return '#51cf66';
        if (isActive) return '#4dabf7';
        return '#e0e0e0';
    };

    const getStatusIcon = () => {
        if (step.error) return 'alert-circle';
        if (step.isCompleted) return 'check-circle';
        if (isActive && isProcessing) return null; // Show loading
        return 'chevron-right';
    };

    return (
        <View style={[styles.container, { borderLeftColor: getStatusColor() }]}>
            <View style={styles.iconContainer}>
                <MaterialCommunityIcons
                    name={getMethodIcon(step.method)}
                    size={24}
                    color={getStatusColor()}
                />
            </View>

            <View style={styles.content}>
                <Text style={styles.title}>{step.title}</Text>
                <Text style={styles.description}>{step.description}</Text>

                {step.error && (
                    <Text style={styles.errorText}>{step.error}</Text>
                )}
            </View>

            <View style={styles.actions}>
                {step.isCompleted ? (
                    <MaterialCommunityIcons name="check-circle" size={24} color="#51cf66" />
                ) : step.error ? (
                    <TouchableOpacity
                        style={styles.retryButton}
                        onPress={onRetry}
                        disabled={isProcessing}
                    >
                        <MaterialCommunityIcons name="refresh" size={20} color="#4dabf7" />
                        <Text style={styles.retryText}>Retry</Text>
                    </TouchableOpacity>
                ) : isActive && isProcessing ? (
                    <ActivityIndicator size="small" color="#4dabf7" />
                ) : (
                    <TouchableOpacity
                        style={[
                            styles.executeButton,
                            !isActive && styles.disabledButton,
                        ]}
                        onPress={() => onExecute(step.method)}
                        disabled={!isActive || isProcessing}
                    >
                        <Text style={[
                            styles.executeButtonText,
                            !isActive && styles.disabledButtonText,
                        ]}>
                            {isActive ? 'Start' : 'Waiting'}
                        </Text>
                        <MaterialCommunityIcons
                            name={getStatusIcon() || 'chevron-right'}
                            size={16}
                            color={isActive ? '#4dabf7' : '#ccc'}
                        />
                    </TouchableOpacity>
                )}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'white',
        padding: 16,
        borderRadius: 12,
        marginBottom: 12,
        borderLeftWidth: 4,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.22,
        shadowRadius: 2.22,
    },
    iconContainer: {
        marginRight: 16,
    },
    content: {
        flex: 1,
    },
    title: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginBottom: 4,
    },
    description: {
        fontSize: 14,
        color: '#666',
        lineHeight: 20,
    },
    errorText: {
        fontSize: 12,
        color: '#ff4444',
        marginTop: 4,
        fontStyle: 'italic',
    },
    actions: {
        alignItems: 'center',
    },
    executeButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 6,
        borderWidth: 1,
        borderColor: '#4dabf7',
        gap: 4,
    },
    disabledButton: {
        borderColor: '#ccc',
    },
    executeButtonText: {
        fontSize: 14,
        fontWeight: '500',
        color: '#4dabf7',
    },
    disabledButtonText: {
        color: '#ccc',
    },
    retryButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 8,
        paddingVertical: 4,
        gap: 4,
    },
    retryText: {
        fontSize: 12,
        color: '#4dabf7',
        fontWeight: '500',
    },
});