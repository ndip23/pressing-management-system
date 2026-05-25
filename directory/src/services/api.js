import axios from 'axios';

const API_URL = 'http://localhost:8000/api'
console.log(`[api.js] API requests will be sent to: ${API_URL}`);
const PublicAPI = axios.create({ baseURL: API_URL });
const api = axios.create({
    baseURL: API_URL,
    headers: { 'Content-Type': 'application/json' },
});

// --- DIRECTORY ADMIN API ---
const directoryAdminApi = axios.create({ baseURL: API_URL });

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
export const getPublicDirectoryApi = async filters => {
  return api.get('/public/directory', { params: filters });
};
export const getBusinessBySlugApi = async slug =>
  api.get(`/public/directory/${slug}`);
export const contactBusinessViaWhatsAppApi = async slug =>
  api.post(`/public/directory/${slug}/whatsapp-contact`);
export const getAllPlansAdminApi = () => directoryAdminApi.get('/plans/all');
export const updatePlanApi = (id, planData) =>
  directoryAdminApi.put(`/plans/${id}`, planData);
export const getTenantPriceListApi = tenantId =>
  PublicAPI.get(`/public/tenants/${tenantId}/prices`);
export default api;