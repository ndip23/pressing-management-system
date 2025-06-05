// client/src/components/Orders/OrderItemRow.js
import React from 'react';
import Input from '../UI/Input';
import Select from '../UI/Select';
import Button from '../UI/Button';
import { X } from 'lucide-react';

const OrderItemRow = ({
    item,
    index,
    onRemove,
    onChange,
    itemTypes = [],
    serviceTypes = [],
    calculatedPrice
}) => {
    const handleFieldChange = (field, value) => {
        const processedValue = field === 'quantity' ? (parseInt(value, 10) || 1) : value;
        onChange(item.id, field, processedValue);
    };

    const currencySymbol = 'FCFA'; // Using your example currency

    return (
        <div className="p-4 border border-apple-gray-200 dark:border-apple-gray-700 rounded-apple-md shadow-apple-sm bg-apple-gray-50 dark:bg-apple-gray-800/30">
            <div className="flex justify-between items-center mb-3">
                <h4 className="text-md font-medium text-apple-gray-700 dark:text-apple-gray-300">Item #{index + 1}</h4>
                <Button
                    type="button"
                    onClick={onRemove}
                    variant="ghost"
                    size="sm"
                    className="text-apple-red hover:bg-red-100/50 dark:hover:bg-red-900/30 p-1 -mr-1 -mt-1"
                    title="Remove item"
                    aria-label={`Remove item ${index + 1}`}
                >
                    <X size={18} />
                </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-12 gap-x-4 gap-y-2 items-end"> {/* items-end for vertical alignment */}
                <div className="md:col-span-3">
                    <Select
                        label="Item Type*"
                        id={`itemType-${item.id}`}
                        value={item.itemType}
                        onChange={(e) => handleFieldChange('itemType', e.target.value)}
                        options={itemTypes.map(type => ({ value: type, label: type }))}
                        placeholder="Select Item"
                        required
                        className="mb-0"
                    />
                </div>
                <div className="md:col-span-3">
                    <Select
                        label="Service Type*"
                        id={`serviceType-${item.id}`}
                        value={item.serviceType}
                        onChange={(e) => handleFieldChange('serviceType', e.target.value)}
                        options={serviceTypes}
                        placeholder="Select Service"
                        required
                        className="mb-0"
                    />
                </div>
                <div className="md:col-span-1">
                    <Input
                        label="Qty*"
                        id={`quantity-${item.id}`}
                        type="number"
                        value={item.quantity}
                        onChange={(e) => handleFieldChange('quantity', e.target.value)}
                        min="1"
                        required
                        className="mb-0"
                    />
                </div>
                <div className="md:col-span-3">
                     <Input
                        label="Special Instructions"
                        id={`specialInstructions-${item.id}`}
                        value={item.specialInstructions}
                        onChange={(e) => handleFieldChange('specialInstructions', e.target.value)}
                        placeholder="e.g., No starch"
                        className="mb-0"
                    />
                </div>
                {/* METHOD 1: ADD A VISIBLE LABEL */}
                <div className="md:col-span-2 pb-5">
                    <label htmlFor={`itemPriceDisplay-${item.id}`} className="block text-sm font-medium text-apple-gray-700 dark:text-apple-gray-300 mb-1">
                        Line Price
                    </label>
                    <div
                        id={`itemPriceDisplay-${item.id}`} // Added id for label association
                        className="h-10 flex items-center justify-end px-3 py-2 border border-apple-gray-300 dark:border-apple-gray-700 rounded-apple shadow-sm bg-apple-gray-100 dark:bg-apple-gray-800 text-apple-gray-700 dark:text-apple-gray-100 sm:text-sm"
                        aria-label="Calculated line price"
                    >
                        <span className="font-medium">
                            {currencySymbol}{(calculatedPrice || 0).toFixed(2)}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default OrderItemRow;