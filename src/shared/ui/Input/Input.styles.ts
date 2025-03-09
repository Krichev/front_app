import {StyleSheet} from "react-native";

const styles = StyleSheet.create({
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 24,
        borderWidth: 2,
        borderColor: '#ccc',
        paddingHorizontal: 16,
        backgroundColor: 'white',
    },
    sizeS: {
        height: 32,
    },
    sizeM: {
        height: 38,
    },
    sizeL: {
        height: 44,
    },
    addonLeft: {
        marginRight: 8,
    },
    addonRight: {
        marginLeft: 8,
    },
    input: {
        flex: 1,
        color: '#333',
        fontSize: 16,
        paddingVertical: 8,
    },
    focused: {
        borderColor: 'blue',
    },
    readonly: {
        opacity: 0.7,
        backgroundColor: '#f0f0f0',
    },
    labelContainer: {
        width: '100%',
        marginBottom: 8,
    },
    label: {
        fontSize: 16,
        marginBottom: 4,
        color: '#333',
    },
});

export default styles;