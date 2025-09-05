// client/src/components/Admin/ListingFormModal.js

import React, { useState, useEffect, useRef } from 'react';
import Modal from '../UI/Modal';
import Input from '../UI/Input';
import Button from '../UI/Button';
import Spinner from '../UI/Spinner';
import { uploadListingLogoApi } from '../../services/api';
import { AlertTriangle, UploadCloud } from 'lucide-react';

const ListingFormModal = ({ isOpen, onClose, onSubmit, listingToEdit = null, apiError, isLoading }) => {
    const [formData, setFormData] = useState({
        name: '', description: '', publicAddress: '', publicPhone: '',
        publicEmail: '', city: '', country: '', logoUrl: '', logoCloudinaryId: '', isActive: true
    });
    const [logoPreview, setLogoPreview] = useState('');
    const [isUploading, setIsUploading] = useState(false);
    const [localError, setLocalError] = useState('');
    const fileInputRef = useRef(null);

    useEffect(() => {
        if (isOpen) {
            setLocalError('');
            if (listingToEdit) {
                const initialData = {
                    name: listingToEdit.name || '',
                    description: listingToEdit.description || '',
                    publicAddress: listingToEdit.publicAddress || '',
                    publicPhone: listingToEdit.publicPhone || '',
                    publicEmail: listingToEdit.publicEmail || '',
                    city: listingToEdit.city || '',
                    country: listingToEdit.country || '',
                    logoUrl: listingToEdit.logoUrl || '',
                    logoCloudinaryId: listingToEdit.logoCloudinaryId || '',
                    isActive: listingToEdit.isActive ?? true,
                };
                setFormData(initialData);
                setLogoPreview(initialData.logoUrl);
            } else {
                setFormData({ name: '', description: '', publicAddress: '', publicPhone: '', publicEmail: '', city: '', country: '', logoUrl: '', logoCloudinaryId: '', isActive: true });
                setLogoPreview('');
            }
        }
    }, [isOpen, listingToEdit]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    };

    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (file.size > 2 * 1024 * 1024) {
            setLocalError("File is too large. Please select an image under 2MB.");
            return;
        }

        setLogoPreview(URL.createObjectURL(file));
        setIsUploading(true);
        setLocalError('');
        const uploadFormData = new FormData();
        
        // --- THIS IS THE FIX ---
        // The key must match the string inside uploadLogo.single('...') in your route.
        // Your backend is expecting 'logoImage'.
        uploadFormData.append('logoImage', file); 

        try {
            const { data } = await uploadListingLogoApi(uploadFormData);
            setFormData(prev => ({ ...prev, logoUrl: data.imageUrl, logoCloudinaryId: data.cloudinaryId }));
        } catch (err) {
            console.error("Logo upload failed:", err);
            setLocalError(err.response?.data?.message || "Logo upload failed. Please try again.");
            setLogoPreview(listingToEdit?.logoUrl || '');
        } finally {
            setIsUploading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLocalError('');
        if (!formData.name) {
            setLocalError("Business Name is a required field.");
            return;
        }
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
                
                <div>
                    <label className="block text-sm font-medium mb-1">Business Logo</label>
                    <div className="mt-1 flex items-center gap-4">
                        <div className="w-20 h-20 rounded-lg bg-apple-gray-100 dark:bg-apple-gray-800 flex items-center justify-center overflow-hidden">
                            {isUploading ? <Spinner /> : logoPreview ? (
                                <img src={logoPreview} alt="Logo Preview" className="w-full h-full object-cover" />
                            ) : (
                                <UploadCloud size={24} className="text-apple-gray-400" />
                            )}
                        </div>
                        <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/png, image/jpeg, image/webp" />
                        <Button type="button" variant="secondary" onClick={() => fileInputRef.current.click()} disabled={isUploading}>
                            {isUploading ? 'Uploading...' : 'Upload Image'}
                        </Button>
                    </div>
                </div>

                <div className="flex items-center pt-2">
                    <input id="isActive" name="isActive" type="checkbox" checked={formData.isActive} onChange={handleChange} className="h-4 w-4 rounded border-gray-300 text-apple-blue focus:ring-apple-blue" />
                    <label htmlFor="isActive" className="ml-3 block text-sm">List this business in the public directory</label>
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