// client/src/utils/helpers.js
import { format as formatDateFns, parseISO } from 'date-fns';

export const formatDate = (dateString, formatString = 'MMM d, yyyy') => {
    if (!dateString) return 'N/A';
    try {
        const date = typeof dateString === 'string' ? parseISO(dateString) : new Date(dateString);
        return formatDateFns(date, formatString);
    } catch (error) {
        console.warn("Date formatting error:", error);
        return dateString; // Return original if parsing fails
    }
};

export const formatCurrency = (amount, currency = 'USD') => {
    if (typeof amount !== 'number') return 'N/A';
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: currency }).format(amount);
};

// You can add more helper functions here as needed.