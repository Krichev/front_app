// src/shared/lib/index.ts

// Game utilities
export {
    GameValidation,
    GameCalculations,
    GameHints,
    GameTimer,
    GamePhaseUtils
} from './gameUtils'

// Types from game utilities
export type {
    Difficulty,
    GamePhase
} from './gameUtils'

// Navigation utilities
export { navigateToTab } from '../../utils/navigation.ts'

// Add validation utilities
export class ValidationUtils {
    /**
     * Validate email format
     */
    static isValidEmail(email: string): boolean {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        return emailRegex.test(email)
    }

    /**
     * Validate password strength
     */
    static isValidPassword(password: string): { isValid: boolean; errors: string[] } {
        const errors: string[] = []

        if (password.length < 8) {
            errors.push('Password must be at least 8 characters long')
        }

        if (!/[A-Z]/.test(password)) {
            errors.push('Password must contain at least one uppercase letter')
        }

        if (!/[a-z]/.test(password)) {
            errors.push('Password must contain at least one lowercase letter')
        }

        if (!/\d/.test(password)) {
            errors.push('Password must contain at least one number')
        }

        return {
            isValid: errors.length === 0,
            errors
        }
    }

    /**
     * Validate required fields
     */
    static validateRequired(fields: Record<string, any>): { isValid: boolean; errors: Record<string, string> } {
        const errors: Record<string, string> = {}

        Object.entries(fields).forEach(([key, value]) => {
            if (!value || (typeof value === 'string' && !value.trim())) {
                errors[key] = 'This field is required'
            }
        })

        return {
            isValid: Object.keys(errors).length === 0,
            errors
        }
    }

    /**
     * Validate text length
     */
    static validateLength(
        text: string,
        min: number = 0,
        max: number = Infinity
    ): { isValid: boolean; error?: string } {
        if (text.length < min) {
            return {
                isValid: false,
                error: `Must be at least ${min} characters`
            }
        }

        if (text.length > max) {
            return {
                isValid: false,
                error: `Must be no more than ${max} characters`
            }
        }

        return { isValid: true }
    }
}

// Add formatting utilities
export class FormatUtils {
    /**
     * Format date to readable string
     */
    static formatDate(date: string | Date, options?: Intl.DateTimeFormatOptions): string {
        const dateObj = typeof date === 'string' ? new Date(date) : date

        const defaultOptions: Intl.DateTimeFormatOptions = {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        }

        return dateObj.toLocaleDateString('en-US', { ...defaultOptions, ...options })
    }

    /**
     * Format time to readable string
     */
    static formatTime(date: string | Date): string {
        const dateObj = typeof date === 'string' ? new Date(date) : date
        return dateObj.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit'
        })
    }

    /**
     * Format file size to human readable string
     */
    static formatFileSize(bytes: number): string {
        const sizes = ['Bytes', 'KB', 'MB', 'GB']
        if (bytes === 0) return '0 Bytes'

        const i = Math.floor(Math.log(bytes) / Math.log(1024))
        return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i]
    }

    /**
     * Format number with thousand separators
     */
    static formatNumber(num: number): string {
        return num.toLocaleString()
    }

    /**
     * Format percentage
     */
    static formatPercentage(value: number, decimals: number = 1): string {
        return `${value.toFixed(decimals)}%`
    }

    /**
     * Format duration in seconds to MM:SS format
     */
    static formatDuration(seconds: number): string {
        const mins = Math.floor(seconds / 60)
        const secs = seconds % 60
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }

    /**
     * Capitalize first letter of string
     */
    static capitalize(text: string): string {
        return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase()
    }

    /**
     * Truncate text with ellipsis
     */
    static truncateText(text: string, maxLength: number): string {
        if (text.length <= maxLength) return text
        return text.substring(0, maxLength - 3) + '...'
    }
}

// src/shared/lib/index.ts
export * from './permissions';
export * from './validation';
export * from './formatters';
export * from './hooks';