// src/components/UI/Input.js
import React from 'react';
import { TextInput, StyleSheet } from 'react-native';

const Input = (props) => (
    <TextInput style={styles.input} placeholderTextColor="#8e8e93" {...props} />
);

const styles = StyleSheet.create({
    input: {
        height: 50,
        borderColor: '#d2d2d7',
        borderWidth: 1,
        borderRadius: 12, // More iOS-like
        marginBottom: 16,
        paddingHorizontal: 15,
        backgroundColor: '#ffffff',
        fontSize: 16,
        color: '#1c1c1e',
    },
});
export default Input;