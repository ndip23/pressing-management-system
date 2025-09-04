// client/src/components/Admin/UserFormModal.js
import React, { useState, useEffect } from 'react';
import Modal from '../UI/Modal'; // Ensure this path is correct
import Input from '../UI/Input';   // Ensure this path is correct
import Select from '../UI/Select'; // Ensure this path is correct
import Button from '../UI/Button'; // Ensure this path is correct
import { Eye, EyeOff, AlertTriangle } from 'lucide-react'; // Import necessary icons

const UserFormModal = ({
    isOpen,
    onClose,
    onSubmit,
    userToEdit = null, // Pass null for create, user object for edit
    apiError,          // Prop to receive submission errors from the parent
    isLoading          // Prop to show loading state from the parent
}) => {
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: '',
        role: 'staff',
        isActive: true,
    });
    const [showPassword, setShowPassword] = useState(false);
    const [localError, setLocalError] = useState(''); // For immediate client-side validation

    // Effect to populate the form for editing or reset it for creation
    useEffect(() => {
        if (isOpen) {
            setLocalError('');
            if (userToEdit) {
                setFormData({
                    username: userToEdit.username || '',
                    email: userToEdit.email || '',
                    password: '', // Password is not pre-filled for security
                    role: userToEdit.role || 'staff',
                    isActive: userToEdit.isActive ?? true,
                });
            } else {
                setFormData({
                    username: '',
                    email: '',
                    password: '',
                    role: 'staff',
                    isActive: true,
                });
            }
        }
    }, [isOpen, userToEdit]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLocalError('');

        if (!formData.username || !formData.email) {
            setLocalError("Username and Email are required fields.");
            return;
        }
        if (!userToEdit && !formData.password) {
            setLocalError("Password is required when creating a new user.");
            return;
        }
        if (formData.password && formData.password.length < 6) {
            setLocalError("Password must be at least 6 characters long.");
            return;
        }
        // Call the parent component's submit handler
        await onSubmit(formData);
    };

    const passwordSuffixIcon = (
        <button type="button" onClick={() => setShowPassword(!showPassword)} className="focus:outline-none" aria-label="Toggle password visibility">
            {showPassword ? <EyeOff size={18} className="text-apple-gray-500 dark:text-apple-gray-400" /> : <Eye size={18} className="text-apple-gray-500 dark:text-apple-gray-400" />}
        </button>
    );

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={userToEdit ? "Edit User" : "Create New User"}>
            <form onSubmit={handleSubmit} className="space-y-4">
                {(apiError || localError) && (
                    <div className="p-3 mb-4 bg-red-100 text-apple-red rounded-apple border border-red-300 dark:border-red-700 dark:text-red-300 dark:bg-red-900/30">
                        <div className="flex items-center">
                            <AlertTriangle size={20} className="mr-2 flex-shrink-0" />
                            <span>{apiError || localError}</span>
                        </div>
                    </div>
                )}

                <Input
                    label="Username*"
                    id="username"
                    name="username"
                    value={formData.username}
                    onChange={handleChange}
                    required
                />
                <Input
                    label="Email*"
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    placeholder="user@example.com"
                />
                
                <Input
                    label={userToEdit ? "New Password (optional)" : "Password*"}
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={handleChange}
                    required={!userToEdit}
                    suffixIcon={passwordSuffixIcon}
                />

                <Select
                    label="Role*"
                    id="role"
                    name="role"
                    value={formData.role}
                    onChange={handleChange}
                    options={[
                        { value: 'staff', label: 'Staff' },
                        { value: 'admin', label: 'Admin' },
                    ]}
                />

                <div className="flex items-center pt-2">
                    <input
                        id="isActive"
                        name="isActive"
                        type="checkbox"
                        checked={formData.isActive}
                        onChange={handleChange}
                        className="h-4 w-4 rounded border-gray-300 text-apple-blue focus:ring-apple-blue"
                    />
                    <label htmlFor="isActive" className="ml-3 block text-sm text-apple-gray-900 dark:text-apple-gray-200">
                        User is Active
                    </label>
                </div>

                <div className="pt-4 flex justify-end space-x-3 border-t mt-4 dark:border-apple-gray-700">
                    <Button type="button" variant="secondary" onClick={onClose} disabled={isLoading}>
                        Cancel
                    </Button>
                    <Button type="submit" isLoading={isLoading}>
                        {userToEdit ? 'Save Changes' : 'Create User'}
                    </Button>
                </div>
            </form>
        </Modal>
    );
};

export default UserFormModal;