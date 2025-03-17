/**
 * Service for handling various formatting tasks across the app
 */
export class FormatterService {
    /**
     * Format currency amount
     * @param {number} amount - Amount to format
     * @param {string} currency - Currency code (default: USD)
     * @returns {string} Formatted currency string
     */
    static formatCurrency(amount: number, currency: string = 'USD'): string {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: currency,
        }).format(amount);
    }

    /**
     * Format date to a readable string
     * @param {string|Date} date - Date to format
     * @param {object} options - Formatting options
     * @returns {string} Formatted date string
     */
    static formatDate(date: string | Date, options?: Intl.DateTimeFormatOptions): string {
        const dateObj = typeof date === 'string' ? new Date(date) : date;

        const defaultOptions: Intl.DateTimeFormatOptions = {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        };

        return dateObj.toLocaleDateString('en-US', options || defaultOptions);
    }

    /**
     * Format date and time
     * @param {string|Date} date - Date to format
     * @returns {string} Formatted date and time string
     */
    static formatDateTime(date: string | Date): string {
        const dateObj = typeof date === 'string' ? new Date(date) : date;

        return dateObj.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    }

    /**
     * Format relative time (e.g., "2 days ago", "in 3 hours")
     * @param {string|Date} date - Date to format
     * @returns {string} Relative time string
     */
    static formatRelativeTime(date: string | Date): string {
        const dateObj = typeof date === 'string' ? new Date(date) : date;
        const now = new Date();

        const diffTime = dateObj.getTime() - now.getTime();
        const diffSeconds = Math.floor(Math.abs(diffTime) / 1000);
        const isInPast = diffTime < 0;

        // Less than a minute
        if (diffSeconds < 60) {
            return isInPast ? 'just now' : 'in a few seconds';
        }

        // Less than an hour
        if (diffSeconds < 3600) {
            const minutes = Math.floor(diffSeconds / 60);
            return isInPast
                ? `${minutes} minute${minutes !== 1 ? 's' : ''} ago`
                : `in ${minutes} minute${minutes !== 1 ? 's' : ''}`;
        }

        // Less than a day
        if (diffSeconds < 86400) {
            const hours = Math.floor(diffSeconds / 3600);
            return isInPast
                ? `${hours} hour${hours !== 1 ? 's' : ''} ago`
                : `in ${hours} hour${hours !== 1 ? 's' : ''}`;
        }

        // Less than a week
        if (diffSeconds < 604800) {
            const days = Math.floor(diffSeconds / 86400);
            return isInPast
                ? `${days} day${days !== 1 ? 's' : ''} ago`
                : `in ${days} day${days !== 1 ? 's' : ''}`;
        }

        // Less than a month
        if (diffSeconds < 2592000) {
            const weeks = Math.floor(diffSeconds / 604800);
            return isInPast
                ? `${weeks} week${weeks !== 1 ? 's' : ''} ago`
                : `in ${weeks} week${weeks !== 1 ? 's' : ''}`;
        }

        // Format as regular date for older dates
        return this.formatDate(dateObj);
    }

    /**
     * Format number with thousands separators
     * @param {number} num - Number to format
     * @returns {string} Formatted number string
     */
    static formatNumber(num: number): string {
        return new Intl.NumberFormat('en-US').format(num);
    }

    /**
     * Format percentage
     * @param {number} value - Percentage value (0-100)
     * @param {number} decimals - Number of decimal places
     * @returns {string} Formatted percentage string
     */
    static formatPercentage(value: number, decimals: number = 0): string {
        return `${value.toFixed(decimals)}%`;
    }

    /**
     * Format file size
     * @param {number} bytes - Size in bytes
     * @returns {string} Formatted file size string
     */
    static formatFileSize(bytes: number): string {
        if (bytes === 0) return '0 Bytes';

        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));

        return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
    }

    /**
     * Format phone number
     * @param {string} phone - Phone number
     * @returns {string} Formatted phone number
     */
    static formatPhoneNumber(phone: string): string {
        // Remove non-numeric characters
        const cleaned = phone.replace(/\D/g, '');

        // Check if it's a US number
        if (cleaned.length === 10) {
            return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
        }

        // International number handling
        if (cleaned.length > 10) {
            return `+${cleaned.slice(0, cleaned.length - 10)} (${cleaned.slice(-10, -7)}) ${cleaned.slice(-7, -4)}-${cleaned.slice(-4)}`;
        }

        // Return original if format can't be determined
        return phone;
    }

    /**
     * Truncate text with ellipsis
     * @param {string} text - Text to truncate
     * @param {number} maxLength - Maximum length
     * @returns {string} Truncated text
     */
    static truncateText(text: string, maxLength: number): string {
        if (!text || text.length <= maxLength) return text;
        return `${text.substring(0, maxLength)}...`;
    }

    /**
     * Convert camelCase to Title Case
     * @param {string} text - camelCase text
     * @returns {string} Title Case text
     */
    static camelCaseToTitleCase(text: string): string {
        if (!text) return '';

        // Add space before capital letters and capitalize the first letter
        const result = text
            .replace(/([A-Z])/g, ' $1')
            .replace(/^./, (str) => str.toUpperCase());

        return result;
    }

    /**
     * Format username (first letter of each word capitalized)
     * @param {string} username - Username to format
     * @returns {string} Formatted username
     */
    static formatUsername(username: string): string {
        if (!username) return '';

        return username
            .split(/[\s_-]+/)
            .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
            .join(' ');
    }
}