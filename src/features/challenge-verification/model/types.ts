// src/features/challenge-verification/model/types.ts
export interface VerificationFlow {
    challengeId: string;
    requiredMethods: string[];
    currentStep: number;
    totalSteps: number;
    isComplete: boolean;
    data: Record<string, any>;
}

export interface VerificationStep {
    id: string;
    method: string;
    title: string;
    description: string;
    isRequired: boolean;
    isCompleted: boolean;
    data?: any;
    error?: string;
}