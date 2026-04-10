import React from 'react';
import PhoneInput from 'react-phone-number-input';
import 'react-phone-number-input/style.css'; 
import './PhoneInput.css'; 

const CustomPhoneInput = React.forwardRef(({ 
    label, 
    value, 
    onChange, 
    onCountryChange, 
    countries, // <--- 1. Accept the new prop
    ...props 
}, ref) => {
    
    return (
        <div>
            {label && (
                <label className="block text-sm font-medium mb-1 text-apple-gray-700 dark:text-apple-gray-300">
                    {label}
                </label>
            )}
            
            <div className="phone-input-wrapper">
                <PhoneInput
                    international
                    defaultCountry="CM"
                    value={value}
                    onChange={onChange}
                    onCountryChange={onCountryChange}
                    // ✅ 2. Pass the countries array to the library
                    countries={countries} 
                    {...props}
                />
            </div>
        </div>
    );
});

export default CustomPhoneInput;