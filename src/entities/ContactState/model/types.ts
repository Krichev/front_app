// src/entities/ContactState/model/types.ts

/**
 * Type of relationship between users
 */
export enum RelationshipType {
    COLLEAGUE = 'COLLEAGUE',
    CLASSMATE = 'CLASSMATE',
    FRIEND = 'FRIEND',
    CLOSE_FRIEND = 'CLOSE_FRIEND',
    FAMILY = 'FAMILY',
    FAMILY_PARENT = 'FAMILY_PARENT',
    FAMILY_SIBLING = 'FAMILY_SIBLING',
    FAMILY_EXTENDED = 'FAMILY_EXTENDED',
    PARTNER = 'PARTNER',
    ACQUAINTANCE = 'ACQUAINTANCE',
    BLOCKED = 'BLOCKED'
}

/**
 * Current status of a relationship request
 */
export enum RelationshipStatus {
    PENDING = 'PENDING',
    ACCEPTED = 'ACCEPTED',
    REJECTED = 'REJECTED'
}

/**
 * Data structure for a user relationship
 */
export interface UserRelationship {
    id: string;
    userId: string;
    relatedUserId: string;
    relatedUserUsername: string;
    relatedUserAvatar?: string;
    relatedUser?: {
        id: string | number;
        username: string;
        avatar?: string;
    };
    relationshipType: RelationshipType;
    status: RelationshipStatus;
    nickname?: string;
    notes?: string;
    isFavorite: boolean;
    createdAt: string;
}

/**
 * Group of contacts
 */
export interface ContactGroup {
    id: string;
    name: string;
    color?: string;
    icon?: string;
    memberCount: number;
}

/**
 * Result of a user search for networking
 */
export interface UserSearchResult {
    id: string;
    username: string;
    avatar?: string;
    bio?: string;
    mutualConnectionsCount: number;
    connectionStatus?: 'NONE' | 'PENDING' | 'ACCEPTED';
}

/**
 * Request to create a new relationship
 */
export interface CreateRelationshipRequest {
    relatedUserId: string | number;
    relationshipType: RelationshipType;
    nickname?: string;
}

/**
 * Request to update an existing relationship
 */
export interface UpdateRelationshipRequest {
    relationshipType?: RelationshipType;
    nickname?: string;
    notes?: string;
    isFavorite?: boolean;
}

/**
 * User privacy and interaction settings
 */
export interface UserPrivacySettings {
    allowRequestsFrom: string;
    showConnections: boolean;
    showMutualConnections: boolean;
}

/**
 * Suggested user based on mutual connections
 */
export interface UserSuggestion {
    id: string;
    username: string;
    avatar?: string;
    mutualConnectionsCount: number;
}

/**
 * Data about a mutual connection
 */
export interface MutualConnection {
    id: string;
    username: string;
    avatar?: string;
}
