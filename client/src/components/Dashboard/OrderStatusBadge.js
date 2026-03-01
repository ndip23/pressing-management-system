import React from 'react';
import { useTranslation } from 'react-i18next';
import { CheckCircle2,  Clock3, RefreshCw, XCircle, HelpCircle } from 'lucide-react';

const OrderStatusBadge = ({ status }) => {
    const { t } = useTranslation();
    let colorClasses = "";
    let IconComponent = HelpCircle;

    switch (status) {
        case 'Pending':
            colorClasses = "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300";
            IconComponent = Clock3;
            break;
        case 'Processing':
            colorClasses = "bg-blue-100 text-apple-blue dark:bg-blue-900/40 dark:text-apple-blue-light";
            IconComponent = RefreshCw;
            break;
        case 'Ready for Pickup':
            colorClasses = "bg-green-100 text-apple-green dark:bg-green-900/40 dark:text-green-400";
            IconComponent = CheckCircle2;
            break;
        case 'Completed':
            colorClasses = "bg-apple-gray-200 text-apple-gray-700 dark:bg-apple-gray-700 dark:text-apple-gray-300";
            IconComponent = CheckCircle2;
            break;
        case 'Cancelled':
            colorClasses = "bg-red-100 text-apple-red dark:bg-red-900/40 dark:text-red-400";
            IconComponent = XCircle;
            break;
        default:
            colorClasses = "bg-gray-200 text-gray-700 dark:bg-gray-600 dark:text-gray-300";
    }

    const getStatusKey = (status) => {
        switch (status) {
            case 'Pending': return 'pending';
            case 'Processing': return 'processing';
            case 'Ready for Pickup': return 'readyForPickup';
            case 'Completed': return 'completed';
            case 'Cancelled': return 'cancelled';
            default: return status;
        }
    };

    return (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colorClasses}`}>
            <IconComponent size={14} className="mr-1.5" />
            {t(`orderStatus.${getStatusKey(status)}`, status)}
        </span>
    );
};

export default OrderStatusBadge;