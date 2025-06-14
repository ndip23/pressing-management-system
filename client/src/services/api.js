import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api'; 
console.log(`[api.js] API_URL determined as: ${API_URL}`);

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor (for token)
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
        }
        // Log outgoing requests for debugging (optional, can be verbose)
        // console.log(`[api.js] Sending ${config.method.toUpperCase()} request to ${config.url}`, config.params || config.data || '');
        return config;
    },
    (error) => {
        console.error("[api.js] Request Error Interceptor:", error);
        return Promise.reject(error);
    }
);


api.interceptors.response.use(
    (response) => response, 
    (error) => {
        console.error("[api.js] Response Error Interceptor - Error object:", error);
        if (error.response) {
           
            console.error("[api.js] Response Error - Data:", error.response.data);
            console.error("[api.js] Response Error - Status:", error.response.status);
            console.error("[api.js] Response Error - Headers:", error.response.headers);
            if (error.response.status === 401) {
                console.warn('[api.js] API request Unauthorized (401):', error.response.data?.message || 'Token may be invalid or expired.');
                 if (window.location.pathname !== '/login') {
                   localStorage.removeItem('token'); 
                    window.location.href = '/login'; 
                }
            }
        } else if (error.request) {
            
            console.error("[api.js] Network Error or No Response:", error.request);
        } else {
           
            console.error('[api.js] Axios Request Setup Error:', error.message);
        }
        return Promise.reject(error); 
    }
);

export const loginUser = (credentials) => api.post('/auth/login', credentials);
export const registerUser = (userData) => api.post('/auth/register', userData); 
export const logoutUserApi = () => api.post('/auth/logout');
export const getMe = () => api.get('/auth/me');
export const updateMyProfile = (profileData) => api.put('/auth/me', profileData);
export const changeMyPassword = (passwordData) => api.put('/auth/me/change-password', passwordData);

export const fetchOrders = async (filters = {}) => {
    console.log("[api.js] fetchOrders called with filters:", filters);
    return api.get('/orders', { params: filters });
};
export const fetchOrderById = (orderId) => api.get(`/orders/${orderId}`);
export const createNewOrder = (orderData) => api.post('/orders', orderData);
export const updateExistingOrder = (orderId, orderData) => api.put(`/orders/${orderId}`, orderData);
export const deleteOrderApi = (orderId) => api.delete(`/orders/${orderId}`);
export const sendManualNotification = (orderId) => api.post(`/orders/${orderId}/notify`);
export const markOrderPaidApi = async (orderId) => api.put(`/orders/${orderId}/mark-paid`);

export const fetchCustomers = (searchQuery = '') => {
    const params = searchQuery ? { search: searchQuery } : {};
    return api.get('/customers', { params });
};
export const fetchCustomerById = (customerId) => api.get(`/customers/${customerId}`);
export const createNewCustomer = (customerData) => api.post('/customers', customerData);
export const updateExistingCustomer = (customerId, customerData) => api.put(`/customers/${customerId}`, customerData);
export const deleteCustomerApi = (customerId) => api.delete(`/customers/${customerId}`);

export const fetchAppSettings = async () => api.get('/settings');
export const updateAppSettingsApi = async (settingsData) => api.put('/settings', settingsData);

export const fetchAdminNotificationsApi = async () => api.get('/admin-notifications');
export const markAdminNotificationReadApi = async (notificationId) => api.put(`/admin-notifications/${notificationId}/read`);
export const markAllAdminNotificationsReadApi = async () => api.put('/admin-notifications/read-all');

export const fetchDailyPaymentsReport = async (date) => { // date should be 'YYYY-MM-DD'
    if (!date) {
        // Or throw an error, or handle default date if needed
        console.error("fetchDailyPaymentsReport: Date parameter is required.");
        return Promise.reject(new Error("Date parameter is required for daily payments report."));
    }
    return api.get(`/reports/daily-payments?date=${date}`);
};


export default api;