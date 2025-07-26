// src/entities/user/model/types.ts

export interface User {
    id: string;
    username: string;
    email: string;
    bio?: string;
    avatar?: string;
    createdAt: string;
    updatedAt?: string;
    emailVerified?: boolean;
    phoneNumber?: string;
    firstName?: string;
    lastName?: string;
    dateOfBirth?: string;
    location?: string;
    timezone?: string;
    language?: string;
    isActive?: boolean;
    lastLoginAt?: string;
}

export interface UserProfile extends User {
    stats?: UserStats;
    preferences?: UserPreferences;
    badges?: Badge[];
    followers?: number;
    following?: number;
    isFollowing?: boolean;
    isFollower?: boolean;
    mutualConnections?: number;
    publicProfile?: boolean;
    verificationStatus?: 'unverified' | 'pending' | 'verified';
}

export interface UserStats {
    challengesCompleted: number;
    challengesCreated: number;
    successRate: number;
    totalPoints: number;
    streak: number;
    badges: Badge[];
    questionsAnswered: number;
    questionsCreated: number;
    averageRating: number;
    rank?: number;
    level?: number;
    experience?: number;
    gamesPlayed?: number;
    gamesWon?: number;
    winRate?: number;
}

export interface Badge {
    id: string;
    name: string;
    description: string;
    icon: string;
    earnedAt: string;
    category?: string;
    rarity?: 'common' | 'rare' | 'epic' | 'legendary';
    points?: number;
}

export interface UserPreferences {
    theme: 'light' | 'dark' | 'auto';
    notifications: NotificationPreferences;
    privacy: PrivacyPreferences;
    gameSettings: GamePreferences;
    accessibility?: AccessibilityPreferences;
    language?: string;
    timezone?: string;
    dateFormat?: string;
    timeFormat?: '12h' | '24h';
}

export interface NotificationPreferences {
    push: boolean;
    email: boolean;
    sms?: boolean;
    challenges: boolean;
    games: boolean;
    social: boolean;
    system: boolean;
    marketing?: boolean;
    frequency?: 'instant' | 'daily' | 'weekly' | 'never';
    quietHours?: {
        enabled: boolean;
        start?: string; // HH:MM format
        end?: string;   // HH:MM format
    };
}

export interface PrivacyPreferences {
    profileVisibility: 'public' | 'friends' | 'private';
    showStats: boolean;
    showBadges: boolean;
    showLocation?: boolean;
    showEmail?: boolean;
    showOnlineStatus?: boolean;
    allowDirectMessages?: boolean;
    allowFriendRequests?: boolean;
    showInSearch?: boolean;
    dataCollection?: boolean;
}

export interface GamePreferences {
    defaultDifficulty: 'Easy' | 'Medium' | 'Hard';
    enableVoice: boolean;
    enableAI: boolean;
    autoSave?: boolean;
    soundEffects?: boolean;
    musicVolume?: number;
    soundVolume?: number;
    vibration?: boolean;
    screenKeepAwake?: boolean;
    showHints?: boolean;
    timerPreference?: 'none' | 'visible' | 'hidden';
}

export interface AccessibilityPreferences {
    highContrast?: boolean;
    largeText?: boolean;
    reduceMotion?: boolean;
    screenReader?: boolean;
    colorBlindFriendly?: boolean;
    subtitles?: boolean;
    audioDescriptions?: boolean;
}

export interface UpdateUserProfileRequest {
    username?: string;
    email?: string;
    bio?: string;
    avatar?: string;
    firstName?: string;
    lastName?: string;
    dateOfBirth?: string;
    location?: string;
    timezone?: string;
    language?: string;
    phoneNumber?: string;
    preferences?: Partial<UserPreferences>;
}

export interface UserSearchFilters {
    query?: string;
    skills?: string[];
    location?: string;
    language?: string;
    verified?: boolean;
    online?: boolean;
    minRating?: number;
    maxRating?: number;
    badges?: string[];
    joinedAfter?: string;
    joinedBefore?: string;
    limit?: number;
    offset?: number;
    sortBy?: UserSortField;
    sortOrder?: 'asc' | 'desc';
}

export type UserSortField =
    | 'username'
    | 'createdAt'
    | 'lastLoginAt'
    | 'rating'
    | 'points'
    | 'challengesCompleted'
    | 'successRate';

