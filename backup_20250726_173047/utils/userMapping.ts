// src/utils/userMapping.ts
// Reusable utility for mapping API responses to our User type

import {User} from '../entities/user/model/types';

// API Response types (what your backend actually returns)
export interface ApiUserResponse {
    id: string;
    name: string;           // API uses 'name' instead of 'username'
    email: string;
    bio?: string;
    avatar?: string;
    created_at?: string;    // API might use snake_case
    updated_at?: string;
    // Add other API-specific fields here
}

export interface ApiLoginResponse {
    token: string;
    user: ApiUserResponse;
    refresh_token?: string; // Some APIs provide separate refresh tokens
}

export interface ApiSignupResponse {
    token: string;
    user: ApiUserResponse;
    refresh_token?: string;
}

// Mapping utilities
export class UserMapper {
    /**
     * Maps API user response to our internal User type
     */
    static mapApiUserToUser(apiUser: ApiUserResponse): User {
        return {
            id: apiUser.id,
            username: apiUser.name,                    // Map 'name' to 'username'
            email: apiUser.email,
            bio: apiUser.bio || undefined,
            avatar: apiUser.avatar || undefined,
            createdAt: apiUser.created_at || new Date().toISOString(),
            updatedAt: apiUser.updated_at || new Date().toISOString(),
            emailVerified: true, // Default to true if not provided
            isActive: true,      // Default to true if not provided
        };
    }

    /**
     * Maps API login response to auth data
     */
    static mapApiLoginResponse(apiResponse: ApiLoginResponse) {
        return {
            accessToken: apiResponse.token,
            refreshToken: apiResponse.refresh_token || apiResponse.token,
            user: this.mapApiUserToUser(apiResponse.user),
        };
    }

    /**
     * Maps API signup response to auth data
     */
    static mapApiSignupResponse(apiResponse: ApiSignupResponse) {
        return {
            accessToken: apiResponse.token,
            refreshToken: apiResponse.refresh_token || apiResponse.token,
            user: this.mapApiUserToUser(apiResponse.user),
        };
    }

    /**
     * Maps our User type back to API format (for updates)
     */
    static mapUserToApiUser(user: User): Partial<ApiUserResponse> {
        return {
            id: user.id,
            name: user.username,        // Map 'username' back to 'name'
            email: user.email,
            bio: user.bio,
            avatar: user.avatar,
            created_at: user.createdAt,
            updated_at: user.updatedAt,
        };
    }

    /**
     * Validates if API user response has required fields
     */
    static validateApiUser(apiUser: any): apiUser is ApiUserResponse {
        return (
            typeof apiUser === 'object' &&
            typeof apiUser.id === 'string' &&
            typeof apiUser.name === 'string' &&
            typeof apiUser.email === 'string'
        );
    }

    /**
     * Safe mapping with validation
     */
    static safeMapApiUserToUser(apiUser: any): User | null {
        if (!this.validateApiUser(apiUser)) {
            console.error('Invalid API user response:', apiUser);
            return null;
        }
        return this.mapApiUserToUser(apiUser);
    }
}

// Type guards
export const isApiLoginResponse = (response: any): response is ApiLoginResponse => {
    return (
        typeof response === 'object' &&
        typeof response.token === 'string' &&
        UserMapper.validateApiUser(response.user)
    );
};

export const isApiSignupResponse = (response: any): response is ApiSignupResponse => {
    return isApiLoginResponse(response); // Same structure
};

// Error handling for mapping
export class UserMappingError extends Error {
    constructor(message: string, public originalData: any) {
        super(`User mapping error: ${message}`);
        this.name = 'UserMappingError';
    }
}

// Usage examples:
/*
// In LoginScreen
try {
    const apiResponse = await login({ username, password }).unwrap();

    if (!isApiLoginResponse(apiResponse)) {
        throw new UserMappingError('Invalid login response format', apiResponse);
    }

    const authData = UserMapper.mapApiLoginResponse(apiResponse);
    dispatch(loginSuccess(authData));
} catch (error) {
    if (error instanceof UserMappingError) {
        console.error('Mapping error:', error.message, error.originalData);
    }
    // Handle error
}

// In SignupScreen
const apiResponse = await signup(userData).unwrap();
const authData = UserMapper.mapApiSignupResponse(apiResponse);
dispatch(loginSuccess(authData));

// In profile update
const apiUserData = UserMapper.mapUserToApiUser(updatedUser);
await updateProfile(apiUserData);
*/