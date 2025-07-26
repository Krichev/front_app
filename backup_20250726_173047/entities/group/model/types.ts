// src/entities/group/model/types.ts
export type GroupType = 'CHALLENGE' | 'SOCIAL' | 'STUDY' | 'GAMING';

export type GroupPrivacy = 'PUBLIC' | 'PRIVATE' | 'INVITATION_ONLY';

export type GroupRole = 'ADMIN' | 'MODERATOR' | 'MEMBER';

export interface Group {
    id: string;
    name: string;
    description: string;
    type: GroupType;
    privacy: GroupPrivacy;
    memberCount: number;
    createdAt: string;
    updatedAt: string;
    creatorId: string;
    avatar?: string;
    tags: string[];

    // User context
    userRole?: GroupRole;
    userIsMember?: boolean;
}

export interface GroupMember {
    id: string;
    userId: string;
    groupId: string;
    role: GroupRole;
    joinedAt: string;
    user: {
        id: string;
        username: string;
        avatar?: string;
    };
}

export interface CreateGroupRequest {
    name: string;
    description: string;
    type: GroupType;
    privacy: GroupPrivacy;
    tags?: string[];
    avatar?: string;
}

export interface GroupFilters {
    type?: GroupType;
    privacy?: GroupPrivacy;
    search?: string;
    tags?: string[];
    memberUserId?: string;
    creatorId?: string;
    limit?: number;
}

export interface JoinGroupRequest {
    groupId: string;
    message?: string;
}


