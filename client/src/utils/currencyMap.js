// client/utils/currencyMap.js

export const COUNTRY_TO_CURRENCY = {
    BJ: 'XOF', // Benin
    BF: 'XOF', // Burkina Faso
    CM: 'XAF', // Cameroon
    CG: 'XAF', // Congo Brazzaville
    CD: 'USD', // Congo DRC
    CI: 'XOF', // Cote D'Ivoire
    GA: 'XAF', // Gabon
    GN: 'GNF', // Guinea Conakry
    IN: 'INR', // India
    KE: 'KES', // Kenya
    ML: 'XOF', // Mali
    SN: 'XOF', // Senegal
    TZ: 'TZS', // Tanzania
    TG: 'XOF', // Togo
    UG: 'UGX'  // Uganda
};

// This array defines which countries show up in your PhoneInput dropdown
export const SUPPORTED_COUNTRIES = Object.keys(COUNTRY_TO_CURRENCY);