// src/services/FileService.ts
import RNFS from 'react-native-fs';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface AudioFileInfo {
    filePath: string;
    fileName: string;
    fileSize: number;
    duration?: number;
    createdAt: string;
}

export interface TranscriptionRecord {
    id: string;
    audioFilePath: string;
    transcription: string;
    timestamp: string;
    duration?: number;
    language?: string;
    confidence?: number;
}

export class FileService {
    private static readonly AUDIO_DIR = `${RNFS.DocumentDirectoryPath}/audio_recordings`;
    private static readonly TRANSCRIPTIONS_KEY = '@voice_transcriptions';
    private static readonly MAX_FILE_AGE_DAYS = 7; // Auto-cleanup files older than 7 days

    /**
     * Initialize the file service and ensure directories exist
     */
    static async initialize(): Promise<void> {
        try {
            const dirExists = await RNFS.exists(this.AUDIO_DIR);
            if (!dirExists) {
                await RNFS.mkdir(this.AUDIO_DIR);
                console.log('Created audio directory:', this.AUDIO_DIR);
            }
        } catch (error) {
            console.error('Error initializing FileService:', error);
        }
    }

    /**
     * Generate a unique file path for a new audio recording
     */
    static generateAudioFilePath(extension: string = 'wav'): string {
        const timestamp = new Date().getTime();
        const fileName = `audio_${timestamp}.${extension}`;
        return `${this.AUDIO_DIR}/${fileName}`;
    }

    /**
     * Save audio data to file
     */
    static async saveAudioFile(audioData: string | ArrayBuffer, fileName?: string): Promise<AudioFileInfo> {
        try {
            const filePath = fileName
                ? `${this.AUDIO_DIR}/${fileName}`
                : this.generateAudioFilePath();

            if (typeof audioData === 'string') {
                // Base64 data
                await RNFS.writeFile(filePath, audioData, 'base64');
            } else {
                // ArrayBuffer
                const base64 = Buffer.from(audioData).toString('base64');
                await RNFS.writeFile(filePath, base64, 'base64');
            }

            const fileInfo = await RNFS.stat(filePath);

            return {
                filePath,
                fileName: filePath.split('/').pop() || '',
                fileSize: fileInfo.size,
                createdAt: fileInfo.ctime.toISOString(),
            };
        } catch (error) {
            console.error('Error saving audio file:', error);
            throw error;
        }
    }

    /**
     * Move audio file from temp location to permanent storage
     */
    static async moveAudioFile(sourcePath: string, fileName?: string): Promise<AudioFileInfo> {
        try {
            const destPath = fileName
                ? `${this.AUDIO_DIR}/${fileName}`
                : this.generateAudioFilePath();

            // Check if source file exists
            const exists = await RNFS.exists(sourcePath);
            if (!exists) {
                throw new Error(`Source file not found: ${sourcePath}`);
            }

            // Move the file
            await RNFS.moveFile(sourcePath, destPath);

            const fileInfo = await RNFS.stat(destPath);

            return {
                filePath: destPath,
                fileName: destPath.split('/').pop() || '',
                fileSize: fileInfo.size,
                createdAt: fileInfo.ctime.toISOString(),
            };
        } catch (error) {
            console.error('Error moving audio file:', error);
            throw error;
        }
    }

    /**
     * Read audio file as base64
     */
    static async readAudioFileAsBase64(filePath: string): Promise<string> {
        try {
            const base64 = await RNFS.readFile(filePath, 'base64');
            return base64;
        } catch (error) {
            console.error('Error reading audio file:', error);
            throw error;
        }
    }

    /**
     * Delete audio file
     */
    static async deleteAudioFile(filePath: string): Promise<void> {
        try {
            const exists = await RNFS.exists(filePath);
            if (exists) {
                await RNFS.unlink(filePath);
                console.log('Deleted audio file:', filePath);
            }
        } catch (error) {
            console.error('Error deleting audio file:', error);
            throw error;
        }
    }

    /**
     * Save transcription record
     */
    static async saveTranscription(transcription: Omit<TranscriptionRecord, 'id'>): Promise<TranscriptionRecord> {
        try {
            const id = `trans_${new Date().getTime()}_${Math.random().toString(36).substr(2, 9)}`;
            const record: TranscriptionRecord = {
                id,
                ...transcription,
            };

            // Get existing transcriptions
            const existingRecords = await this.getTranscriptions();

            // Add new record
            const updatedRecords = [...existingRecords, record];

            // Save to AsyncStorage
            await AsyncStorage.setItem(this.TRANSCRIPTIONS_KEY, JSON.stringify(updatedRecords));

            return record;
        } catch (error) {
            console.error('Error saving transcription:', error);
            throw error;
        }
    }

