import DeviceInfo from 'react-native-device-info';
import ReactNativeBlobUtil from 'react-native-blob-util';
import { NativeModules } from 'react-native';
import { AppVersionCheckResponse, DownloadProgress } from '../../entities/AppUpdate';
import NetworkConfigManager from '../../config/NetworkConfig';

class AppUpdateService {
    private static instance: AppUpdateService;

    private constructor() {}

    public static getInstance(): AppUpdateService {
        if (!AppUpdateService.instance) {
            AppUpdateService.instance = new AppUpdateService();
        }
        return AppUpdateService.instance;
    }

    /**
     * Get base API URL from centralized NetworkConfigManager
     * IMPORTANT: getBaseUrl() already includes /api suffix
     */
    private getBaseUrl(): string {
        return NetworkConfigManager.getInstance().getBaseUrl();
    }

    /**
     * Get current app version info
     */
    public getCurrentVersion(): string {
        return DeviceInfo.getVersion(); // versionName from build.gradle
    }

    public getCurrentBuildNumber(): string {
        return DeviceInfo.getBuildNumber(); // versionCode
    }

    public getFullVersion(): string {
        return `${this.getCurrentVersion()}.${this.getCurrentBuildNumber()}`;
    }

    /**
     * Check for updates via backend endpoint
     */
    public async checkForUpdate(): Promise<AppVersionCheckResponse> {
        const currentVersion = this.getFullVersion();
        const baseUrl = this.getBaseUrl();
        const url = `${baseUrl}/public/app-version/check?platform=android&currentVersion=${currentVersion}`;

        console.log('🔄 Checking for updates...', { currentVersion, url });

        const response = await fetch(url, {
            method: 'GET',
            headers: { 'Accept': 'application/json' },
        });

        if (!response.ok) {
            throw new Error(`Version check failed: ${response.status}`);
        }

        const data: AppVersionCheckResponse = await response.json();
        console.log(data.updateAvailable
            ? `✅ Update available: v${data.latestVersion}`
            : '✅ App is up to date');
        return data;
    }

    /**
     * Download APK with progress
     */
    public async downloadApk(
        downloadUrl: string,
        onProgress: (progress: DownloadProgress) => void
    ): Promise<string> {
        const fileName = `challenger-update-${Date.now()}.apk`;
        const downloadDir = ReactNativeBlobUtil.fs.dirs.DownloadDir;
        const filePath = `${downloadDir}/${fileName}`;

        console.log('📥 Downloading APK...', { downloadUrl, filePath });

        const response = await ReactNativeBlobUtil.config({
            path: filePath,
            fileCache: true,
        }).fetch('GET', downloadUrl)
          .progress({ count: 50 }, (received: number, total: number) => {
              const percentage = Math.round((received / total) * 100);
              onProgress({ bytesWritten: received, contentLength: total, percentage });
              if (percentage % 25 === 0) {
                  console.log(`📥 Download progress: ${percentage}%`);
              }
          });

        const statusCode = response.respInfo.status;
        if (statusCode !== 200) {
            throw new Error(`Download failed with status: ${statusCode}`);
        }

        console.log('✅ APK downloaded to:', filePath);
        return filePath;
    }

    /**
     * Trigger native APK install
     */
    public async installApk(filePath: string): Promise<void> {
        console.log('📦 Triggering APK install...', { filePath });
        const { ApkInstaller } = NativeModules;
        if (!ApkInstaller) {
            throw new Error('ApkInstaller native module not found');
        }
        await ApkInstaller.installApk(filePath);
    }

    /**
     * Clean up downloaded APK files
     */
    public async cleanupDownloads(): Promise<void> {
        try {
            const downloadDir = ReactNativeBlobUtil.fs.dirs.DownloadDir;
            const files = await ReactNativeBlobUtil.fs.ls(downloadDir);
            for (const file of files) {
                if (file.startsWith('challenger-update-') && file.endsWith('.apk')) {
                    await ReactNativeBlobUtil.fs.unlink(`${downloadDir}/${file}`);
                }
            }
            console.log('🧹 Cleaned up old APK downloads');
        } catch (error) {
            console.warn('Failed to cleanup downloads:', error);
        }
    }
}

export default AppUpdateService;
