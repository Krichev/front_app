import React from 'react';
import { View, TextInput, TouchableOpacity, Text } from 'react-native';
import { themeStyles as styles } from '../styles';

interface QuestionSearchBarProps {
    searchQuery: string;
    onSearchQueryChange: (text: string) => void;
    onSearch: () => void;
}

export const QuestionSearchBar: React.FC<QuestionSearchBarProps> = ({ 
    searchQuery, 
    onSearchQueryChange, 
    onSearch 
}) => {
    return (
        <View style={styles.searchSection}>
            <TextInput
                style={styles.searchInput}
                placeholder="Search questions by keyword..."
                value={searchQuery}
                onChangeText={onSearchQueryChange}
                onSubmitEditing={onSearch}
            />

            <TouchableOpacity
                style={styles.searchButton}
                onPress={onSearch}
            >
                <Text style={styles.buttonText}>Search</Text>
            </TouchableOpacity>
        </View>
    );
};
