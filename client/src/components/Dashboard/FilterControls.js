import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import Input from '../UI/Input';
import Select from '../UI/Select';
import Button from '../UI/Button';
import { RotateCcw, Search } from 'lucide-react';

const FilterControls = ({ filters, onFilterChange, onResetFilters, onApplyFilters }) => {
    const { t } = useTranslation();
    const [showAdvanced, setShowAdvanced] = useState(false);

    const handleChange = (e) => {
        onFilterChange({ [e.target.name]: e.target.value });
    };

    const statusOptions = [
        { value: '', label: t('filterControls.statusOptions.allStatuses') },
        { value: 'Pending', label: t('filterControls.statusOptions.pending') },
        { value: 'Processing', label: t('filterControls.statusOptions.processing') },
        { value: 'Ready for Pickup', label: t('filterControls.statusOptions.readyForPickup') },
        { value: 'Completed', label: t('filterControls.statusOptions.completed') },
        { value: 'Cancelled', label: t('filterControls.statusOptions.cancelled') },
    ];

    const paymentOptions = [
        { value: '', label: t('filterControls.paymentOptions.allPayments') },
        { value: 'true', label: t('filterControls.paymentOptions.paid') },
        { value: 'false', label: t('filterControls.paymentOptions.unpaid') },
    ];

    const overdueOptions = [
        { value: '', label: t('filterControls.overdueOptions.anyDate') },
        { value: 'true', label: t('filterControls.overdueOptions.overdueOnly') },
    ];

    return (
        <div className="mb-6 p-4 bg-apple-gray-50 dark:bg-apple-gray-800/30 rounded-apple-md border border-apple-gray-200 dark:border-apple-gray-700/50">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-1 items-end">
                <Input
                    label={t('filterControls.searchReceipt')}
                    name="receiptNumber"
                    id="receiptNumberFilter"
                    value={filters.receiptNumber}
                    onChange={handleChange}
                    placeholder="PMS-..."
                    className="mb-3"
                />
                <Input
                    label={t('filterControls.searchCustomerName')}
                    name="customerName"
                    id="customerNameFilter"
                    value={filters.customerName}
                    onChange={handleChange}
                    placeholder={t('filterControls.placeholders.customerName')}
                    className="mb-3"
                />
                <Input
                    label={t('filterControls.searchCustomerPhone')}
                    name="customerPhone"
                    id="customerPhoneFilter"
                    value={filters.customerPhone}
                    onChange={handleChange}
                    placeholder={t('filterControls.placeholders.customerPhone')}
                    className="mb-3"
                />
                <Select
                    label={t('filterControls.orderStatus')}
                    name="status"
                    id="statusFilter"
                    value={filters.status}
                    onChange={handleChange}
                    options={statusOptions}
                    className="mb-3"
                />
                <Select
                    label={t('filterControls.paymentStatus')}
                    name="paid"
                    id="paidFilter"
                    value={filters.paid}
                    onChange={handleChange}
                    options={paymentOptions}
                    className="mb-3"
                />
                <Select
                    label={t('filterControls.dueDate')}
                    name="overdue"
                    id="overdueFilter"
                    value={filters.overdue}
                    onChange={handleChange}
                    options={overdueOptions}
                    className="mb-3"
                />
            </div>
            <div className="mt-3 flex flex-col sm:flex-row justify-between items-center space-y-2 sm:space-y-0 sm:space-x-2">
                 <Button
                    onClick={() => setShowAdvanced(!showAdvanced)}
                    variant="link"
                    size="sm"
                    className="text-xs"
                >
                    {showAdvanced ? t('filterControls.hideAdvanced') : t('filterControls.showAdvanced')}
                </Button>
                <div className="flex space-x-2">
                    <Button onClick={onResetFilters} variant="secondary" size="sm" iconLeft={<RotateCcw size={14}/>}>
                        {t('filterControls.reset')}
                    </Button>
                    <Button onClick={onApplyFilters} variant="primary" size="sm" iconLeft={<Search size={14}/>}>
                        {t('filterControls.applyFilters')}
                    </Button>
                </div>
            </div>

            {showAdvanced && (
                <div className="mt-4 pt-4 border-t border-apple-gray-200 dark:border-apple-gray-700">
                    <p className="text-sm text-apple-gray-500 dark:text-apple-gray-400">{t('filterControls.advancedDescription')}</p>
                    <Select
                        label={t('filterControls.serviceType')}
                        name="serviceType"
                        value={filters.serviceType || ''}
                        onChange={handleChange}
                        options={[
                            { value: '', label: t('filterControls.serviceOptions.allServices') },
                            { value: 'wash', label: t('filterControls.serviceOptions.wash') },
                            { value: 'dry clean', label: t('filterControls.serviceOptions.dryClean') },
                            { value: 'iron', label: t('filterControls.serviceOptions.iron') },
                        ]}
                        className="mb-3"
                    /> 
                </div>
            )}
        </div>
    );
};

export default FilterControls;