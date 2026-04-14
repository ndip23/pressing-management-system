// client/src/utils/currencyMap.js
export const COUNTRY_TO_CURRENCY = {
    BJ: 'XOF', BF: 'XOF', CM: 'XAF', CG: 'XAF', CD: 'USD',
    CI: 'XOF', GA: 'XAF', GN: 'GNF', IN: 'INR', KE: 'KES',
    ML: 'XOF', SN: 'XOF', TZ: 'TZS', TG: 'XOF', UG: 'UGX'
};

// Also define the full names for your dropdown display
export const COUNTRY_NAMES = {
    BJ: "Benin", BF: "Burkina Faso", CM: "Cameroon", CG: "Congo Brazzaville",
    CD: "Congo DRC", CI: "Cote D'Ivoire", GA: "Gabon", GN: "Guinea Conakry",
    IN: "India", KE: "Kenya", ML: "Mali", SN: "Senegal", TZ: "Tanzania",
    TG: "Togo", UG: "Uganda"
};

export const SUPPORTED_COUNTRIES = Object.keys(COUNTRY_TO_CURRENCY);