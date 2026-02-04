import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, TextInput, ActivityIndicator } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTheme } from '../../../shared/ui/theme';

interface TimeExtensionRequestModalProps {
    visible: boolean;
    onClose: () => void;
    onSubmit: (minutes: number, reason: string) => Promise<void>;
    isLoading: boolean;
}

export const TimeExtensionRequestModal: React.FC<TimeExtensionRequestModalProps> = ({
    visible,
    onClose,
    onSubmit,
    isLoading
}) => {
    const { theme } = useTheme();
    const [minutes, setMinutes] = useState(15);
    const [reason, setReason] = useState('');

    const handleSubmit = () => {
        onSubmit(minutes, reason);
    };

    if (!visible) return null;

    return (
        <Modal
            visible={visible}
            transparent={true}
            animationType="slide"
            onRequestClose={onClose}
        >
            <View style={styles.centeredView}>
                <View style={[styles.modalView, { backgroundColor: theme.colors.background.primary }]}>
                    <Text style={[styles.modalTitle, { color: theme.colors.text.primary }]}>Request More Time</Text>
                    
                    <Text style={[styles.label, { color: theme.colors.text.secondary }]}>Duration:</Text>
                    <View style={styles.optionsContainer}>
                        {[15, 30, 45, 60].map((option) => (
                            <TouchableOpacity
                                key={option}
                                style={[
                                    styles.optionButton,
                                    minutes === option && { backgroundColor: theme.colors.primary.main },
                                    { borderColor: theme.colors.border.light }
                                ]}
                                onPress={() => setMinutes(option)}
                            >
                                <Text style={[
                                    styles.optionText,
                                    { color: minutes === option ? theme.colors.text.inverse : theme.colors.text.primary }
                                ]}>
                                    {option}m
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    <Text style={[styles.label, { color: theme.colors.text.secondary }]}>Reason (optional):</Text>
                    <TextInput
                        style={[styles.input, { 
                            color: theme.colors.text.primary,
                            borderColor: theme.colors.border.light,
                            backgroundColor: theme.colors.background.secondary 
                        }]}
                        placeholder="Why do you need more time?"
                        placeholderTextColor={theme.colors.text.disabled}
                        value={reason}
                        onChangeText={setReason}
                        multiline
                        numberOfLines={3}
                    />

                    <View style={styles.footer}>
                        <TouchableOpacity 
                            style={[styles.button, styles.cancelButton]} 
                            onPress={onClose}
                            disabled={isLoading}
                        >
                            <Text style={[styles.buttonText, { color: theme.colors.text.secondary }]}>Cancel</Text>
                        </TouchableOpacity>
                        
                        <TouchableOpacity 
                            style={[styles.button, { backgroundColor: theme.colors.primary.main }]} 
                            onPress={handleSubmit}
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <ActivityIndicator size="small" color={theme.colors.text.inverse} />
                            ) : (
                                <Text style={[styles.buttonText, { color: theme.colors.text.inverse }]}>Send Request</Text>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    centeredView: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        padding: 20,
    },
    modalView: {
        width: '100%',
        borderRadius: 20,
        padding: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 20,
        textAlign: 'center',
    },
    label: {
        fontSize: 14,
        marginBottom: 8,
        fontWeight: '600',
    },
    optionsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 20,
    },
    optionButton: {
        flex: 1,
        paddingVertical: 10,
        marginHorizontal: 4,
        borderRadius: 8,
        borderWidth: 1,
        alignItems: 'center',
    },
    optionText: {
        fontWeight: 'bold',
    },
    input: {
        borderWidth: 1,
        borderRadius: 8,
        padding: 12,
        height: 80,
        textAlignVertical: 'top',
        marginBottom: 24,
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
    },
    button: {
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 10,
        marginLeft: 10,
        minWidth: 100,
        alignItems: 'center',
    },
    cancelButton: {
        backgroundColor: 'transparent',
    },
    buttonText: {
        fontWeight: 'bold',
        fontSize: 16,
    },
});
