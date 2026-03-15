import React from 'react';
import {
    Modal,
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { AppVersionCheckResponse, UpdateStatus, DownloadProgress, formatFileSize } from '../../../entities/AppUpdate';
import { createStyles, useTheme } from '../../../shared/ui/theme';
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
    const { colors } = useTheme();

    if (!updateInfo && status !== 'checking') return null;

    const isForced = updateInfo?.forceUpdate || false;
    const canDismiss = !isForced && status !== 'downloading' && status !== 'installing';

    const renderContent = () => {
        if (status === 'checking') {
            return (
                <View style={styles.centerContent}>
                    <ActivityIndicator size="large" color={colors.primary.main} />
                    <Text style={[styles.statusText, { color: colors.text.primary }]}>
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
                        color={colors.primary.main}
                    />
                    <Text style={[styles.title, { color: colors.text.primary }]}>
                        {isForced ? t('appUpdate.forceUpdateTitle') : t('appUpdate.updateAvailable')}
                    </Text>
                </View>

                <View style={styles.versionInfo}>
                    <Text style={[styles.versionText, { color: colors.text.primary }]}>
                        {t('appUpdate.newVersion', { version: updateInfo?.latestVersion })}
                    </Text>
                    <Text style={[styles.currentVersionText, { color: colors.text.secondary }]}>
                        {t('appUpdate.currentVersion', { version: currentVersion })}
                    </Text>
                </View>

                {updateInfo?.releaseNotes && (
                    <View style={styles.notesContainer}>
                        <Text style={[styles.notesTitle, { color: colors.text.primary }]}>
                            {t('appUpdate.releaseNotes')}
                        </Text>
                        <ScrollView style={styles.notesScroll} nestedScrollEnabled>
                            <Text style={[styles.notesText, { color: colors.text.secondary }]}>
                                {updateInfo.releaseNotes}
                            </Text>
                        </ScrollView>
                    </View>
                )}

                {updateInfo?.fileSizeBytes && (
                    <Text style={[styles.fileSize, { color: colors.text.secondary }]}>
                        {formatFileSize(updateInfo.fileSizeBytes)}
                    </Text>
                )}

                {status === 'downloading' && <UpdateProgressBar progress={progress} />}

                {error && (
                    <View style={styles.errorContainer}>
                        <Text style={[styles.errorText, { color: colors.error.main }]}>{error}</Text>
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
                            <Text style={[styles.buttonText, { color: colors.primary.main }]}>
                                {t('appUpdate.later')}
                            </Text>
                        </TouchableOpacity>
                    )}
                    <TouchableOpacity
                        style={[styles.button, styles.primaryButton, { backgroundColor: colors.primary.main }]}
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
                    style={[styles.button, styles.primaryButton, { backgroundColor: colors.primary.main }]}
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
                            <Text style={[styles.buttonText, { color: colors.primary.main }]}>
                                {t('appUpdate.later')}
                            </Text>
                        </TouchableOpacity>
                    )}
                    <TouchableOpacity
                        style={[styles.button, styles.primaryButton, { backgroundColor: colors.primary.main }]}
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
                    <ActivityIndicator size="small" color={colors.primary.main} />
                    <Text style={[styles.loadingText, { color: colors.primary.main }]}>
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
                <View style={[styles.modalContainer, { backgroundColor: colors.background.paper }]}>
                    {renderContent()}
                </View>
            </View>
        </Modal>
    );
};

const styles = createStyles((theme) => ({
    overlay: {
        flex: 1,
        backgroundColor: theme.colors.overlay.medium,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    modalContainer: {
        width: '100%',
        maxWidth: 400,
        borderRadius: theme.layout.borderRadius.lg,
        padding: theme.spacing.xl,
        elevation: 5,
        shadowColor: theme.colors.neutral.black,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
    },
    centerContent: {
        alignItems: 'center',
        padding: theme.spacing.lg,
    },
    header: {
        alignItems: 'center',
        marginBottom: theme.spacing.lg,
    },
    title: {
        fontSize: theme.typography.fontSize.xl,
        fontWeight: theme.typography.fontWeight.bold,
        marginTop: theme.spacing.md,
        textAlign: 'center',
    },
    versionInfo: {
        alignItems: 'center',
        marginBottom: theme.spacing.lg,
    },
    versionText: {
        fontSize: theme.typography.fontSize.base,
        fontWeight: theme.typography.fontWeight.semibold,
    },
    currentVersionText: {
        fontSize: theme.typography.fontSize.sm,
        marginTop: theme.spacing.xs,
    },
    notesContainer: {
        maxHeight: 200,
        marginBottom: theme.spacing.md,
    },
    notesTitle: {
        fontSize: theme.typography.fontSize.base,
        fontWeight: theme.typography.fontWeight.bold,
        marginBottom: theme.spacing.sm,
    },
    notesScroll: {
        backgroundColor: theme.colors.background.secondary,
        borderRadius: theme.layout.borderRadius.md,
        padding: theme.spacing.md,
    },
    notesText: {
        fontSize: theme.typography.fontSize.sm,
        lineHeight: 20,
    },
    fileSize: {
        fontSize: theme.typography.fontSize.xs,
        textAlign: 'right',
        marginBottom: theme.spacing.sm,
    },
    statusText: {
        marginTop: theme.spacing.md,
        fontSize: theme.typography.fontSize.base,
    },
    errorContainer: {
        marginBottom: theme.spacing.md,
    },
    errorText: {
        fontSize: theme.typography.fontSize.sm,
        textAlign: 'center',
    },
    actions: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        marginTop: theme.spacing.sm,
    },
    button: {
        paddingVertical: theme.spacing.sm,
        paddingHorizontal: theme.spacing.md,
        borderRadius: theme.layout.borderRadius.md,
        marginLeft: theme.spacing.sm,
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
        fontSize: theme.typography.fontSize.sm,
        fontWeight: theme.typography.fontWeight.semibold,
    },
    primaryButtonText: {
        color: theme.colors.neutral.white,
        fontSize: theme.typography.fontSize.sm,
        fontWeight: theme.typography.fontWeight.semibold,
    },
    loadingButton: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: theme.spacing.sm,
    },
    loadingText: {
        marginLeft: theme.spacing.sm,
        fontSize: theme.typography.fontSize.sm,
        fontWeight: theme.typography.fontWeight.semibold,
    },
}));

