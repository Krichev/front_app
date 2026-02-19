import React from 'react';
import {
    Modal,
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { AppVersionCheckResponse, UpdateStatus, DownloadProgress, formatFileSize } from '../../../entities/AppUpdate';
import { useTheme } from '../../../shared/ui/theme';
import { useAppStyles } from '../../../shared/ui/hooks/useAppStyles';
import { UpdateProgressBar } from './UpdateProgressBar';

interface UpdateModalProps {
    visible: boolean;
    status: UpdateStatus;
    updateInfo: AppVersionCheckResponse | null;
    progress: DownloadProgress | null;
    error: string | null;
    currentVersion: string;
    downloadUpdate: () => void;
    installUpdate: () => void;
    dismissUpdate: () => void;
    retryAction: () => void;
}

export const UpdateModal: React.FC<UpdateModalProps> = ({
    visible,
    status,
    updateInfo,
    progress,
    error,
    currentVersion,
    downloadUpdate,
    installUpdate,
    dismissUpdate,
    retryAction,
}) => {
    const { t } = useTranslation();
    const { theme } = useAppStyles();

    if (!updateInfo && status !== 'checking') return null;

    const isForced = updateInfo?.forceUpdate || false;
    const canDismiss = !isForced && status !== 'downloading' && status !== 'installing';

    const renderContent = () => {
        if (status === 'checking') {
            return (
                <View style={styles.centerContent}>
                    <ActivityIndicator size="large" color={theme.colors.primary} />
                    <Text style={[styles.statusText, { color: theme.colors.onSurface }]}>
                        {t('appUpdate.checking')}
                    </Text>
                </View>
            );
        }

        return (
            <>
                <View style={styles.header}>
                    <MaterialCommunityIcons
                        name="cellphone-arrow-down"
                        size={48}
                        color={theme.colors.primary}
                    />
                    <Text style={[styles.title, { color: theme.colors.onSurface }]}>
                        {isForced ? t('appUpdate.forceUpdateTitle') : t('appUpdate.updateAvailable')}
                    </Text>
                </View>

                <View style={styles.versionInfo}>
                    <Text style={[styles.versionText, { color: theme.colors.onSurface }]}>
                        {t('appUpdate.newVersion', { version: updateInfo?.latestVersion })}
                    </Text>
                    <Text style={[styles.currentVersionText, { color: theme.colors.onSurfaceVariant }]}>
                        {t('appUpdate.currentVersion', { version: currentVersion })}
                    </Text>
                </View>

                {updateInfo?.releaseNotes && (
                    <View style={styles.notesContainer}>
                        <Text style={[styles.notesTitle, { color: theme.colors.onSurface }]}>
                            {t('appUpdate.releaseNotes')}
                        </Text>
                        <ScrollView style={styles.notesScroll} nestedScrollEnabled>
                            <Text style={[styles.notesText, { color: theme.colors.onSurfaceVariant }]}>
                                {updateInfo.releaseNotes}
                            </Text>
                        </ScrollView>
                    </View>
                )}

                {updateInfo?.fileSizeBytes && (
                    <Text style={[styles.fileSize, { color: theme.colors.onSurfaceVariant }]}>
                        {formatFileSize(updateInfo.fileSizeBytes)}
                    </Text>
                )}

                {status === 'downloading' && <UpdateProgressBar progress={progress} />}

                {error && (
                    <View style={styles.errorContainer}>
                        <Text style={[styles.errorText, { color: theme.colors.error }]}>{error}</Text>
                    </View>
                )}

                <View style={styles.actions}>
                    {renderButtons()}
                </View>
            </>
        );
    };

    const renderButtons = () => {
        if (status === 'available') {
            return (
                <>
                    {!isForced && (
                        <TouchableOpacity
                            style={[styles.button, styles.secondaryButton]}
                            onPress={dismissUpdate}
                        >
                            <Text style={[styles.buttonText, { color: theme.colors.primary }]}>
                                {t('appUpdate.later')}
                            </Text>
                        </TouchableOpacity>
                    )}
                    <TouchableOpacity
                        style={[styles.button, styles.primaryButton, { backgroundColor: theme.colors.primary }]}
                        onPress={downloadUpdate}
                    >
                        <Text style={styles.primaryButtonText}>{t('appUpdate.updateNow')}</Text>
                    </TouchableOpacity>
                </>
            );
        }

        if (status === 'downloaded') {
            return (
                <TouchableOpacity
                    style={[styles.button, styles.primaryButton, { backgroundColor: theme.colors.primary }]}
                    onPress={installUpdate}
                >
                    <Text style={styles.primaryButtonText}>{t('appUpdate.install')}</Text>
                </TouchableOpacity>
            );
        }

        if (status === 'error') {
            return (
                <>
                    {!isForced && (
                        <TouchableOpacity
                            style={[styles.button, styles.secondaryButton]}
                            onPress={dismissUpdate}
                        >
                            <Text style={[styles.buttonText, { color: theme.colors.primary }]}>
                                {t('appUpdate.later')}
                            </Text>
                        </TouchableOpacity>
                    )}
                    <TouchableOpacity
                        style={[styles.button, styles.primaryButton, { backgroundColor: theme.colors.primary }]}
                        onPress={retryAction}
                    >
                        <Text style={styles.primaryButtonText}>{t('appUpdate.retry')}</Text>
                    </TouchableOpacity>
                </>
            );
        }

        if (status === 'installing') {
            return (
                <View style={styles.loadingButton}>
                    <ActivityIndicator size="small" color={theme.colors.primary} />
                    <Text style={[styles.loadingText, { color: theme.colors.primary }]}>
                        {t('appUpdate.installing')}
                    </Text>
                </View>
            );
        }

        return null;
    };

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={canDismiss ? dismissUpdate : undefined}
        >
            <View style={styles.overlay}>
                <View style={[styles.modalContainer, { backgroundColor: theme.colors.surface }]}>
                    {renderContent()}
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    modalContainer: {
        width: '100%',
        maxWidth: 400,
        borderRadius: 16,
        padding: 24,
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
    },
    centerContent: {
        alignItems: 'center',
        padding: 20,
    },
    header: {
        alignItems: 'center',
        marginBottom: 20,
    },
    title: {
        fontSize: 22,
        fontWeight: 'bold',
        marginTop: 12,
        textAlign: 'center',
    },
    versionInfo: {
        alignItems: 'center',
        marginBottom: 20,
    },
    versionText: {
        fontSize: 16,
        fontWeight: '600',
    },
    currentVersionText: {
        fontSize: 14,
        marginTop: 4,
    },
    notesContainer: {
        maxHeight: 200,
        marginBottom: 15,
    },
    notesTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 8,
    },
    notesScroll: {
        backgroundColor: 'rgba(0,0,0,0.03)',
        borderRadius: 8,
        padding: 12,
    },
    notesText: {
        fontSize: 14,
        lineHeight: 20,
    },
    fileSize: {
        fontSize: 12,
        textAlign: 'right',
        marginBottom: 10,
    },
    statusText: {
        marginTop: 12,
        fontSize: 16,
    },
    errorContainer: {
        marginBottom: 15,
    },
    errorText: {
        fontSize: 14,
        textAlign: 'center',
    },
    actions: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        marginTop: 10,
    },
    button: {
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 8,
        marginLeft: 10,
        minWidth: 100,
        alignItems: 'center',
    },
    primaryButton: {
        elevation: 2,
    },
    secondaryButton: {
        backgroundColor: 'transparent',
    },
    buttonText: {
        fontSize: 14,
        fontWeight: '600',
    },
    primaryButtonText: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '600',
    },
    loadingButton: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 10,
    },
    loadingText: {
        marginLeft: 8,
        fontSize: 14,
        fontWeight: '600',
    },
});
