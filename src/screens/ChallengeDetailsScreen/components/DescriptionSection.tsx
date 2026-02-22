import React from 'react';
import { Text, View } from 'react-native';
import { styles } from '../styles';

interface DescriptionSectionProps {
    description: string;
}

export const DescriptionSection: React.FC<DescriptionSectionProps> = ({
    description,
}) => {
    return (
        <View style={styles.descriptionContainer}>
            <Text style={styles.descriptionTitle}>Description</Text>
            <Text style={styles.descriptionText}>{description}</Text>
        </View>
    );
};
