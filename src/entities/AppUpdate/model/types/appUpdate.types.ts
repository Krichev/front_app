export interface AppVersionCheckResponse {
    latestVersion: string;
    latestVersionCode: number;
    downloadUrl: string | null;
    releaseNotes: string | null;
    releaseDate: string | null;
    forceUpdate: boolean;
    minSupportedVersion: string;
    fileSizeBytes: number | null;
    updateAvailable: boolean;
}

export type UpdateStatus =
    | 'idle'
    | 'checking'
    | 'available'
    | 'downloading'
    | 'downloaded'
    | 'installing'
    | 'error'
    | 'up-to-date';

export interface DownloadProgress {
    bytesWritten: number;
    contentLength: number;
    percentage: number;
}
