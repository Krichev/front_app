// src/shared/ui/TeamMemberList/TeamMemberList.tsx
import React from 'react'
import {ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View, ViewStyle} from 'react-native'
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons'
import {theme} from '../../styles/theme'

interface TeamMemberListProps {
    members: string[]
    onAddMember: (member: string) => void
    onRemoveMember: (index: number) => void
    newMemberValue: string
    onNewMemberChange: (value: string) => void
    style?: ViewStyle
    allowRemove?: boolean
    placeholder?: string
    maxMembers?: number
}

export const TeamMemberList: React.FC<TeamMemberListProps> = ({
                                                                  members,
                                                                  onAddMember,
                                                                  onRemoveMember,
                                                                  newMemberValue,
                                                                  onNewMemberChange,
                                                                  style,
                                                                  allowRemove = true,
                                                                  placeholder = "Add team member",
                                                                  maxMembers
                                                              }) => {
    const handleAdd = () => {
        if (newMemberValue.trim()) {
            onAddMember(newMemberValue.trim())
        }
    }

    const canAddMore = !maxMembers || members.length < maxMembers

    return (
        <View style={[styles.container, style]}>
            <ScrollView style={styles.membersContainer} nestedScrollEnabled>
                {members.map((member, index) => (
                    <View key={index} style={styles.memberItem}>
                        <Text style={styles.memberName}>{member}</Text>
                        {allowRemove && members.length > 1 && (
                            <TouchableOpacity
                                onPress={() => onRemoveMember(index)}
                                style={styles.removeButton}
                            >
                                <CustomIcon
                                    name="close"
                                    size={16}
                                    color="white"
                                />
                            </TouchableOpacity>
                        )}
                    </View>
                ))}
            </ScrollView>

            {canAddMore && (
                <View style={styles.addContainer}>
                    <TextInput
                        style={styles.input}
                        value={newMemberValue}
                        onChangeText={onNewMemberChange}
                        placeholder={placeholder}
                        onSubmitEditing={handleAdd}
                    />
                    <TouchableOpacity
                        onPress={handleAdd}
                        style={styles.addButton}
                        disabled={!newMemberValue.trim()}
                    >
                        <CustomIcon
                            name="plus"
                            size={20}
                            color="white"
                        />
                    </TouchableOpacity>
                </View>
            )}

            {maxMembers && (
                <Text style={styles.limitText}>
                    {members.length}/{maxMembers} members
                </Text>
            )}
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: theme.colors.background,
        borderRadius: theme.borderRadius.md,
        borderWidth: 1,
        borderColor: theme.colors.border,
        padding: theme.spacing.md,
    },
    membersContainer: {
        maxHeight: 150,
    },
    memberItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: theme.spacing.sm,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.borderLight,
    },
    memberName: {
        fontSize: theme.fontSize.md,
        color: theme.colors.text.primary,
        flex: 1,
    },
    removeButton: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: theme.colors.error,
        alignItems: 'center',
        justifyContent: 'center',
    },
    addContainer: {
        flexDirection: 'row',
        marginTop: theme.spacing.md,
    },
    input: {
        flex: 1,
        height: 40,
        borderWidth: 1,
        borderColor: theme.colors.border,
        borderRadius: theme.borderRadius.sm,
        paddingHorizontal: theme.spacing.md,
        backgroundColor: theme.colors.surface,
        marginRight: theme.spacing.sm,
    },
    addButton: {
        width: 40,
        height: 40,
        borderRadius: theme.borderRadius.sm,
        backgroundColor: theme.colors.primary,
        alignItems: 'center',
        justifyContent: 'center',
    },
    limitText: {
        fontSize: theme.fontSize.xs,
        color: theme.colors.text.light,
        textAlign: 'center',
        marginTop: theme.spacing.xs,
    },
})