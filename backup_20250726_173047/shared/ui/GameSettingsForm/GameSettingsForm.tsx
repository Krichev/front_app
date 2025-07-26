// src/components/GameSettingsForm.tsx
import React from 'react';
import {StyleSheet, Text, View} from 'react-native';
import {theme} from '../../styles/theme.ts';
import {CustomToggle} from "../Toggle/CustomToggle.tsx";
import {DifficultySelector} from "../DifficultySelector/DifficultySelector.tsx";
import {TeamMemberList} from "../TeamMemberList/TeamMemberList.tsx";
import {CustomCard} from '../Card/CustomCard.tsx';
import {CustomSourceSelector, SourceType} from "../SourceSelector/CustomSourceSelector.tsx";
import {CustomInput} from "../Input/CustomInput.tsx";
import {Difficulty} from "../../lib";
import {CustomButton} from '../index.ts';

export interface GameSettings {
    teamName: string;
    teamMembers: string[];
    difficulty: Difficulty;
    roundTime: number;
    roundCount: number;
    enableAIHost: boolean;
    questionSource: SourceType;
}

interface GameSettingsFormProps {
    settings: GameSettings;
    onSettingsChange: (settings: GameSettings) => void;
    newMemberValue: string;
    onNewMemberChange: (value: string) => void;
    onAddMember: (member: string) => void;
    onRemoveMember: (index: number) => void;
    disabled?: boolean;
    showQuestionSource?: boolean;
}

export const GameSettingsForm: React.FC<GameSettingsFormProps> = ({
                                                                      settings,
                                                                      onSettingsChange,
                                                                      newMemberValue,
                                                                      onNewMemberChange,
                                                                      onAddMember,
                                                                      onRemoveMember,
                                                                      disabled = false,
                                                                      showQuestionSource = true,
                                                                  }) => {
    const updateSetting = <K extends keyof GameSettings>(
        key: K,
        value: GameSettings[K]
    ) => {
        onSettingsChange({
            ...settings,
            [key]: value,
        });
    };

    return (
        <View style={styles.container}>
            {/* Team Setup Section */}
            <CustomCard style={styles.section}>
                <Text style={styles.sectionTitle}>Team Setup</Text>

                <CustomInput
                    label="Team Name"
                    value={settings.teamName}
                    onChangeText={(value: string) => updateSetting('teamName', value)}
                    placeholder="Enter team name"
                    required
                    disabled={disabled}
                />

                <View style={styles.formGroup}>
                    <Text style={styles.label}>Team Members</Text>
                    <TeamMemberList
                        members={settings.teamMembers}
                        onAddMember={onAddMember}
                        onRemoveMember={onRemoveMember}
                        newMemberValue={newMemberValue}
                        onNewMemberChange={onNewMemberChange}
                        placeholder="Add team member"
                        allowRemove={settings.teamMembers.length > 1}
                        maxMembers={6}
                    />
                </View>
            </CustomCard>

            {/* Question Source Section */}
            {showQuestionSource && (
                <CustomCard style={styles.section}>
                    <CustomSourceSelector
                        value={settings.questionSource}
                        onValueChange={(source: any) => updateSetting('questionSource', source)}
                        disabled={disabled}
                    />
                </CustomCard>
            )}

            {/* Game Settings Section */}
            <CustomCard style={styles.section}>
                <Text style={styles.sectionTitle}>Game Settings</Text>

                <View style={styles.formGroup}>
                    <Text style={styles.label}>Difficulty</Text>
                    <DifficultySelector
                        value={settings.difficulty}
                        onValueChange={(difficulty: any) => updateSetting('difficulty', difficulty)}
                        disabled={disabled}
                    />
                </View>

                <View style={styles.formGroup}>
                    <Text style={styles.label}>Discussion Time (seconds)</Text>
                    <View style={styles.buttonGrid}>
                        {[30, 60, 90, 120].map((time) => (
                            <CustomButton
                                key={time}
                                variant={settings.roundTime === time ? 'primary' : 'outline'}
                                size="sm"
                                onPress={() => updateSetting('roundTime', time)}
                                style={styles.timeButton}
                                disabled={disabled}
                            >
                                {time.toString()}
                            </CustomButton>
                        ))}
                    </View>
                </View>

                <View style={styles.formGroup}>
                    <Text style={styles.label}>Number of Questions</Text>
                    <View style={styles.buttonGrid}>
                        {[5, 10, 15, 20].map((count) => (
                            <CustomButton
                                key={count}
                                variant={settings.roundCount === count ? 'primary' : 'outline'}
                                size="sm"
                                onPress={() => updateSetting('roundCount', count)}
                                style={styles.countButton}
                                disabled={disabled}
                            >
                                {count.toString()}
                            </CustomButton>
                        ))}
                    </View>
                </View>

                <View style={styles.formGroup}>
                    <CustomToggle
                        value={settings.enableAIHost}
                        onValueChange={(value: boolean) => updateSetting('enableAIHost', value)}
                        label="Enable AI Host"
                        disabled={disabled}
                    />
                    <Text style={styles.helperText}>
                        {settings.enableAIHost
                            ? "AI Host will analyze team discussions and provide feedback"
                            : "AI Host features will be disabled"}
                    </Text>
                </View>
            </CustomCard>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    section: {
        marginBottom: theme.spacing.lg,
    },
    sectionTitle: {
        fontSize: theme.fontSize.lg,
        fontWeight: theme.fontWeight.bold,
        color: theme.colors.text.primary,
        marginBottom: theme.spacing.lg,
    },
    formGroup: {
        marginBottom: theme.spacing.lg,
    },
    label: {
        fontSize: theme.fontSize.md,
        fontWeight: theme.fontWeight.medium,
        color: theme.colors.text.secondary,
        marginBottom: theme.spacing.sm,
    },
    buttonGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: theme.spacing.sm,
    },
    timeButton: {
        minWidth: 60,
        marginBottom: theme.spacing.sm,
    },
    countButton: {
        minWidth: 50,
        marginBottom: theme.spacing.sm,
    },
    helperText: {
        fontSize: theme.fontSize.sm,
        color: theme.colors.text.light,
        fontStyle: 'italic',
        marginTop: theme.spacing.xs,
    },
});

export default GameSettingsForm;