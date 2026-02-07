// src/services/speech/FileService.ts - COMPLETE VERSION WITH pickAudio
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
import AudioRecord from 'react-native-audio-record';
import DocumentPicker from 'react-native-document-picker';

// Type definitions
export interface FileInfo {
    name: string;
    size: number;
    type?: string;
    uri: string;
    ctime?: number | Date | string;
    mtime?: number | Date | string;
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
    static readonly MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB
    static readonly MAX_VIDEO_SIZE = 100 * 1024 * 1024; // 100MB
    static readonly MAX_AUDIO_SIZE = 50 * 1024 * 1024; // 50MB
    static readonly MAX_DOCUMENT_SIZE = 50 * 1024 * 1024; // 50MB

    static readonly SUPPORTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    static readonly SUPPORTED_VIDEO_TYPES = ['video/mp4', 'video/mov', 'video/avi', 'video/quicktime'];
    static readonly SUPPORTED_AUDIO_TYPES = ['audio/mp3', 'audio/wav', 'audio/aac', 'audio/m4a', 'audio/ogg', 'audio/mpeg'];
    static readonly SUPPORTED_DOCUMENT_TYPES = ['application/pdf', 'text/plain', 'application/msword'];

    // Audio recording state
    private static isRecording = false;
    private static recordingStartTime: number | null = null;

    /**
     * Safely convert timestamp to ISO string
     */
    private static safeToISOString(timestamp: number | Date | string | undefined): string {
        if (!timestamp) {
            return new Date().toISOString();
        }

        try {
            if (typeof timestamp === 'string') {
                const date = new Date(timestamp);
                if (!isNaN(date.getTime())) {
                    return date.toISOString();
                }
                return new Date().toISOString();
            }

            if (typeof timestamp === 'number') {
                const date = timestamp > 1000000000000
                    ? new Date(timestamp)
                    : new Date(timestamp * 1000);
                return date.toISOString();
            }

            if (timestamp instanceof Date) {
                return timestamp.toISOString();
            }

            return new Date().toISOString();
        } catch (error) {
            console.error('Error converting timestamp:', error);
            return new Date().toISOString();
        }
    }

    /**
     * Convert CapturedMedia to ProcessedFileInfo
     */
    static fromCapturedMedia(media: any): ProcessedFileInfo {
        const extension = media.name.split('.').pop() || (media.type.startsWith('image/') ? 'jpg' : 'mp4');
        const isImage = media.type.startsWith('image/');
        const isVideo = media.type.startsWith('video/');

        return {
            name: media.name,
            size: media.size || 0,
            type: media.type,
            uri: media.uri,
            createdAt: new Date().toISOString(),
            modifiedAt: new Date().toISOString(),
            width: media.width,
            height: media.height,
            sizeFormatted: this.formatFileSize(media.size || 0),
            isImage,
            isVideo,
            extension,
        };
    }

