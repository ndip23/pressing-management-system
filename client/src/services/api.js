// client/src/services/api.js
import axios from 'axios';
const getBaseUrl = () => {
  // 1. If running on your computer
  if (
    window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1'
  ) {
    return 'http://localhost:5000/api';
  }
  // 2. If running on the live internet
  else {
    return 'https://pressing-management-api.onrender.com/api';
  }
};

const API_URL = getBaseUrl();
console.log(`[api.js] API requests will be sent to: ${API_URL}`);

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});

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
    if (
      error.response &&
      error.response.status === 401 &&
      !window.location.pathname.endsWith('/login')
    ) {
      console.warn(
        '[api.js] Unauthorized (401). Token may be invalid. Redirecting to login.',
      );
      localStorage.removeItem('token');
      window.location.hash = '/login';
    }
    return Promise.reject(error);
  },
);

const PublicAPI = axios.create({ baseURL: API_URL });

export const registerTenantWithSetup = async setupData => {
  return api.post('/public/register-with-setup', setupData);
};

export const getPublicPlansApi = () => PublicAPI.get('/plans');

// --- Authentication & User Profile ---
export const loginUser = credentials => api.post('/auth/login', credentials);
export const logoutUserApi = () => api.post('/auth/logout');
export const getMe = () => api.get('/auth/me');
export const updateMyProfile = profileData => api.put('/auth/me', profileData);
export const requestPasswordChangeOtpApi = async data => {
  return api.post('/auth/me/request-password-change-otp', data);
};

export const confirmPasswordChangeApi = async data => {
  return api.put('/auth/me/confirm-password-change', data);
};
export const initiateRegistrationApi = async setupData => {
  return api.post('/public/initiate-registration', setupData);
};
export const sendContactFormApi = data =>
  PublicAPI.post('/api/public/contact-form', data);

export const finalizeRegistrationApi = async verificationData => {
  // verificationData = { email, otp }
  return api.post('/public/finalize-registration', verificationData);
};
export const getTenantPriceListApi = tenantId =>
  PublicAPI.get(`/public/tenants/${tenantId}/prices`);

// --- Admin User Management ---
export const fetchUsersApi = async () => api.get('/auth/users');
export const createStaffUserApi = async userData =>
  api.post('/auth/register', userData);
export const updateUserByIdApi = async (userId, userData) =>
  api.put(`/auth/users/${userId}`, userData);
export const deleteUserApi = async userId =>
  api.delete(`/auth/users/${userId}`);

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
export const fetchOrderById = orderId => api.get(`/orders/${orderId}`);
export const createNewOrder = orderData => api.post('/orders', orderData);
export const updateExistingOrder = (orderId, orderData) =>
  api.put(`/orders/${orderId}`, orderData);
export const deleteOrderApi = orderId => api.delete(`/orders/${orderId}`);
export const sendManualNotification = orderId =>
  api.post(`/orders/${orderId}/notify`);
export const changeSubscriptionPlanApi = planData =>
  api.post('/subscriptions/change-plan', planData);
export const initiatePaidSubscriptionApi = data =>
  PublicAPI.post('/subscriptions/initiate', data);
export const verifyPaymentAndFinalizeApi = data =>
  PublicAPI.post('/subscriptions/verify-payment', data);
// --- Payments ---
export const markOrderPaidApi = async orderId => {
  return api.put(`/orders/${orderId}/mark-paid`);
};
export const recordPartialPaymentApi = async (orderId, paymentData) => {
  paymentData = amount => {
    if (typeof amount !== 'number' || amount <= 0) {
      throw new Error('Payment amount must be a positive number.');
    }
    return { amount, method: 'Cash' };
  };
  return api.post(`/orders/${orderId}/payments`, paymentData);
};