export interface UserConnection {
    id: string;
    userId: string;
    connectedUserId: string;
    type: 'follower' | 'following' | 'friend';
    status: 'pending' | 'accepted' | 'blocked';
    createdAt: string;
    user?: Pick<User, 'id' | 'username' | 'avatar'>;
}

export interface UserActivity {
    id: string;
    userId: string;
    type: 'challenge_completed' | 'question_created' | 'badge_earned' | 'level_up' | 'game_played';
    description: string;
    metadata?: Record<string, any>;
    points?: number;
    isPublic: boolean;
    createdAt: string;
}

export interface UserSession {
    id: string;
    userId: string;
    deviceType: 'mobile' | 'tablet' | 'desktop' | 'web';
    deviceName?: string;
    ipAddress: string;
    userAgent: string;
    location?: {
        country?: string;
        city?: string;
        region?: string;
    };
    createdAt: string;
    lastActivityAt: string;
    isCurrentSession: boolean;
    isActive: boolean;
}

export interface UserNotification {
    id: string;
    userId: string;
    type: 'challenge_invite' | 'friend_request' | 'achievement' | 'system' | 'game_update';
    title: string;
    message: string;
    data?: Record<string, any>;
    isRead: boolean;
    createdAt: string;
    expiresAt?: string;
    actionUrl?: string;
    imageUrl?: string;
}

export interface UserAchievement {
    id: string;
    userId: string;
    achievementId: string;
    earnedAt: string;
    progress?: number;
    maxProgress?: number;
    achievement: {
        id: string;
        name: string;
        description: string;
        icon: string;
        category: string;
        points: number;
        rarity: 'common' | 'rare' | 'epic' | 'legendary';
        requirements: Record<string, any>;
    };
}

export interface UserDevice {
    id: string;
    userId: string;
    deviceId: string;
    deviceType: 'mobile' | 'tablet' | 'desktop';
    platform: 'ios' | 'android' | 'web' | 'windows' | 'macos' | 'linux';
    deviceName: string;
    appVersion: string;
    osVersion: string;
    pushToken?: string;
    isActive: boolean;
    lastSeenAt: string;
    registeredAt: string;
}

export interface UserAnalytics {
    userId: string;
    totalSessions: number;
    totalPlayTime: number; // in minutes
    averageSessionLength: number; // in minutes
    favoriteGameModes: string[];
    preferredDifficulty: 'Easy' | 'Medium' | 'Hard';
    peakActivityHours: number[];
    weeklyActivity: {
        week: string;
        sessions: number;
        playTime: number;
    }[];
    monthlyProgress: {
        month: string;
        challengesCompleted: number;
        pointsEarned: number;
        badgesEarned: number;
    }[];
}

export interface UserValidation {
    username: {
        isValid: boolean;
        isAvailable: boolean;
        errors: string[];
    };
    email: {
        isValid: boolean;
        isAvailable: boolean;
        isVerified: boolean;
        errors: string[];
    };
    profile: {
        isComplete: boolean;
        completionPercentage: number;
        missingFields: string[];
    };
}

// User creation and update DTOs
export interface CreateUserRequest {
    username: string;
    email: string;
    password: string;
    firstName?: string;
    lastName?: string;
    dateOfBirth?: string;
    acceptTerms: boolean;
    acceptPrivacy: boolean;
    newsletter?: boolean;
}

export interface UserPaginatedResponse {
    users: UserProfile[];
    total: number;
    page: number;
    limit: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
}

// User role and permissions (for admin/moderation)
export interface UserRole {
    id: string;
    name: string;
    description: string;
    permissions: Permission[];
    isDefault: boolean;
    createdAt: string;
}

export type Permission =
    | 'read_users'
    | 'write_users'
    | 'delete_users'
    | 'read_challenges'
    | 'write_challenges'
    | 'delete_challenges'
    | 'read_questions'
    | 'write_questions'
    | 'delete_questions'
    | 'moderate_content'
    | 'admin_panel'
    | 'manage_users'
    | 'manage_system';

// Export commonly used types
export type UserPublic = Pick<User, 'id' | 'username' | 'avatar' | 'bio' | 'createdAt'>;
export type UserMinimal = Pick<User, 'id' | 'username' | 'avatar'>;
export type UserWithStats = User & { stats: UserStats };
export type UserWithPreferences = User & { preferences: UserPreferences };