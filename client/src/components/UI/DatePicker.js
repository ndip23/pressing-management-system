import React from 'react';
import Input from './Input'; // Reuse the Input component styling

const DatePicker = ({ label, id, value, onChange, error, required, className = '', ...props }) => {
    return (
        <Input
            label={label}
            id={id}
            type="date"
            value={value} // Expected format: "YYYY-MM-DD"
            onChange={onChange}
            error={error}
            required={required}
            className={className}
            {...props}
        />
    );
};

export default DatePicker;