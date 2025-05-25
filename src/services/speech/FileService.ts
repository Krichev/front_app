// src/services/FileService.ts
import {Alert, PermissionsAndroid, Platform} from 'react-native';
import {
    CameraOptions,
    ImageLibraryOptions,
    ImagePickerResponse,
    launchCamera,
    launchImageLibrary,
    MediaType,
    PhotoQuality
} from 'react-native-image-picker';

// Type definitions
export interface FileInfo {
    name: string;
    size: number;
    type?: string;
    uri: string;
    ctime?: number | Date | string; // Creation time
    mtime?: number | Date | string; // Modified time
    width?: number;
    height?: number;
}

export interface ProcessedFileInfo {
    name: string;
    size: number;
    type: string;
    uri: string;
    createdAt: string;
    modifiedAt: string;
    width?: number;
    height?: number;
    sizeFormatted: string;
    isImage: boolean;
    isVideo: boolean;
    extension: string;
}

export interface UploadProgress {
    loaded: number;
    total: number;
    percentage: number;
}

export interface FilePickerOptions {
    mediaType?: MediaType;
    allowsEditing?: boolean;
    quality?: PhotoQuality;
    maxWidth?: number;
    maxHeight?: number;
    includeBase64?: boolean;
}

export interface FileUploadOptions {
    url: string;
    headers?: Record<string, string>;
    method?: 'POST' | 'PUT' | 'PATCH';
    fieldName?: string;
    onProgress?: (progress: UploadProgress) => void;
}

export class FileService {
    // File size limits (in bytes)
    static readonly MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB
    static readonly MAX_VIDEO_SIZE = 100 * 1024 * 1024; // 100MB
    static readonly MAX_DOCUMENT_SIZE = 50 * 1024 * 1024; // 50MB

    // Supported file types
    static readonly SUPPORTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    static readonly SUPPORTED_VIDEO_TYPES = ['video/mp4', 'video/mov', 'video/avi'];
    static readonly SUPPORTED_DOCUMENT_TYPES = ['application/pdf', 'text/plain', 'application/msword'];

    /**
     * Safely convert timestamp to ISO string
     */
    private static safeToISOString(timestamp: number | Date | string | undefined): string {
        if (!timestamp) {
            return new Date().toISOString();
        }

        try {
            // If it's already a string, validate it
            if (typeof timestamp === 'string') {
                const date = new Date(timestamp);
                if (!isNaN(date.getTime())) {
                    return date.toISOString();
                }
                return new Date().toISOString();
            }

            // If it's a number (Unix timestamp)
            if (typeof timestamp === 'number') {
                // Handle both seconds and milliseconds timestamps
                const date = timestamp > 1000000000000
                    ? new Date(timestamp)
                    : new Date(timestamp * 1000);
                return date.toISOString();
            }

            // If it's already a Date object
            if (timestamp instanceof Date) {
                return timestamp.toISOString();
            }

            // Fallback to current time
            return new Date().toISOString();
        } catch (error) {
            console.warn('Error converting timestamp to ISO string:', error, 'Value:', timestamp);
            return new Date().toISOString();
        }
    }

