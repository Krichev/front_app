// src/features/speech-to-text/ui/SpeechResultDisplay.tsx
// src/features/speech-to-text/ui/SpeechSettings.tsx
import React from 'react';
import {ScrollView, StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import {MaterialCommunityIcons} from '@expo/vector-icons';
import {useSpeechToText} from '../lib/hooks';
import type {SpeechToTextMode} from '../model/types';

interface SpeechResultDisplayProps {
    maxHeight?: number;
    showHistory?: boolean;
    onResultPress?: (text: string) => void;
}

export const SpeechResultDisplay: React.FC<SpeechResultDisplayProps> = ({
                                                                            maxHeight = 200,
                                                                            showHistory = true,
                                                                            onResultPress,
                                                                        }) => {
    const {
        currentResult,
        finalResult,
        transcriptHistory,
        clearResults,
        hasResults
    } = useSpeechToText();

    if (!hasResults && transcriptHistory.length === 0) {
        return null;
    }

    return (
        <View style={[styles.container, { maxHeight }]}>
            <View style={styles.header}>
                <Text style={styles.title}>Speech Results</Text>
                <TouchableOpacity onPress={clearResults} style={styles.clearButton}>
                    <CustomIcon name="close" size={20} color="#666" />
                </TouchableOpacity>
            </View>

            <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
                {/* Current/Final Result */}
                {(currentResult || finalResult) && (
                    <TouchableOpacity
                        style={[styles.resultItem, styles.currentResult]}
                        onPress={() => onResultPress?.(finalResult || currentResult)}
                    >
                        <Text style={styles.resultText}>
                            {finalResult || currentResult}
                            {currentResult && !finalResult && (
                                <Text style={styles.interimIndicator}> ...</Text>
                            )}
                        </Text>
                        {finalResult && (
                            <CustomIcon name="check" size={16} color="#51cf66" />
                        )}
                    </TouchableOpacity>
                )}

                {/* History */}
                {showHistory && transcriptHistory.map((item) => (
                    <TouchableOpacity
                        key={item.id}
                        style={styles.resultItem}
                        onPress={() => onResultPress?.(item.text)}
                    >
                        <View style={styles.historyItem}>
                            <Text style={styles.historyText}>{item.text}</Text>
                            <View style={styles.historyMeta}>
                                <Text style={styles.timestamp}>
                                    {new Date(item.timestamp).toLocaleTimeString()}
                                </Text>
                                <View style={[
                                    styles.confidenceBadge,
                                    { backgroundColor: item.confidence > 0.8 ? '#51cf66' : '#ffd43b' }
                                ]}>
                                    <Text style={styles.confidenceText}>
                                        {Math.round(item.confidence * 100)}%
                                    </Text>
                                </View>
                            </View>
                        </View>
                    </TouchableOpacity>
                ))}
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: 'white',
        borderRadius: 8,
        marginVertical: 8,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.22,
        shadowRadius: 2.22,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    title: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
    },
    clearButton: {
        padding: 4,
    },
    scrollView: {
        maxHeight: 150,
    },
    resultItem: {
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#f5f5f5',
    },
    currentResult: {
        backgroundColor: '#f8f9ff',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    resultText: {
        fontSize: 16,
        color: '#333',
        flex: 1,
    },
    interimIndicator: {
        color: '#666',
        fontStyle: 'italic',
    },
    historyItem: {
        flex: 1,
    },
    historyText: {
        fontSize: 14,
        color: '#555',
        marginBottom: 4,
    },
    historyMeta: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    timestamp: {
        fontSize: 12,
        color: '#999',
    },
    confidenceBadge: {
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 10,
    },
    confidenceText: {
        fontSize: 10,
        color: 'white',
        fontWeight: '600',
    },
});

interface SpeechSettingsProps {
    showModeSelector?: boolean;
    showLanguageSelector?: boolean;
    onClose?: () => void;
}

export const SpeechSettings: React.FC<SpeechSettingsProps> = ({
                                                                  showModeSelector = true,
                                                                  showLanguageSelector = true,
                                                                  onClose,
                                                              }) => {
    const { config, setMode } = useSpeechToText();

    const modes: Array<{ key: SpeechToTextMode; label: string; icon: string }> = [
        { key: 'command', label: 'Commands', icon: 'microphone' },
        { key: 'dictation', label: 'Dictation', icon: 'text-to-speech' },
        { key: 'discussion', label: 'Discussion', icon: 'account-group' },
        { key: 'continuous', label: 'Continuous', icon: 'record-rec' },
    ];

    const languages = [
        { key: 'en-US', label: 'English (US)' },
        { key: 'en-GB', label: 'English (UK)' },
        { key: 'es-ES', label: 'Spanish' },
        { key: 'fr-FR', label: 'French' },
        { key: 'de-DE', label: 'German' },
        { key: 'it-IT', label: 'Italian' },
        { key: 'pt-BR', label: 'Portuguese' },
        { key: 'ru-RU', label: 'Russian' },
        { key: 'zh-CN', label: 'Chinese' },
        { key: 'ja-JP', label: 'Japanese' },
    ];

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Speech Settings</Text>
                {onClose && (
                    <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                        <CustomIcon name="close" size={24} color="#666" />
                    </TouchableOpacity>
                )}
            </View>

            {showModeSelector && (
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Recognition Mode</Text>
                    <View style={styles.optionsGrid}>
                        {modes.map((mode) => (
                            <TouchableOpacity
                                key={mode.key}
                                style={[
                                    styles.modeOption,
                                    config.mode === mode.key && styles.selectedOption,
                                ]}
                                onPress={() => setMode(mode.key)}
                            >
                                <CustomIcon
                                    name={mode.icon}
                                    size={24}
                                    color={config.mode === mode.key ? '#4dabf7' : '#666'}
                                />
                                <Text
                                    style={[
                                        styles.optionLabel,
                                        config.mode === mode.key && styles.selectedLabel,
                                    ]}
                                >
                                    {mode.label}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>
            )}

            {showLanguageSelector && (
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Language</Text>
                    <View style={styles.languageList}>
                        {languages.map((lang) => (
                            <TouchableOpacity
                                key={lang.key}
                                style={[
                                    styles.languageOption,
                                    config.language === lang.key && styles.selectedLanguage,
                                ]}
                                onPress={() => {
                                    // Update language - this would need to be implemented in the hook
                                    console.log('Language selected:', lang.key);
                                }}
                            >
                                <Text
                                    style={[
                                        styles.languageLabel,
                                        config.language === lang.key && styles.selectedLabel,
                                    ]}
                                >
                                    {lang.label}
                                </Text>
                                {config.language === lang.key && (
                                    <CustomIcon name="check" size={20} color="#4dabf7" />
                                )}
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: 'white',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        paddingBottom: 20,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    title: {
        fontSize: 18,
        fontWeight: '600',
        color: '#333',
    },
    closeButton: {
        padding: 4,
    },
    section: {
        paddingHorizontal: 20,
        paddingVertical: 16,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '500',
        color: '#333',
        marginBottom: 12,
    },
    optionsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },
    modeOption: {
        flex: 1,
        minWidth: '45%',
        alignItems: 'center',
        paddingVertical: 16,
        paddingHorizontal: 12,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#e0e0e0',
    },
    selectedOption: {
        borderColor: '#4dabf7',
        backgroundColor: '#f0f8ff',
    },
    optionLabel: {
        marginTop: 8,
        fontSize: 14,
        color: '#666',
        textAlign: 'center',
    },
    selectedLabel: {
        color: '#4dabf7',
        fontWeight: '500',
    },
    languageList: {
        gap: 8,
    },
    languageOption: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#e0e0e0',
    },
    selectedLanguage: {
        borderColor: '#4dabf7',
        backgroundColor: '#f0f8ff',
    },
    languageLabel: {
        fontSize: 16,
        color: '#333',
    },
});