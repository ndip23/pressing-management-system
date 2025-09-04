// client/src/components/Admin/ListingFormModal.js
import React, { useState, useEffect } from 'react';
import Modal from '../UI/Modal';
import Input from '../UI/Input';
import Button from '../UI/Button';
import { AlertTriangle } from 'lucide-react';

const ListingFormModal = ({ isOpen, onClose, onSubmit, listingToEdit = null, apiError, isLoading }) => {
    const [formData, setFormData] = useState({
        name: '', description: '', publicAddress: '', publicPhone: '',
        publicEmail: '', city: '', country: '', logoUrl: '', isActive: true
    });
    const [localError, setLocalError] = useState('');

    useEffect(() => {
        if (isOpen) {
            setLocalError('');
            if (listingToEdit) {
                setFormData({
                    name: listingToEdit.name || '',
                    description: listingToEdit.description || '',
                    publicAddress: listingToEdit.publicAddress || '',
                    publicPhone: listingToEdit.publicPhone || '',
                    publicEmail: listingToEdit.publicEmail || '',
                    city: listingToEdit.city || '',
                    country: listingToEdit.country || '',
                    logoUrl: listingToEdit.logoUrl || '',
                    isActive: listingToEdit.isActive ?? true,
                });
            } else { // Reset for new listing
                setFormData({ name: '', description: '', publicAddress: '', publicPhone: '', publicEmail: '', city: '', country: '', logoUrl: '', isActive: true });
            }
        }
    }, [isOpen, listingToEdit]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLocalError('');
        if (!formData.name) {
            setLocalError("Business Name is a required field.");
            return;
        }
        // Pass the form data up to the parent page to handle the API call
        await onSubmit(formData);
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={listingToEdit ? "Edit Directory Listing" : "Create New Directory Listing"}>
            <form onSubmit={handleSubmit} className="space-y-4">
                {(apiError || localError) && (
                    <div className="p-3 text-sm bg-red-100 text-apple-red rounded-apple flex items-center">
                        <AlertTriangle size={18} className="mr-2"/>{apiError || localError}
                    </div>
                )}
                <Input label="Business Name*" name="name" value={formData.name} onChange={handleChange} required />
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
                    <input id="isActive" name="isActive" type="checkbox" checked={formData.isActive} onChange={handleChange} className="h-4 w-4 rounded border-gray-300 text-apple-blue focus:ring-apple-blue" />
                    <label htmlFor="isActive" className="ml-3 block text-sm">Listing is Active</label>
                </div>
                <div className="pt-4 flex justify-end space-x-3 border-t mt-4 dark:border-apple-gray-700">
                    <Button type="button" variant="secondary" onClick={onClose} disabled={isLoading}>Cancel</Button>
                    <Button type="submit" isLoading={isLoading}>{listingToEdit ? 'Save Changes' : 'Create Listing'}</Button>
                </div>
            </form>
        </Modal>
    );
};

export default ListingFormModal;