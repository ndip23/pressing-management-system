import { useState, useCallback } from 'react';

// This is a very basic form hook. You might want something more robust like react-hook-form for complex forms.
export const useForm = (initialValues = {}, onSubmit, validate) => {
    const [values, setValues] = useState(initialValues);
    const [errors, setErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleChange = useCallback((event) => {
        const { name, value, type, checked } = event.target;
        setValues(prevValues => ({
            ...prevValues,
            [name]: type === 'checkbox' ? checked : value,
        }));
    }, []);

    const handleSubmit = useCallback(async (event) => {
        event.preventDefault();
        setIsSubmitting(true);
        if (validate) {
            const validationErrors = validate(values);
            setErrors(validationErrors);
            if (Object.keys(validationErrors).length === 0) {
                await onSubmit(values);
            }
        } else {
            await onSubmit(values);
        }
        setIsSubmitting(false);
    }, [onSubmit, validate, values]);

    const resetForm = useCallback(() => {
        setValues(initialValues);
        setErrors({});
        setIsSubmitting(false);
    }, [initialValues]);

    return {
        values,
        setValues, // Allow direct setting of values if needed
        errors,
        isSubmitting,
        handleChange,
        handleSubmit,
        resetForm,
    };
};