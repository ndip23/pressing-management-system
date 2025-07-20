// src/screens/Dashboard/DashboardScreen.js
import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, RefreshControl } from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import { fetchOrders } from '../../api';
import OrderListItem from '../../components/Orders/OrderListItem';
import Button from '../../components/UI/Button';
import { useNavigation } from '@react-navigation/native'; // Hook for navigation

const DashboardScreen = () => {
    const navigation = useNavigation();
    const { user } = useAuth();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState('');

    const loadOrders = useCallback(async () => {
        setError('');
        try {
            const { data } = await fetchOrders({ pageSize: 50 }); // Fetch recent 50 orders
            setOrders(data.orders || []);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to load orders.');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        // Refetch orders when the screen is focused (e.g., navigating back to it)
        const unsubscribe = navigation.addListener('focus', () => {
            setLoading(true);
            loadOrders();
        });
        return unsubscribe;
    }, [navigation, loadOrders]);

    const onRefresh = () => {
        setRefreshing(true);
        loadOrders();
    };
    
    if (loading) {
        return <ActivityIndicator size="large" color="#007aff" style={{ flex: 1, backgroundColor: '#f5f5f7' }} />;
    }

    const renderEmptyListComponent = () => (
        <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No active orders found.</Text>
            {error ? <Text style={styles.errorText}>{error}</Text> : null}
            <Button title="Try Again" onPress={loadOrders} style={{ width: 150 }} />
        </View>
    );

    return (
        <FlatList
            style={styles.container}
            data={orders}
            renderItem={({ item }) => (
                <OrderListItem item={item} onPress={() => alert(`Navigate to details for ${item.receiptNumber}`)} />
            )}
            keyExtractor={(item) => item._id}
            ListHeaderComponent={() => (<View style={styles.header}><Text style={styles.welcomeText}>Welcome, {user?.username}!</Text></View>)}
            ListEmptyComponent={renderEmptyListComponent}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#007aff" />}
            contentContainerStyle={{ padding: 12 }}
        />
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f5f5f7' },
    header: { padding: 10, marginBottom: 5 },
    welcomeText: { fontSize: 28, fontWeight: 'bold', color: '#1c1c1e' },
    emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 50 },
    emptyText: { fontSize: 16, color: '#8e8e93', marginBottom: 20 },
    errorText: { color: '#ff3b30', marginBottom: 15, textAlign: 'center' },
});

export default DashboardScreen;