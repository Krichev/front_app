// src/entities/challenge/ui/challenge-status-badge.tsx
import React from 'react';
import {Badge} from '../../../shared/ui';
import {ChallengeStatus} from "../model/type.ts";

interface ChallengeStatusBadgeProps {
    status: ChallengeStatus;
    size?: 'sm' | 'md';
}

export const ChallengeStatusBadge: React.FC<ChallengeStatusBadgeProps> = ({
                                                                              status,
                                                                              size = 'sm',
                                                                          }) => {
    const getStatusConfig = (status: ChallengeStatus) => {
        switch (status) {
            case 'OPEN':
                return {
                    text: 'Open',
                    variant: 'success' as const,
                };
            case 'IN_PROGRESS':
                return {
                    text: 'In Progress',
                    variant: 'warning' as const,
                };
            case 'COMPLETED':
                return {
                    text: 'Completed',
                    variant: 'primary' as const,
                };
            case 'FAILED':
                return {
                    text: 'Failed',
                    variant: 'error' as const,
                };
            case 'CANCELLED':
                return {
                    text: 'Cancelled',
                    variant: 'neutral' as const,
                };
            default:
                return {
                    text: status,
                    variant: 'neutral' as const,
                };
        }
    };

    const config = getStatusConfig(status);

    return (
        <Badge
            text={config.text}
            variant={config.variant}
            size={size}
        />
    );
};