// --- Customers ---
export const fetchCustomers = (searchQuery = '') => {
  const params = searchQuery ? { search: searchQuery } : {};
  return api.get('/customers', { params });
};
export const fetchCustomerById = customerId =>
  api.get(`/customers/${customerId}`);
export const createNewCustomer = customerData =>
  api.post('/customers', customerData);
export const updateExistingCustomer = (customerId, customerData) =>
  api.put(`/customers/${customerId}`, customerData);
export const deleteCustomerApi = customerId =>
  api.delete(`/customers/${customerId}`);

// --- Settings, Pricing, and Reports ---
export const fetchAppSettings = async () => api.get('/settings');
export const updateAppSettingsApi = async settingsData =>
  api.put('/settings', settingsData);
export const fetchPrices = async () => api.get('/prices');
export const upsertPricesApi = async priceListData =>
  api.put('/prices', priceListData);
export const fetchDailyPaymentsReport = async date => {
  if (!date) return Promise.reject(new Error('Date is required.'));
  return api.get(`/reports/daily-payments`, { params: { date } });
};

// --- Admin Bell Notifications ---
export const fetchAdminNotificationsApi = async () =>
  api.get('/admin-notifications');
export const markAdminNotificationReadApi = async notificationId =>
  api.put(`/admin-notifications/${notificationId}/read`);
export const markAllAdminNotificationsReadApi = async () =>
  api.put('/admin-notifications/read-all');
export const uploadMyProfilePicture = async formData => {
  return api.put('/auth/me/profile-picture', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
};
export const getPublicDirectoryApi = async filters => {
  return api.get('/public/directory', { params: filters });
};
export const getBusinessBySlugApi = async slug =>
  api.get(`/public/directory/${slug}`);
export const getMyTenantProfileApi = async () => {
  return api.get('/tenant-profile');
};

export const updateMyTenantProfileApi = async profileData => {
  return api.put('/tenant-profile', profileData);
};
export const fetchInboundMessagesApi = async (page = 1, pageSize = 25) => {
  return api.get('/inbound-messages', { params: { page, pageSize } });
};
export const recordPaymentApi = async (orderId, paymentData) => {
  return api.post(`/orders/${orderId}/payments`, paymentData);
};
export const getAllPlansAdminApi = () => directoryAdminApi.get('/plans/all');
export const updatePlanApi = (id, planData) =>
  directoryAdminApi.put(`/plans/${id}`, planData);
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

directoryAdminApi.interceptors.response.use(
  response => response,
  error => {
    if (
      error.response &&
      error.response.status === 401 &&
      window.location.pathname.includes('/directory-admin')
    ) {
      console.warn(
        '[api.js] Directory Admin Unauthorized (401). Redirecting to dir-admin login.',
      );
      localStorage.removeItem('directoryAdminToken');
      window.location.href = '/#/directory-admin/login';
    }
    return Promise.reject(error);
  },
);

export const loginDirectoryAdminApi = async credentials => {
  return api.post('/directory-admins/login', credentials);
};

export const getAllDirectoryListingsApi = async () => {
  return directoryAdminApi.get('/directory-admins/listings');
};
export const createDirectoryListingApi = async listingData => {
  return directoryAdminApi.post('/directory-admins/listings', listingData);
};
export const updateDirectoryListingApi = async (id, listingData) => {
  return directoryAdminApi.put(`/directory-admins/listings/${id}`, listingData);
};
export const deleteDirectoryListingApi = async id => {
  return directoryAdminApi.delete(`/directory-admins/listings/${id}`);
};
export const getAllTenantsApi = async () => {
  return api.get('/directory-admins/tenants');
};

export const updateTenantApi = async (id, tenantData) => {
  return api.put(`/directory-admins/tenants/${id}`, tenantData);
};
export const uploadTenantLogoApi = async formData => {
  return api.post('/uploads/tenant-logo', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};

export const uploadListingLogoApi = async formData => {
  return directoryAdminApi.post('/uploads/listing-logo', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};
export default api;
