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
            day: 'numeric',
        }

        return dateObj.toLocaleDateString('en-US', options || defaultOptions)
    }

    /**
     * Format date and time
     */
    static formatDateTime(date: string | Date): string {
        const dateObj = typeof date === 'string' ? new Date(date) : date

        return dateObj.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        })
    }

    /**
     * Format time duration
     */
    static formatDuration(seconds: number): string {
        const hours = Math.floor(seconds / 3600)
        const minutes = Math.floor((seconds % 3600) / 60)
        const remainingSeconds = seconds % 60

        if (hours > 0) {
            return `${hours}h ${minutes}m ${remainingSeconds}s`
        } else if (minutes > 0) {
            return `${minutes}m ${remainingSeconds}s`
        } else {
            return `${remainingSeconds}s`
        }
    }

    /**
     * Format percentage
     */
    static formatPercentage(value: number, decimals: number = 0): string {
        return `${value.toFixed(decimals)}%`
    }

    /**
     * Format number with separators
     */
    static formatNumber(num: number): string {
        return new Intl.NumberFormat('en-US').format(num)
    }

    /**
     * Truncate text with ellipsis
     */
    static truncateText(text: string, maxLength: number): string {
        if (!text || text.length <= maxLength) return text
        return `${text.substring(0, maxLength)}...`
    }

    /**
     * Capitalize first letter
     */
    static capitalize(text: string): string {
        if (!text) return ''
        return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase()
    }

    /**
     * Convert camelCase to Title Case
     */
    static camelToTitle(text: string): string {
        if (!text) return ''

        return text
            .replace(/([A-Z])/g, ' $1')
            .replace(/^./, (str) => str.toUpperCase())
    }
}

// Add async utilities
export class AsyncUtils {
    /**
     * Create a delay promise
     */
    static delay(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms))
    }

    /**
     * Retry an async operation
     */
    static async retry<T>(
        operation: () => Promise<T>,
        maxAttempts: number = 3,
        delayMs: number = 1000
    ): Promise<T> {
        let lastError: Error

        for (let attempt = 1; attempt <= maxAttempts; attempt++) {
            try {
                return await operation()
            } catch (error) {
                lastError = error as Error

                if (attempt === maxAttempts) {
                    throw lastError
                }

                await this.delay(delayMs * attempt) // Exponential backoff
            }
        }

        throw lastError!
    }

    /**
     * Create a timeout promise
     */
    static timeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
        return Promise.race([
            promise,
            new Promise<never>((_, reject) =>
                setTimeout(() => reject(new Error('Operation timed out')), timeoutMs)
            )
        ])
    }
}