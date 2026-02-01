// src/screens/SettingsScreen.tsx
import React, { useCallback } from 'react';
import {
    SafeAreaView,
    ScrollView,
    View,
    Text,
    TouchableOpacity,
    Switch,
    Alert,
    ActivityIndicator,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { RootState } from '../app/providers/StoreProvider/store';
import { logout } from '../entities/AuthState/model/slice/authSlice';
import { useAppStyles } from '../shared/ui/hooks/useAppStyles';
import { createStyles } from '../shared/ui/theme';
import { useI18n } from '../app/providers/I18nProvider';
import { 
    useGetAppSettingsQuery,
    useUpdateAppSettingsMutation,
    clearCachedSettings,
} from '../entities/SettingsState/model/slice/settingsApi';
import { AppLanguage, AVAILABLE_LANGUAGES } from '../entities/SettingsState/model/types/settings.types';
import KeychainService from '../services/auth/KeychainService';

const SettingsScreen: React.FC = () => {
    const { t } = useTranslation();
    const dispatch = useDispatch();
    const { screen, theme } = useAppStyles();
    const styles = themeStyles;
    
    const { isAuthenticated } = useSelector((state: RootState) => state.auth);
    const { currentLanguage, changeLanguage, isChangingLanguage } = useI18n();
    
    // Fetch settings from API
    const { data: settings, isLoading } = useGetAppSettingsQuery(undefined, {
        skip: !isAuthenticated,
    });
    
    // Update settings mutation
    const [updateSettings, { isLoading: isUpdating }] = useUpdateAppSettingsMutation();

    // Handle language selection
    const handleLanguageChange = useCallback(async (language: AppLanguage) => {
        if (language === currentLanguage) return;
        await changeLanguage(language);
    }, [changeLanguage, currentLanguage]);

    // Handle AI validation toggle
    const handleAiValidationToggle = useCallback(async (enabled: boolean) => {
        try {
            await updateSettings({ enableAiAnswerValidation: enabled }).unwrap();
        } catch (error) {
            Alert.alert(t('common.error'), t('settings.updateError'));
        }
    }, [updateSettings, t]);

    // Handle logout
    const handleLogout = useCallback(() => {
        Alert.alert(
            t('settings.logout'),
            t('settings.logoutConfirm'),
            [
                { text: t('common.cancel'), style: 'cancel' },
                {
                    text: t('settings.logout'),
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await KeychainService.deleteAuthTokens();
                            await clearCachedSettings();
                            dispatch(logout());
                        } catch (error) {
                            console.error('Error during logout:', error);
                        }
                    },
                },
            ]
        );
    }, [dispatch, t]);

    // Get current language info for display
    const currentLangInfo = AVAILABLE_LANGUAGES.find(l => l.code === currentLanguage);

    // Loading state
    if (isLoading) {
        return (
            <SafeAreaView style={screen.container}>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={theme.colors.primary.main} />
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={screen.container}>
            <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
                {/* Header */}
                <View style={styles.header}>
                    <Text style={styles.title}>{t('settings.title')}</Text>
                </View>

                {/* Preferences Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>{t('settings.preferences')}</Text>
                    
                    {/* Language Setting Header */}
                    <View style={styles.settingItem}>
                        <View style={styles.settingInfo}>
                            <MaterialCommunityIcons 
                                name="translate" 
                                size={24} 
                                color={theme.colors.primary.main} 
                            />
                            <View style={styles.settingText}>
                                <Text style={styles.settingLabel}>{t('settings.language')}</Text>
                                <Text style={styles.settingDescription}>
                                    {t('settings.languageDescription')}
                                </Text>
                            </View>
                        </View>
                        {isChangingLanguage ? (
                            <ActivityIndicator size="small" color={theme.colors.primary.main} />
                        ) : (
                            <Text style={styles.settingValue}>
                                {currentLangInfo?.flag} {currentLangInfo?.nativeName}
                            </Text>
                        )}
                    </View>
                    
                    {/* Language Options */}
                    <View style={styles.languageOptions}>
                        {AVAILABLE_LANGUAGES.map((lang) => (
                            <TouchableOpacity
                                key={lang.code}
                                style={[
                                    styles.languageOption,
                                    currentLanguage === lang.code && styles.languageOptionSelected,
                                ]}
                                onPress={() => handleLanguageChange(lang.code)}
                                disabled={isChangingLanguage}
                                activeOpacity={0.7}
                            >
                                <Text style={styles.languageFlag}>{lang.flag}</Text>
                                <View style={styles.languageTextContainer}>
                                    <Text style={[
                                        styles.languageName,
                                        currentLanguage === lang.code && styles.languageNameSelected,
                                    ]}>
                                        {lang.nativeName}
                                    </Text>
                                    <Text style={styles.languageNameSecondary}>
                                        {lang.name}
                                    </Text>
                                </View>
                                {currentLanguage === lang.code && (
                                    <MaterialCommunityIcons 
                                        name="check-circle" 
                                        size={24} 
                                        color={theme.colors.primary.main} 
                                    />
                                )}
                            </TouchableOpacity>
                        ))}
                    </View>

                    {/* Divider */}
                    <View style={styles.divider} />

                    {/* Notifications */}
                    <View style={styles.settingItem}>
                        <View style={styles.settingInfo}>
                            <MaterialCommunityIcons 
                                name="bell-outline" 
                                size={24} 
                                color={theme.colors.primary.main} 
                            />
                            <View style={styles.settingText}>
                                <Text style={styles.settingLabel}>{t('settings.notifications')}</Text>
                                <Text style={styles.settingDescription}>
                                    {t('settings.notificationsDescription')}
                                </Text>
                            </View>
                        </View>
                        <Switch
                            value={settings?.notificationsEnabled ?? true}
                            onValueChange={handleNotificationsToggle}
                            trackColor={{ 
                                false: theme.colors.neutral.gray[300], 
                                true: theme.colors.primary.light 
                            }}
                            thumbColor={
                                settings?.notificationsEnabled 
                                    ? theme.colors.primary.main 
                                    : theme.colors.neutral.gray[100]
                            }
                            disabled={isUpdating}
                        />
                    </View>
                </View>

                {/* Quiz Settings Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>{t('settings.quizSettings')}</Text>
                    
                    {/* AI Answer Validation */}
                    <View style={styles.settingItem}>
                        <View style={styles.settingInfo}>
                            <MaterialCommunityIcons 
                                name="robot-outline" 
                                size={24} 
                                color={theme.colors.primary.main} 
                            />
                            <View style={styles.settingText}>
                                <Text style={styles.settingLabel}>{t('settings.aiAnswerValidation')}</Text>
                                <Text style={styles.settingDescription}>
                                    {t('settings.aiAnswerValidationDescription')}
                                </Text>
                            </View>
                        </View>
                        <Switch
                            value={settings?.enableAiAnswerValidation ?? false}
                            onValueChange={handleAiValidationToggle}
                            trackColor={{ 
                                false: theme.colors.neutral.gray[300], 
                                true: theme.colors.primary.light 
                            }}
                            thumbColor={
                                settings?.enableAiAnswerValidation 
                                    ? theme.colors.primary.main 
                                    : theme.colors.neutral.gray[100]
                            }
                            disabled={isUpdating}
                        />
                    </View>
                </View>

                {/* Support & Info Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>{t('settings.support')}</Text>
                    
                    {/* Privacy Policy */}
                    <TouchableOpacity style={styles.settingItem} activeOpacity={0.7}>
                        <View style={styles.settingInfo}>
                            <MaterialCommunityIcons 
                                name="shield-check-outline" 
                                size={24} 
                                color={theme.colors.text.secondary} 
                            />
                            <Text style={styles.settingLabel}>{t('settings.privacy')}</Text>
                        </View>
                        <MaterialCommunityIcons 
                            name="chevron-right" 
                            size={24} 
                            color={theme.colors.text.disabled} 
                        />
                    </TouchableOpacity>

                    {/* Terms of Service */}
                    <TouchableOpacity style={styles.settingItem} activeOpacity={0.7}>
                        <View style={styles.settingInfo}>
                            <MaterialCommunityIcons 
                                name="file-document-outline" 
                                size={24} 
                                color={theme.colors.text.secondary} 
                            />
                            <Text style={styles.settingLabel}>{t('settings.terms')}</Text>
                        </View>
                        <MaterialCommunityIcons 
                            name="chevron-right" 
                            size={24} 
                            color={theme.colors.text.disabled} 
                        />
                    </TouchableOpacity>

                    {/* App Version */}
                    <View style={styles.settingItem}>
                        <View style={styles.settingInfo}>
                            <MaterialCommunityIcons 
                                name="information-outline" 
                                size={24} 
                                color={theme.colors.text.secondary} 
                            />
                            <Text style={styles.settingLabel}>{t('settings.version')}</Text>
                        </View>
                        <Text style={styles.versionText}>1.0.0</Text>
                    </View>
                </View>

                {/* Logout Button */}
                <TouchableOpacity 
                    style={styles.logoutButton} 
                    onPress={handleLogout}
                    activeOpacity={0.7}
                >
                    <MaterialCommunityIcons 
                        name="logout" 
                        size={24} 
                        color={theme.colors.error.main} 
                    />
                    <Text style={styles.logoutText}>{t('settings.logout')}</Text>
                </TouchableOpacity>

                {/* Bottom Padding */}
                <View style={styles.bottomPadding} />
            </ScrollView>
        </SafeAreaView>
    );
};

