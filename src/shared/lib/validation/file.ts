// src/shared/lib/validation/file.ts
export interface FileValidationOptions {
    maxSize?: number; // in bytes
    allowedTypes?: string[];
    allowedExtensions?: string[];
}

export const validateFile = (
    file: { size: number; type?: string; name?: string },
    options: FileValidationOptions = {}
): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];
    const { maxSize, allowedTypes, allowedExtensions } = options;

    // Check file size
    if (maxSize && file.size > maxSize) {
        errors.push(`File size must be less than ${formatFileSize(maxSize)}`);
    }

    // Check file type
    if (allowedTypes && file.type && !allowedTypes.includes(file.type)) {
        errors.push(`File type not allowed. Allowed types: ${allowedTypes.join(', ')}`);
    }

    // Check file extension
    if (allowedExtensions && file.name) {
        const extension = file.name.split('.').pop()?.toLowerCase();
        if (extension && !allowedExtensions.includes(extension)) {
            errors.push(`File extension not allowed. Allowed extensions: ${allowedExtensions.join(', ')}`);
        }
    }

    return {
        isValid: errors.length === 0,
        errors
    };
};

const formatFileSize = (bytes: number): string => {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
};