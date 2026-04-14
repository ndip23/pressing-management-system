// backend/services/accountPeService.js

import axios from 'axios';
import https from 'https'; 

// --- STATE MANAGEMENT for the AccountPe Auth Token ---
let authToken = null;
let tokenExpiresAt = null;

// --- A SINGLE, UNIFIED API INSTANCE ---
const payinApi = axios.create({
    baseURL: 'https://api.accountpe.com/api/payin',
    headers: { 'Content-Type': 'application/json' },
});
const payoutApi = axios.create({
    baseURL: 'https://api.accountpe.com/api/payout', // <-- Note the /payout URL
    headers: { 'Content-Type': 'application/json' },
});

// --- 2. OPTIONAL HTTPS agent ---
// Only allow insecure TLS if explicitly enabled (never in production).
const httpsAgent = process.env.ACCOUNTPE_ALLOW_INSECURE_TLS === 'true'
  ? new https.Agent({ rejectUnauthorized: false })
  : undefined;


/**
 * Fetches a new authentication token from the correct AccountPe endpoint.
 */
const getAuthToken = async () => {
    try {
        const email = process.env.ACCOUNTPE_EMAIL;
        const password = process.env.ACCOUNTPE_PASSWORD;
        
        if (!email || !password) {
            throw new Error('AccountPe credentials are not configured.');
        }

        // The final URL will be: https://api.accountpe.com/api/payin/admin/auth
        const { data } = await payinApi.post(
            '/admin/auth', 
            { email, password },
            { httpsAgent } 
        );
        
        const token = data.token;
        if (!token) {
            throw new Error('Token not found in AccountPe auth response.');
        }

        authToken = token;
        tokenExpiresAt = new Date(new Date().getTime() + 23 * 60 * 60 * 1000);
        console.log('[AccountPe Service] New Auth Token generated successfully!');

    } catch (error) {
        console.error("--- FATAL ERROR: Could not get AccountPe Auth Token ---");
        if (error.response) {
            console.error('AccountPe API responded with an error:', error.response.status, error.response.data);
        } else {
            console.error('Full error object:', error.message);
        }
        throw new Error('Payment provider authentication failed.');
    }
};

/**
 * Converts USD (PUSD) amount to Local Fiat Currency using AccountPe
 */
export const convertPUSDToFiat = async (countryCode, usdPrice) => {
    try {
        // Send amount: 1 to get the base rate for 1 USD
        const response = await payoutApi.post('/pusd_to_fiat_rate', {
            country_code: countryCode,
            amount: 1 
        }, { httpsAgent });

        console.log('[AccountPe] Rate Response:', response.data);

        // Extract the rate. If the API returns the total for that amount directly, use it.
        // If it returns a rate (e.g., 615), use that.
        const rate = response.data?.data?.amount || response.data?.amount || 615;
        
        return Number(rate);
    } catch (error) {
        console.error("Conversion API Error:", error.message);
        throw new Error("Currency conversion service is currently unavailable.");
    }
};
/**
 * Creates a payment link. This function relies on the interceptor to get a token.
 */
export const createPaymentLink = async (paymentData) => {
    const url = '/create_payment_links';
    const idempotencyKey = paymentData?.transaction_id || undefined;
    const headers = idempotencyKey ? { 'Idempotency-Key': idempotencyKey } : undefined;
    return payinApi.post(url, paymentData, { httpsAgent, headers });
};

/**
 * Gets the status of a payment link.
 */
export const getPaymentLinkStatus = async (transactionId) => {
    const url = '/payment_link_status';
    return payinApi.post(url, { transaction_id: transactionId }, { httpsAgent });
};

/**
 * Axios request interceptor.
 */
const authInterceptor = async (config) => {
    if (config.url === '/admin/auth') return config;
    if (!authToken || new Date() > tokenExpiresAt) await getAuthToken();
    config.headers['Authorization'] = `Bearer ${authToken}`;
    return config;
};

payinApi.interceptors.request.use(authInterceptor, (error) => Promise.reject(error));
payoutApi.interceptors.request.use(authInterceptor, (error) => Promise.reject(error));