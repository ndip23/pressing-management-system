// src/screens/Auth/LoginScreen.js
import React, { useState } from 'react';
import { View, StyleSheet, Text, SafeAreaView } from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import Button from '../../components/UI/Button';
import Input from '../../components/UI/Input';

const LoginScreen = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const { login } = useAuth();

    const handleLogin = async () => {
        setLoading(true); setError('');
        try {
            await login(username, password);
        } catch (err) {
            setError(err.message || 'Login failed. Please check your credentials.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.container}>
                <Text style={styles.title}>PressFlow</Text>
                <Input placeholder="Username" value={username} onChangeText={setUsername} autoCapitalize="none" />
                <Input placeholder="Password" value={password} onChangeText={setPassword} secureTextEntry />
                {error ? <Text style={styles.errorText}>{error}</Text> : null}
                <Button title="Login" onPress={handleLogin} isLoading={loading} />
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#f5f5f7' },
    container: { flex: 1, justifyContent: 'center', padding: 24 },
    title: { fontSize: 40, fontWeight: 'bold', textAlign: 'center', marginBottom: 40, color: '#1c1c1e' },
    errorText: { color: '#ff3b30', textAlign: 'center', marginBottom: 12, fontWeight: '500' },
});

export default LoginScreen;