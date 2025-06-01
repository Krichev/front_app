// src/entities/user/model/types.ts

export interface User {
    id: string;
    username: string;
    email: string;
    bio?: string;
    avatar?: string;
    createdAt: string;
    updatedAt?: string;
}

export interface UserProfile extends User {
    stats?: UserStats;
    preferences?: UserPreferences;
}

export interface UserStats {
    challengesCompleted: number;
    challengesCreated: number;
    successRate: number;
    totalPoints: number;
    streak: number;
    badges: Badge[];
}

export interface Badge {
    id: string;
    name: string;
    description: string;
    icon: string;
    earnedAt: string;
}

export interface UserPreferences {
    theme: 'light' | 'dark' | 'auto';
    notifications: {
        push: boolean;
        email: boolean;
        challenges: boolean;
        games: boolean;
    };
    privacy: {
        profileVisibility: 'public' | 'friends' | 'private';
        showStats: boolean;
        showBadges: boolean;
    };
    gameSettings: {
        defaultDifficulty: 'Easy' | 'Medium' | 'Hard';
        enableVoice: boolean;
        enableAI: boolean;
    };
}

export interface UpdateUserProfileRequest {
    username?: string;
    bio?: string;
    avatar?: string;
    preferences?: Partial<UserPreferences>;
}

export interface UserSearchFilters {
    query?: string;
    skills?: string[];
    location?: string;
    limit?: number;
}