// client/src/components/Admin/TenantFormModal.js
import React, { useState, useEffect } from 'react';
import Modal from '../UI/Modal';
import Input from '../UI/Input';
import Button from '../UI/Button';
import { AlertTriangle } from 'lucide-react';

const TenantFormModal = ({ isOpen, onClose, onSubmit, tenantToEdit, apiError, isLoading }) => {
    const [formData, setFormData] = useState({
        name: '', description: '', publicAddress: '', publicPhone: '',
        publicEmail: '', city: '', country: '', logoUrl: '',
        isListedInDirectory: true, isActive: true
    });

    useEffect(() => {
        if (isOpen && tenantToEdit) {
            setFormData({
                name: tenantToEdit.name || '',
                description: tenantToEdit.description || '',
                publicAddress: tenantToEdit.publicAddress || '',
                publicPhone: tenantToEdit.publicPhone || '',
                publicEmail: tenantToEdit.publicEmail || '',
                city: tenantToEdit.city || '',
                country: tenantToEdit.country || '',
                logoUrl: tenantToEdit.logoUrl || '',
                isListedInDirectory: tenantToEdit.isListedInDirectory ?? true,
                isActive: tenantToEdit.isActive ?? true,
            });
        }
    }, [isOpen, tenantToEdit]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit(formData); // Parent handles API call
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Edit Public Profile for ${tenantToEdit?.name}`}>
            <form onSubmit={handleSubmit} className="space-y-4">
                {apiError && (
                    <div className="p-3 text-sm bg-red-100 text-apple-red rounded-apple flex items-center">
                        <AlertTriangle size={18} className="mr-2"/>{apiError}
                    </div>
                )}
                <Input label="Business Name" name="name" value={formData.name} onChange={handleChange} required />
                <Input label="Description" name="description" value={formData.description} onChange={handleChange} multiline rows={3} />
                <Input label="Address" name="publicAddress" value={formData.publicAddress} onChange={handleChange} />
                <Input label="Phone" name="publicPhone" value={formData.publicPhone} onChange={handleChange} />
                <Input label="Email" name="publicEmail" type="email" value={formData.publicEmail} onChange={handleChange} />
                <div className="grid grid-cols-2 gap-4">
                    <Input label="City" name="city" value={formData.city} onChange={handleChange} />
                    <Input label="Country" name="country" value={formData.country} onChange={handleChange} />
                </div>
                <Input label="Logo URL" name="logoUrl" value={formData.logoUrl} onChange={handleChange} />
                <div className="flex items-center pt-2">
                    <input id="isListedInDirectory" name="isListedInDirectory" type="checkbox" checked={formData.isListedInDirectory} onChange={handleChange} className="h-4 w-4 rounded" />
                    <label htmlFor="isListedInDirectory" className="ml-3 block text-sm">List this business in the public directory</label>
                </div>
                <div className="flex items-center pt-2">
                    <input id="isActive" name="isActive" type="checkbox" checked={formData.isActive} onChange={handleChange} className="h-4 w-4 rounded" />
                    <label htmlFor="isActive" className="ml-3 block text-sm">This software account is Active</label>
                </div>
                <div className="pt-4 flex justify-end space-x-3 border-t mt-4 dark:border-apple-gray-700">
                    <Button type="button" variant="secondary" onClick={onClose} disabled={isLoading}>Cancel</Button>
                    <Button type="submit" isLoading={isLoading}>Save Changes</Button>
                </div>
            </form>
        </Modal>
    );
};

export default TenantFormModal;