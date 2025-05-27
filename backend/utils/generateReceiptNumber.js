// server/utils/generateReceiptNumber.js
import Order from '../models/Order.js'; // Import Order to check for uniqueness

const generateReceiptNumber = async () => {
    const date = new Date();
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');

    let unique = false;
    let receiptNumber;
    let attempts = 0;
    const maxAttempts = 10; // Prevent infinite loop

    while (!unique && attempts < maxAttempts) {
        // Generates a 4-digit random number
        const randomSuffix = Math.floor(1000 + Math.random() * 9000);
        receiptNumber = `PMS-${year}${month}${day}-${randomSuffix}`;

        const existingOrder = await Order.findOne({ receiptNumber });
        if (!existingOrder) {
            unique = true;
        }
        attempts++;
    }

    if (!unique) {
        // Fallback: use timestamp if random generation fails repeatedly (highly unlikely for this format)
        receiptNumber = `PMS-TS-${Date.now()}`;
        console.warn("Failed to generate unique receipt number via random suffix, using timestamp fallback.");
    }

    return receiptNumber;
};

export { generateReceiptNumber };