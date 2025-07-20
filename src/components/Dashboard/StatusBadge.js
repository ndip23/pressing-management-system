// src/components/Dashboard/StatusBadge.js
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const StatusBadge = ({ status }) => {
    let color, backgroundColor;
    switch (status) {
        case 'Ready for Pickup': color = '#34c759'; backgroundColor = '#e5f8e9'; break;
        case 'Processing': color = '#007aff'; backgroundColor = '#e0efff'; break;
        case 'Completed': color = '#8e8e93'; backgroundColor = '#e8e8ed'; break;
        case 'Cancelled': color = '#ff3b30'; backgroundColor = '#ffe5e5'; break;
        default: color = '#ff9500'; backgroundColor = '#fff6e5'; // Pending
    }
    return (
        <View style={[styles.badge, { backgroundColor }]}>
            <Text style={[styles.badgeText, { color }]}>{status}</Text>
        </View>
    );
};

const styles = StyleSheet.create({
    badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
    badgeText: { fontSize: 12, fontWeight: '600', textTransform: 'uppercase' },
});
export default StatusBadge;