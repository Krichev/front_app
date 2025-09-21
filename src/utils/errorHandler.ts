// utils/errorHandler.ts
import {FetchBaseQueryError} from '@reduxjs/toolkit/query';

export function isFetchBaseQueryError(error: unknown): error is FetchBaseQueryError {
    return (
        typeof error === 'object' &&
        error != null &&
        'status' in error
    );
}


export interface ErrorResult {
    title: string;
    message: string;
    action?: 'retry' | 'login' | 'none';
}

export class ErrorHandler {
    static handleError(error: any): ErrorResult {
        // Handle RTK Query fetch errors
        if (isFetchBaseQueryError(error)) {
            return this.handleFetchError(error);
        }

        // Handle serialized errors (usually network/timeout)
        if (error && typeof error === 'object' && 'message' in error) {
            return {
                title: 'Network Error',
                message: error.message || 'Please check your connection and try again',
                action: 'retry'
            };
        }

        // Fallback for unknown errors
        return {
            title: 'Unexpected Error',
            message: 'Something went wrong. Please try again.',
            action: 'retry'
        };
    }

    private static handleFetchError(error: any): ErrorResult {
        const status = error.status;

        // Handle specific HTTP status codes
        switch (status) {
            case 400:
                return {
                    title: 'Invalid Request',
                    message: this.extractErrorMessage(error) || 'Please check your input and try again',
                    action: 'none'
                };

            case 401:
                return {
                    title: 'Authentication Required',
                    message: 'Your session has expired. Please log in again.',
                    action: 'login'
                };

            case 403:
                return {
                    title: 'Access Denied',
                    message: 'You don\'t have permission to perform this action',
                    action: 'none'
                };

            case 404:
                return {
                    title: 'Not Found',
                    message: 'The requested item could not be found',
                    action: 'none'
                };

            case 409:
                return {
                    title: 'Conflict',
                    message: this.extractErrorMessage(error) || 'This action conflicts with existing data',
                    action: 'none'
                };

            case 429:
                return {
                    title: 'Too Many Requests',
                    message: 'You\'re doing that too often. Please wait a moment and try again.',
                    action: 'retry'
                };

            case 500:
            case 502:
            case 503:
            case 504:
                return {
                    title: 'Server Error',
                    message: 'Our servers are having trouble. Please try again in a few moments.',
                    action: 'retry'
                };

            case 'FETCH_ERROR':
                return {
                    title: 'Connection Error',
                    message: 'Unable to connect to our servers. Please check your internet connection.',
                    action: 'retry'
                };

            case 'TIMEOUT_ERROR':
                return {
                    title: 'Request Timeout',
                    message: 'The request took too long. Please try again.',
                    action: 'retry'
                };

            case 'PARSING_ERROR':
                return {
                    title: 'Data Error',
                    message: 'There was a problem processing the server response.',
                    action: 'retry'
                };

            default:
                return {
                    title: 'Network Error',
                    message: this.extractErrorMessage(error) || `Request failed (${status})`,
                    action: 'retry'
                };
        }
    }

    private static extractErrorMessage(error: any): string | null {
        try {
            if (error.data) {
                // Common error message patterns
                if (typeof error.data === 'string') {
                    return error.data;
                }

                if (typeof error.data === 'object') {
                    return error.data.message ||
                        error.data.error ||
                        error.data.details ||
                        null;
                }
            }
            return null;
        } catch {
            return null;
        }
    }

    // Specific handlers for common scenarios in your app
    static handleAuthError(error: any): ErrorResult {
        const result = this.handleError(error);

        if (isFetchBaseQueryError(error)) {
            switch (error.status) {
                case 401:
                    return {
                        title: 'Login Failed',
                        message: 'Invalid email or password',
                        action: 'none'
                    };
                case 429:
                    return {
                        title: 'Too Many Attempts',
                        message: 'Too many login attempts. Please wait before trying again.',
                        action: 'retry'
                    };
            }
        }

        return result;
    }

    static handleChallengeError(error: any): ErrorResult {
        const result = this.handleError(error);

        if (isFetchBaseQueryError(error)) {
            switch (error.status) {
                case 404:
                    return {
                        title: 'Challenge Not Found',
                        message: 'This challenge may have been deleted or you don\'t have access to it',
                        action: 'none'
                    };
                case 409:
                    return {
                        title: 'Already Joined',
                        message: 'You\'ve already joined this challenge',
                        action: 'none'
                    };
            }
        }

        return result;
    }

    static handleUploadError(error: any): ErrorResult {
        const result = this.handleError(error);

        if (isFetchBaseQueryError(error)) {
            switch (error.status) {
                case 413:
                    return {
                        title: 'File Too Large',
                        message: 'Please choose a smaller image',
                        action: 'none'
                    };
                case 415:
                    return {
                        title: 'Invalid File Type',
                        message: 'Please upload a valid image file',
                        action: 'none'
                    };
            }
        }

        return result;
    }
}