    /**
     * Process file information into standardized format
     */
    static processFileInfo(fileInfo: FileInfo): ProcessedFileInfo {
        const extension = this.getFileExtension(fileInfo.name);
        const type = fileInfo.type || this.getMimeType(extension);

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
            isImage: type.startsWith('image/'),
            isVideo: type.startsWith('video/'),
            extension,
        };
    }

    /**
     * Request camera permission
     */
    static async requestCameraPermission(): Promise<boolean> {
        if (Platform.OS !== 'android') return true;

        try {
            const granted = await PermissionsAndroid.request(
                PermissionsAndroid.PERMISSIONS.CAMERA,
                {
                    title: 'Camera Permission',
                    message: 'App needs camera permission',
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
     * Request microphone permission
     */
    static async requestMicrophonePermission(): Promise<boolean> {
        if (Platform.OS !== 'android') return true;

        try {
            const granted = await PermissionsAndroid.request(
                PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
                {
                    title: 'Microphone Permission',
                    message: 'App needs microphone permission',
                    buttonNeutral: 'Ask Me Later',
                    buttonNegative: 'Cancel',
                    buttonPositive: 'OK',
                }
            );
            return granted === PermissionsAndroid.RESULTS.GRANTED;
        } catch (err) {
            console.warn('Microphone permission error:', err);
            return false;
        }
    }

    /**
     * Request storage permission
     */
    static async requestStoragePermission(): Promise<boolean> {
        if (Platform.OS !== 'android') return true;

        try {
            const androidVersion = typeof Platform.Version === 'string'
                ? parseInt(Platform.Version, 10)
                : Platform.Version;

            console.log('📱 [FileService] Android version:', androidVersion);

            if (androidVersion >= 33) {
                // Android 13+ requires granular media permissions
                console.log('📱 [FileService] Requesting Android 13+ media permissions...');

                const permissions = [
                    PermissionsAndroid.PERMISSIONS.READ_MEDIA_IMAGES,
                    PermissionsAndroid.PERMISSIONS.READ_MEDIA_VIDEO,
                    PermissionsAndroid.PERMISSIONS.READ_MEDIA_AUDIO,
                ];

                const results = await PermissionsAndroid.requestMultiple(permissions);

                console.log('📱 [FileService] Permission results:', results);

                const imageGranted = results[PermissionsAndroid.PERMISSIONS.READ_MEDIA_IMAGES] === PermissionsAndroid.RESULTS.GRANTED;
                const videoGranted = results[PermissionsAndroid.PERMISSIONS.READ_MEDIA_VIDEO] === PermissionsAndroid.RESULTS.GRANTED;
                const audioGranted = results[PermissionsAndroid.PERMISSIONS.READ_MEDIA_AUDIO] === PermissionsAndroid.RESULTS.GRANTED;

                // Return true if at least video or image permission is granted
                const hasPermission = imageGranted || videoGranted;

                if (!hasPermission) {
                    console.warn('📱 [FileService] Media permissions denied');
                }

                return hasPermission;
            }

            // Android 12 and below
            console.log('📱 [FileService] Requesting legacy storage permission...');

            const granted = await PermissionsAndroid.request(
                PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
                {
                    title: 'Storage Permission',
                    message: 'App needs access to your storage to select media files',
                    buttonNeutral: 'Ask Me Later',
                    buttonNegative: 'Cancel',
                    buttonPositive: 'OK',
                }
            );

            const hasPermission = granted === PermissionsAndroid.RESULTS.GRANTED;
            console.log('📱 [FileService] Storage permission:', hasPermission ? 'granted' : 'denied');

            return hasPermission;
        } catch (err) {
            console.error('📱 [FileService] Storage permission error:', err);
            return false;
        }
    }

    /**
     * Take a photo using Vision Camera
     */
    static async takePhotoWithVisionCamera(navigation: any): Promise<ProcessedFileInfo | null> {
        return new Promise((resolve) => {
            navigation.navigate('CameraScreen', {
                mode: 'photo',
                onCapture: (media: any) => {
                    resolve(this.fromCapturedMedia(media));
                }
            });
        });
    }

    /**
     * Record a video using Vision Camera
     */
    static async recordVideoWithVisionCamera(navigation: any, maxDuration?: number): Promise<ProcessedFileInfo | null> {
        return new Promise((resolve) => {
            navigation.navigate('CameraScreen', {
                mode: 'video',
                maxDuration: maxDuration || 300,
                onCapture: (media: any) => {
                    resolve(this.fromCapturedMedia(media));
                }
            });
        });
    }

    /**
     * Pick image from camera or gallery
     */
    static async pickImage(options: FilePickerOptions = {}, navigation?: any): Promise<ProcessedFileInfo | null> {
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
                            if (navigation) {
                                const result = await this.takePhotoWithVisionCamera(navigation);
                                resolve(result);
                                return;
                            }

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
                                selectionLimit: 1,
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
     * Pick video from camera or gallery
     */
    static async pickVideo(options: FilePickerOptions = {}, navigation?: any): Promise<ProcessedFileInfo | null> {
        const {
            quality = 0.8 as PhotoQuality,
            includeBase64 = false,
        } = options;

        return new Promise((resolve) => {
            Alert.alert(
                'Select Video',
                'Choose an option',
                [
                    {
                        text: 'Record Video',
                        onPress: async () => {
                            if (navigation) {
                                const result = await this.recordVideoWithVisionCamera(navigation);
                                resolve(result);
                                return;
                            }

                            // Request BOTH camera and audio permissions for video recording
                            const hasCameraPermission = await this.requestCameraPermission();
                            const hasMicPermission = await this.requestMicrophonePermission();

                            if (!hasCameraPermission) {
                                Alert.alert('Permission Denied', 'Camera permission is required to record video');
                                resolve(null);
                                return;
                            }

                            if (!hasMicPermission) {
                                Alert.alert('Permission Denied', 'Microphone permission is required to record video with audio');
                                // Continue anyway - some users may want silent video
                            }

                            console.log('🎬 [FileService] Launching camera for video recording...');

                            const cameraOptions: CameraOptions = {
                                mediaType: 'video',
                                quality,
                                includeBase64,
                                videoQuality: 'high',
                                durationLimit: 300, // 5 minutes max
                                saveToPhotos: false, // Don't save to gallery, just return the file
                                cameraType: 'back',
                                formatAsMp4: true, // Ensure MP4 format
                            };

                            launchCamera(cameraOptions, (response) => {
                                this.handleVideoPickerResponse(resolve, response);
                            });
                        },
                    },
                    {
                        text: 'Choose from Gallery',
                        onPress: async () => {
                            const hasPermission = await this.requestStoragePermission();
                            if (!hasPermission) {
                                Alert.alert('Permission Denied', 'Storage permission is required to select videos');
                                resolve(null);
                                return;
                            }

                            console.log('🎬 [FileService] Launching gallery for video selection...');

                            const libraryOptions: ImageLibraryOptions = {
                                mediaType: 'video',
                                quality,
                                includeBase64,
                                selectionLimit: 1,
                            };

                            launchImageLibrary(libraryOptions, (response) => {
                                this.handleVideoPickerResponse(resolve, response);
                            });
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
     * ✅ NEW: Pick audio file from device storage
     * Uses DocumentPicker to select audio files
     */
    static async pickAudio(): Promise<ProcessedFileInfo | null> {
        try {
            // Request storage permission if needed
            const hasPermission = await this.requestStoragePermission();
            if (!hasPermission) {
                Alert.alert('Permission Denied', 'Storage permission is required to select audio files');
                return null;
            }

            // Pick audio file using DocumentPicker
            const result = await DocumentPicker.pick({
                type: [DocumentPicker.types.audio],
                copyTo: 'cachesDirectory', // Copy file to app cache for access
            });

            // Handle result (DocumentPicker returns an array)
            const pickedFile = Array.isArray(result) ? result[0] : result;

            if (!pickedFile) {
                return null;
            }

            // Extract file info from DocumentPicker response
            const fileInfo: FileInfo = {
                name: pickedFile.name || `audio_${Date.now()}.mp3`,
                size: pickedFile.size || 0,
                type: pickedFile.type || 'audio/mpeg',
                uri: pickedFile.fileCopyUri || pickedFile.uri,
                ctime: Date.now(),
                mtime: Date.now(),
            };

            // Process file info
            const processedFile = this.processFileInfo(fileInfo);

            // Validate file
            const validation = this.validateFile(processedFile);
            if (!validation.isValid) {
                Alert.alert('Invalid File', validation.error || 'Selected file is not a valid audio file');
                return null;
            }

            console.log('Audio file selected:', processedFile.name, processedFile.sizeFormatted);
            return processedFile;

        } catch (error: any) {
            // Handle user cancellation
            if (DocumentPicker.isCancel(error)) {
                console.log('Audio selection cancelled by user');
                return null;
            }

            // Handle other errors
            console.error('Error picking audio file:', error);
            Alert.alert('Error', 'Failed to select audio file. Please try again.');
            return null;
        }
    }

    /**
     * Start audio recording
     */
    static async startRecording(): Promise<ProcessedFileInfo | null> {
        try {
            const hasPermission = await this.requestMicrophonePermission();
            if (!hasPermission) {
                Alert.alert('Permission Denied', 'Microphone permission is required');
                return null;
            }

            // Initialize audio recording
            const options = {
                sampleRate: 16000,
                channels: 1,
                bitsPerSample: 16,
                audioSource: 6,
                wavFile: `audio_${Date.now()}.wav`
            };

            AudioRecord.init(options);

            return new Promise((resolve) => {
                Alert.alert(
                    'Audio Recording',
                    'Start recording audio?',
                    [
                        {
                            text: 'Start',
                            onPress: () => {
                                try {
                                    AudioRecord.start();
                                    this.isRecording = true;
                                    this.recordingStartTime = Date.now();

                                    setTimeout(async () => {
                                        const audioFile = await this.stopRecording();
                                        if (audioFile) {
                                            const processedFile: ProcessedFileInfo = {
                                                name: `audio_${Date.now()}.wav`,
                                                size: 0,
                                                type: 'audio/wav',
                                                uri: audioFile,
                                                createdAt: new Date().toISOString(),
                                                modifiedAt: new Date().toISOString(),
                                                sizeFormatted: 'Unknown',
                                                isImage: false,
                                                isVideo: false,
                                                extension: 'wav',
                                            };
                                            resolve(processedFile);
                                        } else {
                                            resolve(null);
                                        }
                                    }, 500);
                                } catch (error) {
                                    console.error('Error starting recording:', error);
                                    Alert.alert('Error', 'Failed to start recording');
                                    resolve(null);
                                }
                            },
                        },
                        {
                            text: 'Cancel',
                            style: 'cancel',
                            onPress: () => resolve(null),
                        },
                    ]
                );
            });
        } catch (error) {
            console.error('Error initializing recording:', error);
            Alert.alert('Error', 'Failed to initialize audio recording');
            return null;
        }
    }

    /**
     * Stop audio recording
     */
    static async stopRecording(): Promise<string | null> {
        try {
            if (!this.isRecording) {
                return null;
            }

            const audioFile = await AudioRecord.stop();
            this.isRecording = false;
            this.recordingStartTime = null;

            return audioFile;
        } catch (error) {
            console.error('Error stopping recording:', error);
            return null;
        }
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
     * Handle video picker response
     */
    private static handleVideoPickerResponse(
        resolve: (value: ProcessedFileInfo | null) => void,
        response: ImagePickerResponse
    ): void {
        console.log('🎬 [FileService] Video picker response:', {
            didCancel: response.didCancel,
            errorCode: response.errorCode,
            errorMessage: response.errorMessage,
            assetsCount: response.assets?.length || 0,
        });

        if (response.didCancel) {
            console.log('🎬 [FileService] Video selection cancelled by user');
            resolve(null);
            return;
        }

        if (response.errorCode || response.errorMessage) {
            console.error('🎬 [FileService] Video picker error:', response.errorCode, response.errorMessage);
            Alert.alert('Error', response.errorMessage || 'Failed to capture video');
            resolve(null);
            return;
        }

        const asset = response.assets?.[0];
        if (!asset || !asset.uri) {
            console.error('🎬 [FileService] No video asset in response');
            resolve(null);
            return;
        }

        console.log('🎬 [FileService] Video asset:', {
            uri: asset.uri?.substring(0, 100),
            fileName: asset.fileName,
            type: asset.type,
            fileSize: asset.fileSize,
            duration: asset.duration,
        });

        const fileInfo: FileInfo = {
            name: asset.fileName || `video_${Date.now()}.mp4`,
            size: asset.fileSize || 0,
            type: asset.type || 'video/mp4',
            uri: asset.uri,
            width: asset.width,
            height: asset.height,
            ctime: Date.now(),
            mtime: Date.now(),
        };

        const processedFile = this.processFileInfo(fileInfo);
        const validation = this.validateFile(processedFile);

        if (!validation.isValid) {
            console.error('🎬 [FileService] Video validation failed:', validation.error);
            Alert.alert('Invalid File', validation.error || 'File validation failed');
            resolve(null);
            return;
        }

        console.log('🎬 [FileService] Video processed successfully:', processedFile.name);
        resolve(processedFile);
    }

    /**
     * Upload file to server
     */
    static async uploadFile(
        file: ProcessedFileInfo,
        options: FileUploadOptions
    ): Promise<{ success: boolean; data?: any; error?: string }> {
        try {
            const formData = new FormData();
            formData.append(options.fieldName || 'file', {
                uri: file.uri,
                type: file.type,
                name: file.name,
            } as any);

            const response = await fetch(options.url, {
                method: options.method || 'POST',
                headers: {
                    'Content-Type': 'multipart/form-data',
                    ...options.headers,
                },
                body: formData,
            });

            const data = await response.json();

            if (response.ok) {
                return { success: true, data };
            } else {
                return { success: false, error: data.message || 'Upload failed' };
            }
        } catch (error) {
            console.error('Upload error:', error);
            return { success: false, error: 'Network error occurred' };
        }
    }

    /**
     * Compress image (placeholder)
     */
    static async compressImage(
        file: ProcessedFileInfo,
        options: { quality?: number; maxWidth?: number; maxHeight?: number } = {}
    ): Promise<ProcessedFileInfo> {
        console.log('Image compression would happen here:', options);
        return file;
    }

    /**
     * Delete file from device (placeholder)
     */
    static async deleteFile(uri: string): Promise<boolean> {
        try {
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
        const baseName = originalName.replace(/\.[^/.]+$/, '');

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

    /**
     * Get file extension
     */
    private static getFileExtension(filename: string): string {
        const parts = filename.split('.');
        return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : '';
    }

    /**
     * Get MIME type from file extension
     */
    static getMimeType(extension: string): string {
        const mimeTypes: Record<string, string> = {
            jpg: 'image/jpeg',
            jpeg: 'image/jpeg',
            png: 'image/png',
            gif: 'image/gif',
            webp: 'image/webp',
            mp4: 'video/mp4',
            mov: 'video/quicktime',
            avi: 'video/avi',
            mp3: 'audio/mp3',
            wav: 'audio/wav',
            aac: 'audio/aac',
            m4a: 'audio/m4a',
            ogg: 'audio/ogg',
            mpeg: 'audio/mpeg',
            pdf: 'application/pdf',
            txt: 'text/plain',
            doc: 'application/msword',
            docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        };

        return mimeTypes[extension.toLowerCase()] || 'application/octet-stream';
    }

    /**
     * Format file size for display
     */
    static formatFileSize(bytes: number): string {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    /**
     * Validate file
     */
    static validateFile(file: ProcessedFileInfo): { isValid: boolean; error?: string } {
        if (file.isImage && !this.SUPPORTED_IMAGE_TYPES.includes(file.type)) {
            return { isValid: false, error: 'Unsupported image type' };
        }

        if (file.isVideo && !this.SUPPORTED_VIDEO_TYPES.includes(file.type)) {
            return { isValid: false, error: 'Unsupported video type' };
        }

        if (file.type.startsWith('audio/') && !this.SUPPORTED_AUDIO_TYPES.includes(file.type)) {
            return { isValid: false, error: 'Unsupported audio type' };
        }

        if (file.isImage && file.size > this.MAX_IMAGE_SIZE) {
            return { isValid: false, error: 'Image size exceeds maximum limit (10MB)' };
        }

        if (file.isVideo && file.size > this.MAX_VIDEO_SIZE) {
            return { isValid: false, error: 'Video size exceeds maximum limit (100MB)' };
        }

        if (file.type.startsWith('audio/') && file.size > this.MAX_AUDIO_SIZE) {
            return { isValid: false, error: 'Audio size exceeds maximum limit (50MB)' };
        }

        return { isValid: true };
    }

    /**
     * Get recording duration
     */
    static getRecordingDuration(): number {
        if (!this.isRecording || !this.recordingStartTime) {
            return 0;
        }
        return Math.floor((Date.now() - this.recordingStartTime) / 1000);
    }

    /**
     * Check if currently recording
     */
    static isCurrentlyRecording(): boolean {
        return this.isRecording;
    }
}

export default FileService;