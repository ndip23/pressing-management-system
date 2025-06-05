// client/src/services/api.js
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response && error.response.status === 401) {
            console.warn('API request Unauthorized (401):', error.response.data.message);
            // AuthContext logout should ideally handle localStorage.removeItem('token')
            // and redirect.
            // if (window.location.pathname !== '/login') {
            //    window.location.href = '/login';
            // }
        }
        return Promise.reject(error);
    }
);

export const loginUser = (credentials) => api.post('/auth/login', credentials);
export const registerUser = (userData) => api.post('/auth/register', userData);
export const logoutUserApi = () => api.post('/auth/logout');
export const getMe = () => api.get('/auth/me');

export const fetchOrders = (filters = {}) => {
    const queryParams = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
        if (value || typeof value === 'boolean' || typeof value === 'number') { // Keep false booleans and 0 numbers
             if (value !== '' && value !== null && value !== undefined) { // Explicitly check for non-empty values
                queryParams.append(key, value);
            }
        }
    });
    return api.get(`/orders?${queryParams.toString()}`);
};
export const fetchOrderById = (orderId) => api.get(`/orders/${orderId}`);
export const createNewOrder = (orderData) => api.post('/orders', orderData);
export const updateExistingOrder = (orderId, orderData) => api.put(`/orders/${orderId}`, orderData);
export const deleteOrderApi = (orderId) => api.delete(`/orders/${orderId}`);
export const sendManualNotification = (orderId) => api.post(`/orders/${orderId}/notify`); // Ensure this is correct

export const fetchCustomers = (searchQuery = '') => {
    const params = searchQuery ? { search: searchQuery } : {};
    return api.get('/customers', { params });
};
export const fetchCustomerById = (customerId) => api.get(`/customers/${customerId}`);
export const createNewCustomer = (customerData) => api.post('/customers', customerData);
export const updateExistingCustomer = (customerId, customerData) => api.put(`/customers/${customerId}`, customerData);
export const deleteCustomerApi = (customerId) => api.delete(`/customers/${customerId}`);
export const fetchAppSettings = async () => {
    return api.get('/settings');
};

export const updateAppSettingsApi = async (settingsData) => {
    return api.put('/settings', settingsData);
};
export const fetchAdminNotificationsApi = async () => {
    return api.get('/admin-notifications');
};

export const markAdminNotificationReadApi = async (notificationId) => {
    return api.put(`/admin-notifications/${notificationId}/read`);
};

export const markAllAdminNotificationsReadApi = async () => {
    return api.put('/admin-notifications/read-all');
};
export const fetchDailyPaymentsReport = async (date) => { // date should be 'YYYY-MM-DD'
    if (!date) {
        // Or throw an error, or handle default date if needed
        console.error("fetchDailyPaymentsReport: Date parameter is required.");
        return Promise.reject(new Error("Date parameter is required for daily payments report."));
    }
    return api.get(`/reports/daily-payments?date=${date}`);
};

export default api;