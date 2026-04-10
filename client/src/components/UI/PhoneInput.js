// client/src/components/UI/PhoneInput.js
import React from 'react';
import PhoneInput from 'react-phone-number-input';
import 'react-phone-number-input/style.css'; 
import './PhoneInput.css'; 

const CustomPhoneInput = React.forwardRef(({ 
    label, 
    value, 
    onChange, 
    onCountryChange, 
    onlyCountries, // Keep this name if you want, but pass it as 'countries' to the lib
    ...props 
}, ref) => {
    
    return (
        <div>
            {label && <label className="block text-sm font-medium mb-1">{label}</label>}
            <div className="phone-input-wrapper">
                <PhoneInput
                    international
                    defaultCountry="CM"
                    value={value}
                    onChange={onChange}
                    onCountryChange={onCountryChange}
                    // ✅ CHANGE THIS PROP NAME TO 'countries'
                    countries={onlyCountries} 
                    {...props}
                />
            </div>
        </div>
    );
});
export default CustomPhoneInput;