import axios from 'axios';

const getBaseUrl = () => {
  if (
    window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1'
  ) {
    return 'http://localhost:5000/api';
  } else {
    return 'https://lsmbooker-api.onrender.com/api';
  }
};

const API_URL = getBaseUrl();

// 1. Create the main instance
export const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true
});

// 🌟 NEW: HELPER TO MANUALLY SET HEADERS INSTANTLY
// This prevents the 401 error by forcing the token into the instance
export const setAuthHeader = (token) => {
  if (token) {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common['Authorization'];
  }
};

// --- Interceptors ---
api.interceptors.request.use(
  config => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  error => Promise.reject(error),
);

api.interceptors.response.use(
  response => response,
  error => {
    // If we get a 401 and we aren't on a public page, logout
    if (
      error.response &&
      error.response.status === 401 &&
      !window.location.pathname.includes('/login') &&
      !window.location.pathname.includes('/signup')
    ) {
      console.warn('[api.js] Unauthorized. Clearing token.');
      localStorage.removeItem('token');
      // Use window.location.href to force a hard redirect if context fails
      if (!window.location.hash.includes('login')) {
         window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  },
);

const PublicAPI = axios.create({ 
    baseURL: API_URL,
    headers: { 'Content-Type': 'application/json' },
    withCredentials: true 
});

// --- API EXPORTS ---

export const registerTenantWithSetup = async setupData => {
  return api.post('/public/register-with-setup', setupData);
};

export const getPublicPlansApi = () => PublicAPI.get('/plans');

// --- Authentication & User Profile ---
export const loginUser = credentials => api.post('/auth/login', credentials);
export const logoutUserApi = () => api.post('/auth/logout');
export const getMe = () => api.get('/auth/me');
export const updateMyProfile = profileData => api.put('/auth/me', profileData);
export const requestPasswordChangeOtpApi = async data => api.post('/auth/me/request-password-change-otp', data);
export const confirmPasswordChangeApi = async data => api.put('/auth/me/confirm-password-change', data);

// This is the one used in your SignUpPage
export const initiateRegistrationApi = async setupData => {
  return PublicAPI.post('/public/initiate-registration', setupData);
};

// Fixed path: removed extra '/api' prefix since baseURL already has it
export const sendContactFormApi = data => PublicAPI.post('/public/contact-form', data);

export const getBusinessGalleryApi = async (tenantId) => {
    return PublicAPI.get(`/gallery/${tenantId}`, {
        headers: { 'Cache-Control': 'max-age=3600' }
    });
};

export const uploadGalleryImageApi = async (formData) => {
    return api.post('/gallery/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    });
};

export const deleteGalleryImageApi = (imageId) => api.delete(`/gallery/${imageId}`);

export const finalizeRegistrationApi = async verificationData => api.post('/public/finalize-registration', verificationData);
export const getTenantPriceListApi = tenantId => PublicAPI.get(`/public/tenants/${tenantId}/prices`);

// --- Admin User Management ---
export const fetchUsersApi = async () => api.get('/auth/users');
export const createStaffUserApi = async userData => api.post('/auth/register', userData);
export const updateUserByIdApi = async (userId, userData) => api.put(`/auth/users/${userId}`, userData);
export const deleteUserApi = async userId => api.delete(`/auth/users/${userId}`);

// --- Orders ---
export const fetchOrders = async (filters = {}) => {
  const validFilters = Object.entries(filters).reduce((acc, [key, value]) => {
    if (value !== null && value !== undefined && value !== '') {
      acc[key] = value;
    }
    return acc;
  }, {});
  return api.get('/orders', { params: validFilters });
};
export const fetchDashboardOrderSummary = () => api.get('/orders/dashboard-summary');
export const fetchOrderById = orderId => api.get(`/orders/${orderId}`);
export const createNewOrder = orderData => api.post('/orders', orderData);
export const updateExistingOrder = (orderId, orderData) => api.put(`/orders/${orderId}`, orderData);
export const deleteOrderApi = orderId => api.delete(`/orders/${orderId}`);
export const sendManualNotification = orderId => api.post(`/orders/${orderId}/notify`);

// --- Subscriptions ---
export const changeSubscriptionPlanApi = planData => api.post('/subscriptions/change-plan', planData);
export const initiatePaidSubscriptionApi = data => PublicAPI.post('/subscriptions/initiate', data);
export const verifyPaymentAndFinalizeApi = data => PublicAPI.post('/subscriptions/verify-payment', data);

// --- Payments ---
export const markOrderPaidApi = async orderId => api.put(`/orders/${orderId}/mark-paid`);
export const recordPartialPaymentApi = async (orderId, paymentData) => api.post(`/orders/${orderId}/payments`, paymentData);

// --- Customers ---
export const fetchCustomers = (searchQuery = '') => {
  const params = searchQuery ? { search: searchQuery } : {};
  return api.get('/customers', { params });
};
export const fetchCustomerById = customerId => api.get(`/customers/${customerId}`);
export const createNewCustomer = customerData => api.post('/customers', customerData);
export const updateExistingCustomer = (customerId, customerData) => api.put(`/customers/${customerId}`, customerData);
export const deleteCustomerApi = customerId => api.delete(`/customers/${customerId}`);

// --- Settings, Pricing, and Reports ---
export const fetchAppSettings = async () => api.get('/settings');
export const updateAppSettingsApi = async settingsData => api.put('/settings', settingsData);
export const fetchPrices = async () => api.get('/prices');
export const upsertPricesApi = async priceListData => api.put('/prices', priceListData);
export const fetchDailyPaymentsReport = async date => api.get(`/reports/daily-payments`, { params: { date } });
export const fetchWalletDepositReport = async ({ date, range }) => api.get('/reports/wallet-deposits', { params: { date, range } });

// --- Admin Bell Notifications ---
export const fetchAdminNotificationsApi = async () => api.get('/admin-notifications');
export const markAdminNotificationReadApi = async notificationId => api.put(`/admin-notifications/${notificationId}/read`);
export const markAllAdminNotificationsReadApi = async () => api.put('/admin-notifications/read-all');
export const uploadMyProfilePicture = async formData => {
  return api.put('/auth/me/profile-picture', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};

// --- Directory ---
export const getPublicDirectoryApi = async filters => PublicAPI.get('/public/directory', { params: filters });
export const getBusinessBySlugApi = async slug => PublicAPI.get(`/public/directory/${slug}`);
export const contactBusinessViaWhatsAppApi = (slug, message) => PublicAPI.post(`/public/directory/${slug}/whatsapp-contact`, { message });
export const getMyTenantProfileApi = async () => api.get('/tenant-profile');
export const topUpMyWalletApi = (amount, currency = 'USD') => api.put('/tenant-profile/wallet', { amount, currency });
export const updateWalletPaymentCountryApi = (countryCode) => api.put('/subscriptions/wallet-payment-country', { countryCode });
export const initiateWalletTopUpPaymentApi = (amount, countryCode) => api.post('/subscriptions/wallet-topup', { amount, countryCode });
export const getWalletTopUpEstimateApi = (amount, countryCode) => api.get('/subscriptions/wallet-topup-estimate', { params: { amount, countryCode } });
export const getPlanBySlug = async (slug) => PublicAPI.get(`/plans/${slug}`); 
export const getPlanPrice = async (planSlug, countryCode) => PublicAPI.get(`/plans/${planSlug}/price/${countryCode}`);
export const updateMyTenantProfileApi = async profileData => api.put('/tenant-profile', profileData);
export const fetchInboundMessagesApi = async (page = 1, pageSize = 25) => api.get('/inbound-messages', { params: { page, pageSize } });
export const recordPaymentApi = async (orderId, paymentData) => api.post(`/orders/${orderId}/payments`, paymentData);

// --- DIRECTORY ADMIN API ---
const directoryAdminApi = axios.create({ baseURL: API_URL });

directoryAdminApi.interceptors.request.use(
  config => {
    const token = localStorage.getItem('directoryAdminToken');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  error => Promise.reject(error),
);

export const loginDirectoryAdminApi = async credentials => api.post('/directory-admins/login', credentials);
export const getAllPlansAdminApi = () => directoryAdminApi.get('/plans/admin/all');
export const updatePlanApi = (id, planData) => directoryAdminApi.put(`/plans/admin/${id}`, planData);
export const getAllDirectoryListingsApi = async () => directoryAdminApi.get('/directory-admins/listings');
export const createDirectoryListingApi = async listingData => directoryAdminApi.post('/directory-admins/listings', listingData);
export const updateDirectoryListingApi = async (id, listingData) => directoryAdminApi.put(`/directory-admins/listings/${id}`, listingData);
export const deleteDirectoryListingApi = async id => directoryAdminApi.delete(`/directory-admins/listings/${id}`);
export const getAllTenantsApi = async () => api.get('/directory-admins/tenants');
export const updateTenantApi = async (id, tenantData) => api.put(`/directory-admins/tenants/${id}`, tenantData);
export const uploadTenantLogoApi = async formData => api.post('/uploads/tenant-logo', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
export const uploadListingLogoApi = async formData => directoryAdminApi.post('/uploads/listing-logo', formData, { headers: { 'Content-Type': 'multipart/form-data' } });

export default api;