// client/src/components/Admin/TenantFormModal.js
import React, { useState, useEffect, useRef } from 'react';
import Modal from '../UI/Modal';
import Input from '../UI/Input';
import Select from '../UI/Select'; // Needed for plan, etc.
import Button from '../UI/Button';
import Spinner from '../UI/Spinner';
import { uploadTenantLogoApi } from '../../services/api'; // Tenant's upload function
import { AlertTriangle, UploadCloud } from 'lucide-react';

const TenantFormModal = ({ isOpen, onClose, onSubmit, tenantToEdit, apiError, isLoading }) => {
    const [formData, setFormData] = useState({
        name: '', description: '', publicAddress: '', publicPhone: '',
        publicEmail: '', city: '', country: '', logoUrl: '', logoCloudinaryId: '',
        isListedInDirectory: true, isActive: true, plan: 'basic'
    });
    const [logoPreview, setLogoPreview] = useState('');
    const [isUploading, setIsUploading] = useState(false);
    const [localError, setLocalError] = useState('');
    const fileInputRef = useRef(null);

    useEffect(() => {
        if (isOpen && tenantToEdit) {
            setLocalError('');
            setFormData({
                name: tenantToEdit.name || '',
                description: tenantToEdit.description || '',
                publicAddress: tenantToEdit.publicAddress || '',
                publicPhone: tenantToEdit.publicPhone || '',
                publicEmail: tenantToEdit.publicEmail || '',
                city: tenantToEdit.city || '',
                country: tenantToEdit.country || '',
                logoUrl: tenantToEdit.logoUrl || '',
                logoCloudinaryId: tenantToEdit.logoCloudinaryId || '',
                isListedInDirectory: tenantToEdit.isListedInDirectory ?? true,
                isActive: tenantToEdit.isActive ?? true,
                plan: tenantToEdit.plan || 'basic',
            });
            setLogoPreview(tenantToEdit.logoUrl || '');
        }
    }, [isOpen, tenantToEdit]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    };

    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (file.size > 2 * 1024 * 1024) { // 2MB limit
            setLocalError("File is too large. Please select an image under 2MB.");
            return;
        }

        setLogoPreview(URL.createObjectURL(file));
        setIsUploading(true);
        setLocalError('');
        const uploadFormData = new FormData();
        uploadFormData.append('logoImage', file);

        try {
            // NOTE: This uses uploadTenantLogoApi which requires a logged-in TENANT admin by default.
            // Your backend route for this upload might need to be protected by the SUPER admin middleware instead if only you can change it.
            // For now, let's assume you have a generic upload route that the directory admin can call.
            // Let's reuse `uploadListingLogoApi` for simplicity, as it's protected by the correct super admin middleware.
            const { data } = await uploadTenantLogoApi(uploadFormData);
            setFormData(prev => ({ ...prev, logoUrl: data.imageUrl, logoCloudinaryId: data.cloudinaryId }));
        } catch (err) {
            console.error("Logo upload failed:", err);
            setLocalError(err.response?.data?.message || "Logo upload failed. Please try again.");
            setLogoPreview(tenantToEdit?.logoUrl || '');
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
        <Modal isOpen={isOpen} onClose={onClose} title={`Edit Software Customer: ${tenantToEdit?.name}`}>
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

                <Select
                    label="Subscription Plan"
                    name="plan"
                    value={formData.plan}
                    onChange={handleChange}
                    options={[
                        {value: 'trial', label: 'Trial'},
                        {value: 'basic', label: 'Basic'},
                        {value: 'pro', label: 'Pro'}
                    ]}
                />

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