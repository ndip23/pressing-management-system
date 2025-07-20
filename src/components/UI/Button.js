// src/components/UI/Button.js
import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator } from 'react-native';

const Button = ({ title, onPress, isLoading = false, style, textStyle }) => (
    <TouchableOpacity style={[styles.button, style]} onPress={onPress} disabled={isLoading}>
        {isLoading ? <ActivityIndicator color="#ffffff" /> : <Text style={[styles.text, textStyle]}>{title}</Text>}
    </TouchableOpacity>
);

const styles = StyleSheet.create({
    button: {
        backgroundColor: '#007aff',
        paddingVertical: 15,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 50,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.20,
        shadowRadius: 1.41,
        elevation: 2,
    },
    text: { color: '#ffffff', fontSize: 17, fontWeight: '600' },
});
export default Button;