// src/shared/types/media.ts

/**
 * Types of media supported in the application
 */
export const MediaType = {
    IMAGE: 'IMAGE',
    VIDEO: 'VIDEO',
    AUDIO: 'AUDIO'
} as const;

export type MediaType = keyof typeof MediaType;

/**
 * List of all media types
 */
export const MEDIA_TYPES: MediaType[] = ['IMAGE', 'VIDEO', 'AUDIO'];
