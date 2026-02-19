import { useState, useCallback, useRef } from 'react';
import { AppVersionCheckResponse, UpdateStatus, DownloadProgress } from '../../../entities/AppUpdate';
import AppUpdateService from '../../../services/update/AppUpdateService';
import { shouldCheckForUpdate, markUpdateChecked, getDismissedVersion, dismissVersion } from '../lib/updateStorage';

export function useAppUpdate() {
    const [status, setStatus] = useState<UpdateStatus>('idle');
    const [updateInfo, setUpdateInfo] = useState<AppVersionCheckResponse | null>(null);
    const [progress, setProgress] = useState<DownloadProgress | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [showModal, setShowModal] = useState(false);
    const downloadPathRef = useRef<string | null>(null);

    const service = AppUpdateService.getInstance();

    const checkForUpdate = useCallback(async (force = false) => {
        try {
            // Respect check interval unless forced (from settings button)
            if (!force) {
                const shouldCheck = await shouldCheckForUpdate();
                if (!shouldCheck) {
                    console.log('⏭️ Skipping update check (within interval)');
                    return;
                }
            }

            setStatus('checking');
            setError(null);

            const result = await service.checkForUpdate();
            await markUpdateChecked();
            setUpdateInfo(result);

            if (result.updateAvailable) {
                // Check if user already dismissed this version (only for non-forced updates)
                if (!result.forceUpdate) {
                    const dismissed = await getDismissedVersion();
                    if (dismissed === result.latestVersion && !force) {
                        console.log('⏭️ User dismissed this version:', dismissed);
                        setStatus('idle');
                        return;
                    }
                }
                setStatus('available');
                setShowModal(true);
            } else {
                setStatus('up-to-date');
                if (force) {
                    // If manual check, briefly show "up to date" then reset
                    setTimeout(() => setStatus('idle'), 3000);
                } else {
                    setStatus('idle');
                }
            }
        } catch (err) {
            console.warn('❌ Update check failed:', err);
            setStatus('idle'); // Silent failure for auto-check
            if (force) {
                setError('Failed to check for updates. Please try again.');
                setStatus('error');
            }
        }
    }, [service]);

    const downloadUpdate = useCallback(async () => {
        if (!updateInfo?.downloadUrl) return;

        try {
            setStatus('downloading');
            setProgress({ bytesWritten: 0, contentLength: 0, percentage: 0 });
            setError(null);

            // Cleanup old downloads first
            await service.cleanupDownloads();

            const filePath = await service.downloadApk(updateInfo.downloadUrl, setProgress);
            downloadPathRef.current = filePath;
            setStatus('downloaded');
        } catch (err) {
            console.error('❌ Download failed:', err);
            setStatus('error');
            setError('Download failed. Please try again.');
        }
    }, [updateInfo, service]);

    const installUpdate = useCallback(async () => {
        if (!downloadPathRef.current) return;

        try {
            setStatus('installing');
            await service.installApk(downloadPathRef.current);
            // If we get here, the install intent was launched
            // The app may be killed during installation
        } catch (err) {
            console.error('❌ Install failed:', err);
            setStatus('error');
            setError('Installation failed. Please try again.');
        }
    }, [service]);

    const dismissUpdate = useCallback(async () => {
        if (updateInfo?.latestVersion) {
            await dismissVersion(updateInfo.latestVersion);
        }
        setShowModal(false);
        setStatus('idle');
    }, [updateInfo]);

    const retryAction = useCallback(() => {
        if (status === 'error' && updateInfo?.updateAvailable) {
            if (downloadPathRef.current) {
                installUpdate();
            } else {
                downloadUpdate();
            }
        } else {
            checkForUpdate(true);
        }
    }, [status, updateInfo, downloadUpdate, installUpdate, checkForUpdate]);

    const currentVersion = service.getFullVersion();

    return {
        status,
        updateInfo,
        progress,
        error,
        showModal,
        currentVersion,
        checkForUpdate,
        downloadUpdate,
        installUpdate,
        dismissUpdate,
        retryAction,
    };
}
