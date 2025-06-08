
// src/shared/api/index.ts
export { baseQuery, baseQueryWithReauth } from './base';

// Common API types
export interface PaginatedResponse<T> {
    data: T[];
    total: number;
    page: number;
    limit: number;
}

export interface ApiError {
    message: string;
    code?: string;
    details?: any;
}

export interface ApiResponse<T> {
    success: boolean;
    data?: T;
    error?: ApiError;
}