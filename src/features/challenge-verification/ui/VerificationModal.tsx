// src/features/challenge-verification/ui/VerificationModal.tsx
import React from 'react';
import {Modal, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import {MaterialCommunityIcons} from '@expo/vector-icons';
import {VerificationMethodSelector} from './VerificationMethodSelector';
import {VerificationProgress} from './VerificationProgress';
import {useChallengeVerification} from '../lib/hooks';

interface VerificationModalProps {
    challengeTitle?: string;
    onComplete?: () => void;
}

export const VerificationModal: React.FC<VerificationModalProps> = ({
                                                                        challengeTitle = 'Challenge',
                                                                        onComplete,
                                                                    }) => {
    const {
        isModalVisible,
        currentFlow,
        steps,
        currentStep,
        progress,
        canComplete,
        isProcessing,
        error,
        executeStep,
        completeVerification,
        hideModal,
        retryStep,
        clearError,
    } = useChallengeVerification();

    const handleStepExecute = async (stepId: string, method: string) => {
        await executeStep(stepId, method as any);
    };

    const handleComplete = async () => {
        const success = await completeVerification();
        if (success && onComplete) {
            onComplete();
        }
    };

    if (!isModalVisible || !currentFlow) {
        return null;
    }

    return (
        <Modal
            visible={isModalVisible}
            animationType="slide"
            presentationStyle="pageSheet"
        >
            <SafeAreaView style={styles.container}>
                <View style={styles.header}>
                    <View style={styles.headerContent}>
                        <Text style={styles.title}>Verify Challenge</Text>
                        <Text style={styles.subtitle}>{challengeTitle}</Text>
                    </View>
                    <TouchableOpacity onPress={hideModal} style={styles.closeButton}>
                        <MaterialCommunityIcons name="close" size={24} color="#666" />
                    </TouchableOpacity>
                </View>

                <VerificationProgress
                    steps={steps}
                    currentStepIndex={currentFlow.currentStep}
                    progress={progress}
                />

                <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                    {error && (
                        <View style={styles.errorContainer}>
                            <MaterialCommunityIcons name="alert-circle" size={20} color="#ff4444" />
                            <Text style={styles.errorText}>{error}</Text>
                            <TouchableOpacity onPress={clearError} style={styles.errorCloseButton}>
                                <MaterialCommunityIcons name="close" size={16} color="#ff4444" />
                            </TouchableOpacity>
                        </View>
                    )}

                    {steps.map((step) => (
                        <VerificationMethodSelector
                            key={step.id}
                            step={step}
                            isActive={step.id === currentStep?.id}
                            isProcessing={isProcessing}
                            onExecute={(method) => handleStepExecute(step.id, method)}
                            onRetry={() => retryStep(step.id)}
                        />
                    ))}

                    {canComplete && (
                        <TouchableOpacity
                            style={[styles.completeButton, isProcessing && styles.disabledButton]}
                            onPress={handleComplete}
                            disabled={isProcessing}
                        >
                            <MaterialCommunityIcons name="check-circle" size={20} color="white" />
                            <Text style={styles.completeButtonText}>Complete Verification</Text>
                        </TouchableOpacity>
                    )}
                </ScrollView>
            </SafeAreaView>
        </Modal>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f9fa',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 16,
        backgroundColor: 'white',
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
    },
    headerContent: {
        flex: 1,
    },
    title: {
        fontSize: 20,
        fontWeight: '600',
        color: '#333',
    },
    subtitle: {
        fontSize: 14,
        color: '#666',
        marginTop: 2,
    },
    closeButton: {
        padding: 4,
    },
    content: {
        flex: 1,
        paddingHorizontal: 20,
        paddingVertical: 16,
    },
    errorContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#ffebee',
        padding: 12,
        borderRadius: 8,
        marginBottom: 16,
        gap: 8,
    },
    errorText: {
        flex: 1,
        fontSize: 14,
        color: '#c62828',
    },
    errorCloseButton: {
        padding: 4,
    },
    completeButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#51cf66',
        paddingVertical: 16,
        borderRadius: 12,
        marginTop: 24,
        gap: 8,
    },
    disabledButton: {
        backgroundColor: '#ccc',
    },
    completeButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: 'white',
    },
});
