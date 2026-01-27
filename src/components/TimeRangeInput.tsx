import React from 'react';
import {View, Text, TextInput, StyleSheet} from 'react-native';
import {formatSecondsToTimestamp, parseTimestampToSeconds} from '../utils/youtubeUtils';

interface TimeRangeInputProps {
    startTime: number;
    endTime?: number;
    onStartTimeChange: (time: number) => void;
    onEndTimeChange: (time: number) => void;
}

const TimeRangeInput: React.FC<TimeRangeInputProps> = ({
    startTime,
    endTime,
    onStartTimeChange,
    onEndTimeChange,
}) => {
    const handleStartChange = (text: string) => {
        const seconds = parseTimestampToSeconds(text);
        onStartTimeChange(seconds);
    };

    const handleEndChange = (text: string) => {
        const seconds = parseTimestampToSeconds(text);
        onEndTimeChange(seconds);
    };

    return (
        <View style={styles.container}>
            <View style={styles.inputGroup}>
                <Text style={styles.label}>Start Time</Text>
                <TextInput
                    style={styles.input}
                    placeholder="00:00"
                    defaultValue={formatSecondsToTimestamp(startTime)}
                    onChangeText={handleStartChange}
                    keyboardType="numbers-and-punctuation"
                />
            </View>
            <View style={styles.separator}>
                <Text>-</Text>
            </View>
            <View style={styles.inputGroup}>
                <Text style={styles.label}>End Time</Text>
                <TextInput
                    style={styles.input}
                    placeholder="00:00"
                    defaultValue={endTime ? formatSecondsToTimestamp(endTime) : ''}
                    onChangeText={handleEndChange}
                    keyboardType="numbers-and-punctuation"
                />
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: 8,
    },
    inputGroup: {
        flex: 1,
    },
    label: {
        fontSize: 12,
        color: '#666',
        marginBottom: 4,
    },
    input: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 4,
        padding: 8,
        fontSize: 14,
        textAlign: 'center',
    },
    separator: {
        paddingHorizontal: 10,
        paddingTop: 16,
    },
});

export default TimeRangeInput;
