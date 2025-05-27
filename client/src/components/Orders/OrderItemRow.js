import React from 'react';
import Input from '../UI/Input';
import Select from '../UI/Select';
import Button from '../UI/Button';
import { X } from 'lucide-react';

const OrderItemRow = ({ item, index, onRemove, onChange, itemTypes = [], serviceTypes = [] }) => {
    const handleFieldChange = (field, value) => {
        onChange(item.id, field, value);
    };

    return (
        <div className="p-4 border border-apple-gray-200 dark:border-apple-gray-700 rounded-apple-md shadow-apple-sm bg-apple-gray-50 dark:bg-apple-gray-800/30">
            <div className="flex justify-between items-start mb-3">
                <h4 className="text-md font-medium text-apple-gray-700 dark:text-apple-gray-300">Item #{index + 1}</h4>
                <Button
                    type="button"
                    onClick={onRemove}
                    variant="ghost"
                    size="sm"
                    className="text-apple-red hover:bg-red-100/50 dark:hover:bg-red-900/30 p-1"
                    title="Remove item"
                >
                    <X size={18} />
                </Button>
            </div>
            <div className="grid grid-cols-1 gap-x-4 gap-y-2 md:grid-cols-12">
                <div className="md:col-span-3">
                    <Select
                        label="Item Type"
                        id={`itemType-${item.id}`}
                        value={item.itemType}
                        onChange={(e) => handleFieldChange('itemType', e.target.value)}
                        options={itemTypes.map(type => ({ value: type, label: type }))}
                        placeholder="Select Item Type"
                        required
                        className="mb-0"
                    />
                </div>
                <div className="md:col-span-3">
                    <Select
                        label="Service Type"
                        id={`serviceType-${item.id}`}
                        value={item.serviceType}
                        onChange={(e) => handleFieldChange('serviceType', e.target.value)}
                        options={serviceTypes}
                        placeholder="Select Service"
                        required
                        className="mb-0"
                    />
                </div>
                <div className="md:col-span-2">
                    <Input
                        label="Quantity"
                        id={`quantity-${item.id}`}
                        type="number"
                        value={item.quantity}
                        onChange={(e) => handleFieldChange('quantity', parseInt(e.target.value, 10) || 1)}
                        min="1"
                        required
                        className="mb-0"
                    />
                </div>
                <div className="md:col-span-4">
                     <Input
                        label="Special Instructions"
                        id={`specialInstructions-${item.id}`}
                        value={item.specialInstructions}
                        onChange={(e) => handleFieldChange('specialInstructions', e.target.value)}
                        placeholder="e.g., No starch, hand wash"
                        className="mb-0"
                    />
                </div>
                {/* Optional Price per item field if needed for manual override */}
                {/* <div className="md:col-span-2">
                    <Input
                        label="Price ($)"
                        id={`price-${item.id}`}
                        type="number"
                        value={item.price || ''} // Assuming price is optional and calculated mainly
                        onChange={(e) => handleFieldChange('price', parseFloat(e.target.value) || 0)}
                        step="0.01"
                        placeholder="Auto"
                        className="mb-0"
                    />
                </div> */}
            </div>
        </div>
    );
};

export default OrderItemRow;