// client/src/components/Admin/UserFormModal.js
import React, { useState, useEffect } from 'react';
import Modal from '../UI/Modal';
import Input from '../UI/Input';
import Select from '../UI/Select';
import Button from '../UI/Button';
import { Save } from 'lucide-react';

const UserFormModal = ({ isOpen, onClose, onSave, existingUser, error, saving }) => {
    const [formData, setFormData] = useState({
        username: '',
        password: '',
        role: 'staff',
        isActive: true,
    });

    const isEditMode = !!existingUser;

    useEffect(() => {
        if (isEditMode && existingUser) {
            setFormData({
                username: existingUser.username || '',
                password: '', // Password is not fetched, only set if changing
                role: existingUser.role || 'staff',
                isActive: existingUser.isActive !== undefined ? existingUser.isActive : true,
            });
        } else {
            // Reset for create mode
            setFormData({ username: '', password: '', role: 'staff', isActive: true });
        }
    }, [existingUser, isEditMode, isOpen]); // Rerun effect when modal opens or user data changes

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleSave = (e) => {
        e.preventDefault();
        onSave(formData);
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={isEditMode ? `Edit User: ${existingUser.username}` : 'Add New User'}
        >
            <form onSubmit={handleSave}>
                {error && <p className="p-3 mb-4 text-sm bg-red-100 text-apple-red rounded-apple">{error}</p>}
                <div className="space-y-4">
                    <Input
                        label="Username"
                        id="username"
                        name="username"
                        value={formData.username}
                        onChange={handleChange}
                        required
                    />
                    <Input
                        label={isEditMode ? "New Password (optional)" : "Password"}
                        id="password"
                        name="password"
                        type="password"
                        value={formData.password}
                        onChange={handleChange}
                        required={!isEditMode} // Password is only required when creating a new user
                        placeholder={isEditMode ? "Leave blank to keep current" : ""}
                    />
                    <Select
                        label="Role"
                        id="role"
                        name="role"
                        value={formData.role}
                        onChange={handleChange}
                        options={[
                            { value: 'staff', label: 'Staff' },
                            { value: 'admin', label: 'Admin' },
                        ]}
                    />
                    <div className="flex items-center">
                        <input
                            type="checkbox"
                            id="isActive"
                            name="isActive"
                            checked={formData.isActive}
                            onChange={handleChange}
                            className="h-4 w-4 rounded border-gray-300 text-apple-blue focus:ring-apple-blue"
                        />
                        <label htmlFor="isActive" className="ml-2 block text-sm text-apple-gray-700 dark:text-apple-gray-300">
                            Account is Active
                        </label>
                    </div>
                </div>
                <div className="mt-6 pt-4 border-t dark:border-apple-gray-700 flex justify-end space-x-3">
                    <Button type="button" variant="secondary" onClick={onClose} disabled={saving}>Cancel</Button>
                    <Button type="submit" variant="primary" isLoading={saving} iconLeft={<Save size={16}/>}>
                        {isEditMode ? 'Save Changes' : 'Create User'}
                    </Button>
                </div>
            </form>
        </Modal>
    );
};

export default UserFormModal;