    /**
     * Format file size in human readable format
     */
    static formatFileSize(bytes: number): string {
        if (bytes === 0) return '0 Bytes';

        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));

        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    /**
     * Get file extension from filename or URI
     */
    static getFileExtension(filename: string): string {
        if (!filename) return '';
        const lastDot = filename.lastIndexOf('.');
        return lastDot >= 0 ? filename.substring(lastDot + 1).toLowerCase() : '';
    }

    /**
     * Check if file is an image based on type or extension
     */
    static isImage(fileType: string, filename?: string): boolean {
        if (this.SUPPORTED_IMAGE_TYPES.includes(fileType.toLowerCase())) {
            return true;
        }

        if (filename) {
            const ext = this.getFileExtension(filename);
            return ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext);
        }

        return false;
    }

    /**
     * Check if file is a video based on type or extension
     */
    static isVideo(fileType: string, filename?: string): boolean {
        if (this.SUPPORTED_VIDEO_TYPES.includes(fileType.toLowerCase())) {
            return true;
        }

        if (filename) {
            const ext = this.getFileExtension(filename);
            return ['mp4', 'mov', 'avi', 'mkv'].includes(ext);
        }

        return false;
    }

    /**
     * Process and format file information
     */
    static processFileInfo(fileInfo: FileInfo): ProcessedFileInfo {
        const type = fileInfo.type || 'application/octet-stream';
        const extension = this.getFileExtension(fileInfo.name);

        return {
            name: fileInfo.name,
            size: fileInfo.size,
            type,
            uri: fileInfo.uri,
            createdAt: this.safeToISOString(fileInfo.ctime),
            modifiedAt: this.safeToISOString(fileInfo.mtime),
            width: fileInfo.width,
            height: fileInfo.height,
            sizeFormatted: this.formatFileSize(fileInfo.size),
            isImage: this.isImage(type, fileInfo.name),
            isVideo: this.isVideo(type, fileInfo.name),
            extension,
        };
    }

    /**
     * Validate file based on type and size
     */
    static validateFile(fileInfo: ProcessedFileInfo): { isValid: boolean; error?: string } {
        // Check file size limits
        if (fileInfo.isImage && fileInfo.size > this.MAX_IMAGE_SIZE) {
            return {
                isValid: false,
                error: `Image size must be less than ${this.formatFileSize(this.MAX_IMAGE_SIZE)}`
            };
        }

        if (fileInfo.isVideo && fileInfo.size > this.MAX_VIDEO_SIZE) {
            return {
                isValid: false,
                error: `Video size must be less than ${this.formatFileSize(this.MAX_VIDEO_SIZE)}`
            };
        }

        if (!fileInfo.isImage && !fileInfo.isVideo && fileInfo.size > this.MAX_DOCUMENT_SIZE) {
            return {
                isValid: false,
                error: `File size must be less than ${this.formatFileSize(this.MAX_DOCUMENT_SIZE)}`
            };
        }

        // Check supported file types
        if (fileInfo.isImage && !this.SUPPORTED_IMAGE_TYPES.includes(fileInfo.type)) {
            return {
                isValid: false,
                error: 'Unsupported image format. Please use JPEG, PNG, GIF, or WebP.'
            };
        }

        return { isValid: true };
    }

    /**
     * Request camera permissions for Android
     */
    static async requestCameraPermission(): Promise<boolean> {
        if (Platform.OS === 'ios') {
            return true; // iOS handles permissions automatically
        }

        try {
            const granted = await PermissionsAndroid.request(
                PermissionsAndroid.PERMISSIONS.CAMERA,
                {
                    title: 'Camera Permission',
                    message: 'App needs access to your camera to take photos',
                    buttonNeutral: 'Ask Me Later',
                    buttonNegative: 'Cancel',
                    buttonPositive: 'OK',
                }
            );
            return granted === PermissionsAndroid.RESULTS.GRANTED;
        } catch (err) {
            console.warn('Camera permission error:', err);
            return false;
        }
    }

    /**
     * Request storage permissions for Android
     */
    static async requestStoragePermission(): Promise<boolean> {
        if (Platform.OS === 'ios') {
            return true; // iOS handles permissions automatically
        }

        try {
            const granted = await PermissionsAndroid.request(
                PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
                {
                    title: 'Storage Permission',
                    message: 'App needs access to your storage to select files',
                    buttonNeutral: 'Ask Me Later',
                    buttonNegative: 'Cancel',
                    buttonPositive: 'OK',
                }
            );
            return granted === PermissionsAndroid.RESULTS.GRANTED;
        } catch (err) {
            console.warn('Storage permission error:', err);
            return false;
        }
    }

    /**
     * Pick image from camera or gallery
     */
    static async pickImage(options: FilePickerOptions = {}): Promise<ProcessedFileInfo | null> {
        const {
            mediaType = 'photo',
            allowsEditing = true,
            quality = 0.8 as PhotoQuality,
            maxWidth = 1920,
            maxHeight = 1080,
            includeBase64 = false,
        } = options;

        return new Promise((resolve) => {
            Alert.alert(
                'Select Image',
                'Choose an option',
                [
                    {
                        text: 'Camera',
                        onPress: async () => {
                            const hasPermission = await this.requestCameraPermission();
                            if (!hasPermission) {
                                Alert.alert('Permission Denied', 'Camera permission is required');
                                resolve(null);
                                return;
                            }

                            const cameraOptions: CameraOptions = {
                                mediaType,
                                quality,
                                maxWidth,
                                maxHeight,
                                includeBase64,
                            };

                            launchCamera(
                                cameraOptions,
                                this.handleImagePickerResponse.bind(this, resolve)
                            );
                        },
                    },
                    {
                        text: 'Gallery',
                        onPress: async () => {
                            const hasPermission = await this.requestStoragePermission();
                            if (!hasPermission) {
                                Alert.alert('Permission Denied', 'Storage permission is required');
                                resolve(null);
                                return;
                            }

                            const libraryOptions: ImageLibraryOptions = {
                                mediaType,
                                quality,
                                maxWidth,
                                maxHeight,
                                includeBase64,
                            };

                            launchImageLibrary(
                                libraryOptions,
                                this.handleImagePickerResponse.bind(this, resolve)
                            );
                        },
                    },
                    {
                        text: 'Cancel',
                        style: 'cancel',
                        onPress: () => resolve(null),
                    },
                ],
                { cancelable: true, onDismiss: () => resolve(null) }
            );
        });
    }

    /**
     * Handle image picker response
     */
    private static handleImagePickerResponse(
        resolve: (value: ProcessedFileInfo | null) => void,
        response: ImagePickerResponse
    ): void {
        if (response.didCancel || response.errorMessage) {
            resolve(null);
            return;
        }

        const asset = response.assets?.[0];
        if (!asset) {
            resolve(null);
            return;
        }

        const fileInfo: FileInfo = {
            name: asset.fileName || `image_${Date.now()}.jpg`,
            size: asset.fileSize || 0,
            type: asset.type || 'image/jpeg',
            uri: asset.uri || '',
            width: asset.width,
            height: asset.height,
            ctime: Date.now(),
            mtime: Date.now(),
        };

        const processedFile = this.processFileInfo(fileInfo);
        const validation = this.validateFile(processedFile);

        if (!validation.isValid) {
            Alert.alert('Invalid File', validation.error || 'File validation failed');
            resolve(null);
            return;
        }

        resolve(processedFile);
    }

    /**
     * Upload file to server
     */
    static async uploadFile(
        file: ProcessedFileInfo,
        options: FileUploadOptions
    ): Promise<{ success: boolean; data?: any; error?: string }> {
        const {
            url,
            headers = {},
            method = 'POST',
            fieldName = 'file',
            onProgress,
        } = options;

        try {
            const formData = new FormData();

            // Append file to form data
            formData.append(fieldName, {
                uri: file.uri,
                type: file.type,
                name: file.name,
            } as any);

            // Create XMLHttpRequest for progress tracking
            return new Promise((resolve) => {
                const xhr = new XMLHttpRequest();

                // Track upload progress
                xhr.upload.addEventListener('progress', (event) => {
                    if (event.lengthComputable && onProgress) {
                        const progress: UploadProgress = {
                            loaded: event.loaded,
                            total: event.total,
                            percentage: Math.round((event.loaded / event.total) * 100),
                        };
                        onProgress(progress);
                    }
                });

                // Handle response
                xhr.addEventListener('load', () => {
                    if (xhr.status >= 200 && xhr.status < 300) {
                        try {
                            const responseData = JSON.parse(xhr.responseText);
                            resolve({ success: true, data: responseData });
                        } catch (parseError) {
                            resolve({ success: true, data: xhr.responseText });
                        }
                    } else {
                        resolve({
                            success: false,
                            error: `Upload failed with status ${xhr.status}: ${xhr.statusText}`,
                        });
                    }
                });

                // Handle errors
                xhr.addEventListener('error', () => {
                    resolve({
                        success: false,
                        error: 'Network error occurred during upload',
                    });
                });

                // Handle timeout
                xhr.addEventListener('timeout', () => {
                    resolve({
                        success: false,
                        error: 'Upload timed out',
                    });
                });

                // Configure and send request
                xhr.open(method, url);
                xhr.timeout = 60000; // 60 seconds timeout

                // Set headers
                Object.entries(headers).forEach(([key, value]) => {
                    xhr.setRequestHeader(key, value);
                });

                xhr.send(formData);
            });
        } catch (error) {
            console.error('Upload error:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown upload error',
            };
        }
    }

    /**
     * Create form data for file upload
     */
    static createFormData(file: ProcessedFileInfo, additionalFields?: Record<string, any>): FormData {
        const formData = new FormData();

        // Add file
        formData.append('file', {
            uri: file.uri,
            type: file.type,
            name: file.name,
        } as any);

        // Add additional fields
        if (additionalFields) {
            Object.entries(additionalFields).forEach(([key, value]) => {
                formData.append(key, value);
            });
        }

        return formData;
    }

    /**
     * Get MIME type from file extension
     */
    static getMimeType(extension: string): string {
        const mimeTypes: Record<string, string> = {
            // Images
            jpg: 'image/jpeg',
            jpeg: 'image/jpeg',
            png: 'image/png',
            gif: 'image/gif',
            webp: 'image/webp',
            bmp: 'image/bmp',
            svg: 'image/svg+xml',

            // Videos
            mp4: 'video/mp4',
            mov: 'video/quicktime',
            avi: 'video/x-msvideo',
            mkv: 'video/x-matroska',

            // Documents
            pdf: 'application/pdf',
            txt: 'text/plain',
            doc: 'application/msword',
            docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            xls: 'application/vnd.ms-excel',
            xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',

            // Audio
            mp3: 'audio/mpeg',
            wav: 'audio/wav',
            aac: 'audio/aac',

            // Archives
            zip: 'application/zip',
            rar: 'application/x-rar-compressed',

            // Default
            default: 'application/octet-stream',
        };

        return mimeTypes[extension.toLowerCase()] || mimeTypes.default;
    }

    /**
     * Compress image (placeholder - would need additional library)
     */
    static async compressImage(
        file: ProcessedFileInfo,
        options: { quality?: number; maxWidth?: number; maxHeight?: number } = {}
    ): Promise<ProcessedFileInfo> {
        // This is a placeholder implementation
        // In a real app, you would use a library like react-native-image-resizer
        console.log('Image compression would happen here:', options);
        return file;
    }

    /**
     * Delete file from device (placeholder)
     */
    static async deleteFile(uri: string): Promise<boolean> {
        try {
            // This would use react-native-fs or similar library
            console.log('File deletion would happen here:', uri);
            return true;
        } catch (error) {
            console.error('Error deleting file:', error);
            return false;
        }
    }

    /**
     * Check if file exists (placeholder)
     */
    static async fileExists(uri: string): Promise<boolean> {
        try {
            // This would use react-native-fs or similar library
            console.log('File existence check would happen here:', uri);
            return true;
        } catch (error) {
            console.error('Error checking file existence:', error);
            return false;
        }
    }

    /**
     * Generate unique filename
     */
    static generateUniqueFilename(originalName: string, prefix: string = ''): string {
        const timestamp = Date.now();
        const random = Math.random().toString(36).substring(2, 8);
        const extension = this.getFileExtension(originalName);
        const baseName = originalName.replace(/\.[^/.]+$/, ''); // Remove extension

        return `${prefix}${baseName}_${timestamp}_${random}.${extension}`;
    }

    /**
     * Format file metadata for display
     */
    static formatFileMetadata(file: ProcessedFileInfo): Record<string, string> {
        return {
            'File Name': file.name,
            'Size': file.sizeFormatted,
            'Type': file.type,
            'Created': new Date(file.createdAt).toLocaleDateString(),
            'Modified': new Date(file.modifiedAt).toLocaleDateString(),
            ...(file.width && file.height && {
                'Dimensions': `${file.width} × ${file.height}`,
            }),
        };
    }
}

export default FileService;