// Styles
const themeStyles = createStyles((theme) => ({
    scrollView: {
        flex: 1,
        backgroundColor: theme.colors.background.secondary,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        paddingHorizontal: theme.spacing.xl,
        paddingTop: theme.spacing['2xl'],
        paddingBottom: theme.spacing.lg,
        backgroundColor: theme.colors.background.primary,
    },
    title: {
        ...theme.typography.heading.h3,
        color: theme.colors.text.primary,
        fontWeight: theme.typography.fontWeight.bold,
    },
    section: {
        backgroundColor: theme.colors.background.primary,
        marginHorizontal: theme.spacing.md,
        marginTop: theme.spacing.lg,
        borderRadius: theme.layout.borderRadius.lg,
        padding: theme.spacing.md,
        ...theme.shadows.small,
    },
    sectionTitle: {
        ...theme.typography.body.small,
        color: theme.colors.text.secondary,
        fontWeight: theme.typography.fontWeight.semibold,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: theme.spacing.md,
        paddingHorizontal: theme.spacing.sm,
    },
    settingItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: theme.spacing.md,
        paddingHorizontal: theme.spacing.sm,
    },
    settingInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    settingText: {
        marginLeft: theme.spacing.md,
        flex: 1,
    },
    settingLabel: {
        ...theme.typography.body.medium,
        color: theme.colors.text.primary,
        marginLeft: theme.spacing.md,
    },
    settingDescription: {
        ...theme.typography.caption,
        color: theme.colors.text.secondary,
        marginTop: 2,
    },
    settingValue: {
        ...theme.typography.body.medium,
        color: theme.colors.text.secondary,
    },
    divider: {
        height: 1,
        backgroundColor: theme.colors.border.light,
        marginVertical: theme.spacing.sm,
    },
    languageOptions: {
        marginTop: theme.spacing.xs,
        marginBottom: theme.spacing.sm,
    },
    languageOption: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: theme.spacing.md,
        paddingHorizontal: theme.spacing.md,
        marginVertical: theme.spacing.xs,
        borderRadius: theme.layout.borderRadius.md,
        backgroundColor: theme.colors.background.secondary,
        borderWidth: 2,
        borderColor: 'transparent',
    },
    languageOptionSelected: {
        backgroundColor: theme.colors.primary.background || '#E3F2FD',
        borderColor: theme.colors.primary.main,
    },
    languageFlag: {
        fontSize: 28,
        marginRight: theme.spacing.md,
    },
    languageTextContainer: {
        flex: 1,
    },
    languageName: {
        ...theme.typography.body.medium,
        color: theme.colors.text.primary,
        fontWeight: theme.typography.fontWeight.medium,
    },
    languageNameSelected: {
        fontWeight: theme.typography.fontWeight.bold,
        color: theme.colors.primary.main,
    },
    languageNameSecondary: {
        ...theme.typography.caption,
        color: theme.colors.text.secondary,
        marginTop: 2,
    },
    versionText: {
        ...theme.typography.body.medium,
        color: theme.colors.text.disabled,
    },
    logoutButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginHorizontal: theme.spacing.md,
        marginTop: theme.spacing.xl,
        paddingVertical: theme.spacing.lg,
        backgroundColor: theme.colors.error.background || '#FFEBEE',
        borderRadius: theme.layout.borderRadius.lg,
        borderWidth: 1,
        borderColor: theme.colors.error.light || '#FFCDD2',
    },
    logoutText: {
        ...theme.typography.body.medium,
        color: theme.colors.error.main,
        fontWeight: theme.typography.fontWeight.semibold,
        marginLeft: theme.spacing.sm,
    },
    bottomPadding: {
        height: theme.spacing['3xl'],
    },
}));

export default SettingsScreen;
