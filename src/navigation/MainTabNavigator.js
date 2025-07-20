// src/navigation/MainTabNavigator.js
import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Icon from 'react-native-vector-icons/Ionicons';
import DashboardScreen from '../screens/Dashboard/DashboardScreen';
import NewOrderScreen from '../screens/Orders/NewOrderScreen';
import CustomersScreen from '../screens/Customers/CustomersScreen';

const Tab = createBottomTabNavigator();

const MainTabNavigator = () => (
    <Tab.Navigator
        screenOptions={({ route }) => ({
            tabBarIcon: ({ focused, color, size }) => {
                let iconName;
                if (route.name === 'DashboardTab') {
                    iconName = focused ? 'grid' : 'grid-outline';
                } else if (route.name === 'NewOrderTab') {
                    iconName = focused ? 'add-circle' : 'add-circle-outline';
                } else if (route.name === 'CustomersTab') {
                    iconName = focused ? 'people' : 'people-outline';
                }
                return <Icon name={iconName} size={size} color={color} />;
            },
            tabBarActiveTintColor: '#007aff',
            tabBarInactiveTintColor: '#8e8e93',
            headerStyle: { backgroundColor: '#ffffff' },
            headerTitleStyle: { fontWeight: '600' },
            tabBarStyle: { backgroundColor: '#ffffff', borderTopWidth: 0, elevation: 0 }
        })}
    >
        <Tab.Screen name="DashboardTab" component={DashboardScreen} options={{ title: 'Dashboard' }} />
        <Tab.Screen name="NewOrderTab" component={NewOrderScreen} options={{ title: 'New Order' }} />
        <Tab.Screen name="CustomersTab" component={CustomersScreen} options={{ title: 'Customers' }} />
    </Tab.Navigator>
);
export default MainTabNavigator;