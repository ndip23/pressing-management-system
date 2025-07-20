// src/components/Orders/OrderListItem.js
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { format, parseISO, isPast } from 'date-fns';
import StatusBadge from '../Dashboard/StatusBadge';

const OrderListItem = ({ item, onPress }) => {
    const isOrderOverdue = item.expectedPickupDate && isPast(parseISO(item.expectedPickupDate)) && !['Completed', 'Cancelled'].includes(item.status);
    const currencySymbol = '$'; // TODO: Get from settings

    return (
        <TouchableOpacity style={styles.container} onPress={onPress}>
            <View style={styles.header}>
                <Text style={styles.receiptNumber}>{item.receiptNumber}</Text>
                <StatusBadge status={item.status} />
            </View>
            <View style={styles.body}>
                <Text style={styles.customerName}>{item.customer?.name || 'N/A'}</Text>
                <Text style={styles.totalAmount}>{currencySymbol}{(item.totalAmount || 0).toFixed(2)}</Text>
            </View>
            <View style={styles.footer}>
                <Text style={[styles.dateText, isOrderOverdue && styles.overdueText]}>
                    Due: {item.expectedPickupDate ? format(parseISO(item.expectedPickupDate), 'MMM d, yyyy') : 'N/A'}
                </Text>
                <Text style={styles.dateText}>
                    Paid: {item.isFullyPaid ? 'Yes' : 'No'}
                </Text>
            </View>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    container: { backgroundColor: '#fff', padding: 16, borderRadius: 12, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 4, elevation: 3 },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
    body: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    receiptNumber: { fontWeight: '600', fontSize: 16, color: '#1c1c1e' },
    customerName: { fontSize: 15, color: '#636366' },
    totalAmount: { fontSize: 16, fontWeight: 'bold', color: '#1c1c1e' },
    footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: '#e8e8ed', paddingTop: 8 },
    dateText: { fontSize: 13, color: '#8e8e93' },
    overdueText: { color: '#ff3b30', fontWeight: 'bold' },
});

export default OrderListItem;