import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { themeStyles as styles } from '../styles';

interface RecentSearchChipsProps {
    recentSearches: string[];
    onChipPress: (search: string) => void;
}

export const RecentSearchChips: React.FC<RecentSearchChipsProps> = ({ 
    recentSearches, 
    onChipPress 
}) => {
    if (recentSearches.length === 0) return null;

    return (
        <View style={styles.recentSearches}>
            <Text style={styles.sectionLabel}>Recent Searches:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {recentSearches.map((search, index) => (
                    <TouchableOpacity
                        key={`${search}-${index}`}
                        style={styles.recentSearchItem}
                        onPress={() => onChipPress(search)}
                    >
                        <Text style={styles.recentSearchText}>{search}</Text>
                    </TouchableOpacity>
                ))}
            </ScrollView>
        </View>
    );
};
