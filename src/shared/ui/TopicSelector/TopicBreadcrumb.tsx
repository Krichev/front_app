// src/shared/ui/TopicSelector/TopicBreadcrumb.tsx
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

interface TopicBreadcrumbProps {
    path: string;  // Full path string (e.g., "Geography > Geology > Minerals")
    onSegmentPress?: (segment: string, index: number) => void;
}

const TopicBreadcrumb: React.FC<TopicBreadcrumbProps> = ({ path, onSegmentPress }) => {
    const segments = path.split(' > ').filter(Boolean);

    if (segments.length === 0) {
        return null;
    }

    return (
        <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.container}
            contentContainerStyle={styles.contentContainer}
        >
            {segments.map((segment, index) => (
                <View key={index} style={styles.segmentContainer}>
                    {onSegmentPress ? (
                        <TouchableOpacity
                            onPress={() => onSegmentPress(segment, index)}
                            activeOpacity={0.7}
                        >
                            <Text
                                style={[
                                    styles.segment,
                                    index === segments.length - 1 && styles.lastSegment,
                                ]}
                            >
                                {segment}
                            </Text>
                        </TouchableOpacity>
                    ) : (
                        <Text
                            style={[
                                styles.segment,
                                index === segments.length - 1 && styles.lastSegment,
                            ]}
                        >
                            {segment}
                        </Text>
                    )}

                    {index < segments.length - 1 && (
                        <MaterialCommunityIcons
                            name="chevron-right"
                            size={16}
                            color="#999"
                            style={styles.chevron}
                        />
                    )}
                </View>
            ))}
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        maxHeight: 30,
    },
    contentContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 4,
    },
    segmentContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    segment: {
        fontSize: 14,
        color: '#007AFF',
        fontWeight: '500',
    },
    lastSegment: {
        color: '#000',
        fontWeight: '600',
    },
    chevron: {
        marginHorizontal: 4,
    },
});

export default TopicBreadcrumb;