    /**
     * Get all transcriptions
     */
    static async getTranscriptions(): Promise<TranscriptionRecord[]> {
        try {
            const data = await AsyncStorage.getItem(this.TRANSCRIPTIONS_KEY);
            return data ? JSON.parse(data) : [];
        } catch (error) {
            console.error('Error getting transcriptions:', error);
            return [];
        }
    }

    /**
     * Get transcription by audio file path
     */
    static async getTranscriptionByAudioPath(audioFilePath: string): Promise<TranscriptionRecord | null> {
        try {
            const transcriptions = await this.getTranscriptions();
            return transcriptions.find(t => t.audioFilePath === audioFilePath) || null;
        } catch (error) {
            console.error('Error getting transcription:', error);
            return null;
        }
    }

    /**
     * List all audio files
     */
    static async listAudioFiles(): Promise<AudioFileInfo[]> {
        try {
            const exists = await RNFS.exists(this.AUDIO_DIR);
            if (!exists) {
                return [];
            }

            const files = await RNFS.readdir(this.AUDIO_DIR);
            const audioFiles: AudioFileInfo[] = [];

            for (const fileName of files) {
                if (fileName.endsWith('.wav') || fileName.endsWith('.mp3') || fileName.endsWith('.m4a')) {
                    const filePath = `${this.AUDIO_DIR}/${fileName}`;
                    const stat = await RNFS.stat(filePath);

                    audioFiles.push({
                        filePath,
                        fileName,
                        fileSize: stat.size,
                        createdAt: stat.ctime.toISOString(),
                    });
                }
            }

            return audioFiles.sort((a, b) =>
                new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            );
        } catch (error) {
            console.error('Error listing audio files:', error);
            return [];
        }
    }

    /**
     * Get total storage used by audio files
     */
    static async getStorageUsed(): Promise<number> {
        try {
            const files = await this.listAudioFiles();
            return files.reduce((total, file) => total + file.fileSize, 0);
        } catch (error) {
            console.error('Error calculating storage used:', error);
            return 0;
        }
    }

    /**
     * Clean up old audio files
     */
    static async cleanupOldFiles(daysToKeep: number = this.MAX_FILE_AGE_DAYS): Promise<number> {
        try {
            const files = await this.listAudioFiles();
            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

            let deletedCount = 0;

            for (const file of files) {
                const fileDate = new Date(file.createdAt);
                if (fileDate < cutoffDate) {
                    await this.deleteAudioFile(file.filePath);
                    deletedCount++;
                }
            }

            console.log(`Cleaned up ${deletedCount} old audio files`);
            return deletedCount;
        } catch (error) {
            console.error('Error cleaning up old files:', error);
            return 0;
        }
    }

    /**
     * Export audio file with transcription
     */
    static async exportAudioWithTranscription(
        audioFilePath: string,
        exportPath?: string
    ): Promise<{ audioPath: string; transcriptionPath: string }> {
        try {
            const transcription = await this.getTranscriptionByAudioPath(audioFilePath);

            if (!transcription) {
                throw new Error('No transcription found for this audio file');
            }

            // Default export directory
            const exportDir = exportPath || `${RNFS.DocumentDirectoryPath}/exports`;

            // Ensure export directory exists
            const dirExists = await RNFS.exists(exportDir);
            if (!dirExists) {
                await RNFS.mkdir(exportDir);
            }

            const timestamp = new Date().getTime();
            const audioFileName = `export_audio_${timestamp}.wav`;
            const transcriptionFileName = `export_transcription_${timestamp}.txt`;

            // Copy audio file
            const newAudioPath = `${exportDir}/${audioFileName}`;
            await RNFS.copyFile(audioFilePath, newAudioPath);

            // Save transcription as text file
            const transcriptionContent = `Transcription
Date: ${transcription.timestamp}
Language: ${transcription.language || 'Unknown'}
Duration: ${transcription.duration || 'Unknown'} seconds
${transcription.confidence ? `Confidence: ${transcription.confidence}` : ''}

Text:
${transcription.transcription}`;

            const transcriptionPath = `${exportDir}/${transcriptionFileName}`;
            await RNFS.writeFile(transcriptionPath, transcriptionContent, 'utf8');

            return {
                audioPath: newAudioPath,
                transcriptionPath: transcriptionPath,
            };
        } catch (error) {
            console.error('Error exporting audio with transcription:', error);
            throw error;
        }
    }

    /**
     * Clear all audio files and transcriptions
     */
    static async clearAll(): Promise<void> {
        try {
            // Delete all audio files
            const files = await this.listAudioFiles();
            for (const file of files) {
                await this.deleteAudioFile(file.filePath);
            }

            // Clear transcriptions
            await AsyncStorage.removeItem(this.TRANSCRIPTIONS_KEY);

            console.log('Cleared all audio files and transcriptions');
        } catch (error) {
            console.error('Error clearing all data:', error);
            throw error;
        }
    }
}