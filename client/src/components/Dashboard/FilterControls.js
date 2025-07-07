import React, { useState } from 'react';
import Input from '../UI/Input';
import Select from '../UI/Select';
import Button from '../UI/Button';
import { Filter, RotateCcw, Search } from 'lucide-react';

const FilterControls = ({ filters, onFilterChange, onResetFilters, onApplyFilters }) => {
    const [showAdvanced, setShowAdvanced] = useState(false);

    const handleChange = (e) => {
        onFilterChange({ [e.target.name]: e.target.value });
    };

    const statusOptions = [
        { value: '', label: 'All Statuses' },
        { value: 'Pending', label: 'Pending' },
        { value: 'Processing', label: 'Processing' },
        { value: 'Ready for Pickup', label: 'Ready for Pickup' },
        { value: 'Completed', label: 'Completed' },
        { value: 'Cancelled', label: 'Cancelled' },
    ];

    const paymentOptions = [
        { value: '', label: 'All Payments' },
        { value: 'true', label: 'Paid' },
        { value: 'false', label: 'Unpaid' },
    ];

    const overdueOptions = [
        { value: '', label: 'Any Date' },
        { value: 'true', label: 'Overdue Only' },
    ];

    return (
        <div className="mb-6 p-4 bg-apple-gray-50 dark:bg-apple-gray-800/30 rounded-apple-md border border-apple-gray-200 dark:border-apple-gray-700/50">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-1 items-end">
                <Input
                    label="Search Receipt #"
                    name="receiptNumber"
                    id="receiptNumberFilter"
                    value={filters.receiptNumber}
                    onChange={handleChange}
                    placeholder="PMS-..."
                    className="mb-3"
                />
                <Input
                    label="Search Customer Name"
                    name="customerName"
                    id="customerNameFilter"
                    value={filters.customerName}
                    onChange={handleChange}
                    placeholder="John Doe"
                    className="mb-3"
                />
                <Input
                    label="Search Customer Phone"
                    name="customerPhone"
                    id="customerPhoneFilter"
                    value={filters.customerPhone}
                    onChange={handleChange}
                    placeholder="555-1234"
                    className="mb-3"
                />
                <Select
                    label="Order Status"
                    name="status"
                    id="statusFilter"
                    value={filters.status}
                    onChange={handleChange}
                    options={statusOptions}
                    className="mb-3"
                />
                <Select
                    label="Payment Status"
                    name="paid"
                    id="paidFilter"
                    value={filters.paid}
                    onChange={handleChange}
                    options={paymentOptions}
                    className="mb-3"
                />
                <Select
                    label="Due Date"
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
                    {showAdvanced ? 'Hide Advanced' : 'Show Advanced Filters'}
                </Button>
                <div className="flex space-x-2">
                    <Button onClick={onResetFilters} variant="secondary" size="sm" iconLeft={<RotateCcw size={14}/>}>
                        Reset
                    </Button>
                    <Button onClick={onApplyFilters} variant="primary" size="sm" iconLeft={<Search size={14}/>}>
                        Apply Filters
                    </Button>
                </div>
            </div>

            {showAdvanced && (
                <div className="mt-4 pt-4 border-t border-apple-gray-200 dark:border-apple-gray-700">
                    <p className="text-sm text-apple-gray-500 dark:text-apple-gray-400">Advanced filters (e.g., by service type, date range) can be added here.</p>
                    <Select
                        label="Service Type"
                        name="serviceType"
                        value={filters.serviceType || ''}
                        onChange={handleChange}
                        options={[
                            { value: '', label: 'All Services' },
                            { value: 'wash', label: 'Wash' },
                            { value: 'dry clean', label: 'Dry Clean' },
                            { value: 'iron', label: 'Iron' },
                        ]}
                        className="mb-3"
                    /> 
                </div>
            )}
        </div>
    );
};

export default FilterControls;