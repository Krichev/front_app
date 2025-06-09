// src/features/challenge-verification/ui/VerificationProgress.tsx
import React from 'react';
import {StyleSheet, Text, View} from 'react-native';
import {MaterialCommunityIcons} from '@expo/vector-icons';
import type {VerificationStep} from '../model/types';

interface VerificationProgressProps {
    steps: VerificationStep[];
    currentStepIndex: number;
    progress: number;
}

export const VerificationProgress: React.FC<VerificationProgressProps> = ({
                                                                              steps,
                                                                              currentStepIndex,
                                                                              progress,
                                                                          }) => {
    return (
        <View style={styles.container}>
            <View style={styles.progressHeader}>
                <Text style={styles.progressText}>
                    Step {Math.min(currentStepIndex + 1, steps.length)} of {steps.length}
                </Text>
                <Text style={styles.progressPercentage}>{Math.round(progress)}%</Text>
            </View>

            <View style={styles.progressBarContainer}>
                <View style={styles.progressBarBackground}>
                    <View style={[styles.progressBarFill, { width: `${progress}%` }]} />
                </View>
            </View>

            <View style={styles.stepsContainer}>
                {steps.map((step, index) => (
                    <View key={step.id} style={styles.stepIndicator}>
                        <View style={[
                            styles.stepCircle,
                            step.isCompleted && styles.completedStep,
                            index === currentStepIndex && !step.isCompleted && styles.activeStep,
                            step.error && styles.errorStep,
                        ]}>
                            {step.isCompleted ? (
                                <MaterialCommunityIcons name="check" size={12} color="white" />
                            ) : step.error ? (
                                <MaterialCommunityIcons name="close" size={12} color="white" />
                            ) : (
                                <Text style={styles.stepNumber}>{index + 1}</Text>
                            )}
                        </View>
                        {index < steps.length - 1 && (
                            <View style={[
                                styles.stepConnector,
                                step.isCompleted && styles.completedConnector,
                            ]} />
                        )}
                    </View>
                ))}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: 'white',
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    progressHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    progressText: {
        fontSize: 14,
        fontWeight: '500',
        color: '#333',
    },
    progressPercentage: {
        fontSize: 14,
        fontWeight: '600',
        color: '#4dabf7',
    },
    progressBarContainer: {
        marginBottom: 16,
    },
    progressBarBackground: {
        height: 6,
        backgroundColor: '#f0f0f0',
        borderRadius: 3,
        overflow: 'hidden',
    },
    progressBarFill: {
        height: '100%',
        backgroundColor: '#4dabf7',
        borderRadius: 3,
    },
    stepsContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    stepIndicator: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    stepCircle: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: '#e0e0e0',
        justifyContent: 'center',
        alignItems: 'center',
    },
    completedStep: {
        backgroundColor: '#51cf66',
    },
    activeStep: {
        backgroundColor: '#4dabf7',
    },
    errorStep: {
        backgroundColor: '#ff4444',
    },
    stepNumber: {
        fontSize: 12,
        fontWeight: '600',
        color: '#666',
    },
    stepConnector: {
        width: 24,
        height: 2,
        backgroundColor: '#e0e0e0',
        marginHorizontal: 4,
    },
    completedConnector: {
        backgroundColor: '#51cf66',
    },
});