// src/entities/TopicState/model/types/topic.types.ts

/**
 * Validation status enum - matches backend
 */
export enum ValidationStatus {
    DRAFT = 'DRAFT',
    PENDING = 'PENDING',
    APPROVED = 'APPROVED',
    REJECTED = 'REJECTED',
    AUTO_APPROVED = 'AUTO_APPROVED'
}

/**
 * Topic tree node interface
 */
export interface Topic {
    id: number;
    name: string;
    originalName?: string;
    slug: string;
    description?: string;
    originalDescription?: string;
    parentId?: number;
    parentName?: string;
    path: string;           // e.g., "/1/5/23/"
    depth: number;          // 0 = root, 1 = child, etc.
    isSystemTopic: boolean;
    validationStatus: ValidationStatus;
    questionCount: number;
    childCount: number;
    children?: Topic[];     // For tree responses
    creatorId?: number;
    createdAt: string;
    validatedAt?: string;
}

/**
 * Flattened topic for list displays
 */
export interface FlattenedTopic extends Topic {
    isExpanded?: boolean;
    isVisible?: boolean;
    level: number;  // Same as depth, for rendering indentation
}

/**
 * Create topic request
 */
export interface CreateTopicRequest {
    name: string;
    description?: string;
    parentId?: number;
}

/**
 * Topic tree response (recursive)
 */
export interface TopicTreeNode {
    id: number;
    name: string;
    slug: string;
    questionCount: number;
    validationStatus: ValidationStatus;
    children: TopicTreeNode[];
}

/**
 * Selectable topics response (flat list of topics user can pick)
 */
export interface SelectableTopic {
    id: number;
    name: string;
    fullPath: string;  // "Geography > Geology > Minerals"
    depth: number;
    validationStatus: ValidationStatus;
    isOwn: boolean;    // true if user created this topic
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

export const getValidationStatusLabel = (status: ValidationStatus): string => {
    switch (status) {
        case ValidationStatus.DRAFT: return 'Draft';
        case ValidationStatus.PENDING: return 'Awaiting Review';
        case ValidationStatus.APPROVED: return 'Approved';
        case ValidationStatus.REJECTED: return 'Rejected';
        case ValidationStatus.AUTO_APPROVED: return 'Auto-Approved';
        default: return status;
    }
};

export const getValidationStatusColor = (status: ValidationStatus): string => {
    switch (status) {
        case ValidationStatus.DRAFT: return '#9E9E9E';      // Gray
        case ValidationStatus.PENDING: return '#FF9800';    // Orange
        case ValidationStatus.APPROVED: return '#4CAF50';   // Green
        case ValidationStatus.REJECTED: return '#F44336';   // Red
        case ValidationStatus.AUTO_APPROVED: return '#2196F3'; // Blue
        default: return '#9E9E9E';
    }
};

export const getValidationStatusIcon = (status: ValidationStatus): string => {
    switch (status) {
        case ValidationStatus.DRAFT: return 'file-edit-outline';
        case ValidationStatus.PENDING: return 'clock-outline';
        case ValidationStatus.APPROVED: return 'check-circle';
        case ValidationStatus.REJECTED: return 'close-circle';
        case ValidationStatus.AUTO_APPROVED: return 'robot';
        default: return 'help-circle';
    }
};