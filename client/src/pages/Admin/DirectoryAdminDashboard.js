// client/src/pages/Admin/DirectoryAdminDashboard.js
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDirectoryAuth } from '../../contexts/DirectoryAuthContext';
import {
    getAllDirectoryListingsApi, createDirectoryListingApi, updateDirectoryListingApi, deleteDirectoryListingApi,
    getAllTenantsApi, updateTenantApi
} from '../../services/api';
import Card from '../../components/UI/Card';
import Button from '../../components/UI/Button';
import Spinner from '../../components/UI/Spinner';
import ListingFormModal from '../../components/Admin/ListingFormModal';
import TenantFormModal from '../../components/Admin/TenantFormModal'; // Import new modal
import { List, Users, PlusCircle, Edit3, Trash2, AlertTriangle, CheckCircle2 } from 'lucide-react';

const TabButton = ({ label, isActive, onPress }) => (
    <button
        onClick={onPress}
        className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors border-b-2 ${
            isActive
                ? 'border-apple-blue text-apple-blue font-semibold'
                : 'border-transparent text-apple-gray-500 hover:border-apple-gray-300 hover:text-apple-gray-800'
        }`}
    >
        {label}
    </button>
);

const DirectoryAdminDashboard = () => {
    const navigate = useNavigate();
    const { dirAdminLogout } = useDirectoryAuth();
    const [activeTab, setActiveTab] = useState('tenants');

    const [listings, setListings] = useState([]);
    const [tenants, setTenants] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [apiError, setApiError] = useState('');

    const [isListingModalOpen, setIsListingModalOpen] = useState(false);
    const [editingListing, setEditingListing] = useState(null);

    const [isTenantModalOpen, setIsTenantModalOpen] = useState(false);
    const [editingTenant, setEditingTenant] = useState(null);

    const loadData = useCallback(async () => {
        setLoading(true); setError('');
        try {
            const [tenantsRes, listingsRes] = await Promise.all([ getAllTenantsApi(), getAllDirectoryListingsApi() ]);
            setTenants(tenantsRes.data);
            setListings(listingsRes.data);
        } catch (err) { setError("Failed to load dashboard data."); console.error(err);
        } finally { setLoading(false); }
    }, []);

    useEffect(() => { loadData(); }, [loadData]);

    useEffect(() => {
        let timer;
        if (success || error) {
            timer = setTimeout(() => { setSuccess(''); setError(''); }, 4000);
        }
        return () => clearTimeout(timer);
    }, [success, error]);

    const handleOpenCreateListingModal = () => { setEditingListing(null); setApiError(''); setIsListingModalOpen(true); };
    const handleOpenEditListingModal = (listing) => { setEditingListing(listing); setApiError(''); setIsListingModalOpen(true); };
    const handleOpenEditTenantModal = (tenant) => { setEditingTenant(tenant); setApiError(''); setIsTenantModalOpen(true); };

    const handleListingFormSubmit = async (formData) => {
        setIsSubmitting(true); setApiError('');
        try {
            if (editingListing) {
                const { data } = await updateDirectoryListingApi(editingListing._id, formData);
                setSuccess(`Listing "${data.name}" updated successfully.`);
            } else {
                const { data } = await createDirectoryListingApi(formData);
                setSuccess(`Listing "${data.name}" created successfully.`);
            }
            setIsListingModalOpen(false); loadData();
        } catch (err) { setApiError(err.response?.data?.message || "An error occurred."); throw err;
        } finally { setIsSubmitting(false); }
    };

    const handleTenantFormSubmit = async (formData) => {
        setIsSubmitting(true); setApiError('');
        try {
            const { data } = await updateTenantApi(editingTenant._id, formData);
            setSuccess(`Software Customer "${data.name}" updated successfully.`);
            setIsTenantModalOpen(false); loadData();
        } catch (err) { setApiError(err.response?.data?.message || "An error occurred."); throw err;
        } finally { setIsSubmitting(false); }
    };

    const handleDeleteListing = async (listing) => {
        if (window.confirm(`Are you sure you want to delete the listing for "${listing.name}"?`)) {
            try { const { data } = await deleteDirectoryListingApi(listing._id); setSuccess(data.message); loadData(); }
            catch (err) { setError(err.response?.data?.message || "Failed to delete listing."); }
        }
    };

    const handleLogout = () => { dirAdminLogout(); };

    return (
        <>
            <div className="min-h-screen bg-apple-gray-100 dark:bg-apple-gray-900 text-apple-gray-900 dark:text-apple-gray-100 p-4 sm:p-8">
                <div className="max-w-7xl mx-auto">
                    <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
                        <div className="flex items-center space-x-3">
                            <List size={32} className="text-apple-blue" />
                            <h1 className="text-3xl font-bold">Platform Admin Dashboard</h1>
                        </div>
                        <Button onClick={handleLogout} variant="secondary">Logout</Button>
                    </div>
                    {success && <div className="p-3 mb-4 bg-green-100 text-apple-green rounded-apple flex items-center"><CheckCircle2 size={18} className="mr-2"/>{success}</div>}
                    {error && <div className="p-3 mb-4 bg-red-100 text-apple-red rounded-apple flex items-center"><AlertTriangle size={18} className="mr-2"/>{error}</div>}

                    <div className="flex space-x-2 border-b dark:border-apple-gray-700 mb-6">
                        <TabButton label={`Software Customers (${tenants.length})`} isActive={activeTab === 'tenants'} onPress={() => setActiveTab('tenants')} />
                        <TabButton label={`Manual Listings (${listings.length})`} isActive={activeTab === 'listings'} onPress={() => setActiveTab('listings')} />
                    </div>

                    {loading ? <div className="p-8 text-center"><Spinner /></div> : (
                        <div>
                            {activeTab === 'tenants' && (
                                <Card>
                                    <div className="p-4 border-b dark:border-apple-gray-700"><h2 className="font-semibold text-lg">Software Customers (Tenants)</h2><p className="text-sm text-apple-gray-500">Businesses that signed up for PressFlow. Edit their public directory profile here.</p></div>
                                    <div className="overflow-x-auto"><table className="min-w-full text-sm"><thead><tr><th className="px-4 py-3 text-left">Name</th><th className="px-4 py-3 text-left">City</th><th className="px-4 py-3 text-left">Listed in Directory?</th><th className="px-4 py-3 text-center">Actions</th></tr></thead><tbody className="divide-y">
                                        {tenants.map(tenant => (<tr key={tenant._id}>
                                            <td className="px-4 py-2 font-medium">{tenant.name}</td>
                                            <td className="px-4 py-2">{tenant.city || 'N/A'}</td>
                                            <td className="px-4 py-2">{tenant.isListedInDirectory ? 'Yes' : 'No'}</td>
                                            <td className="px-4 py-2 text-center"><Button size="sm" variant="ghost" onClick={() => handleOpenEditTenantModal(tenant)} title="Edit Public Profile"><Edit3 size={16} /></Button></td>
                                        </tr>))}</tbody></table></div>
                                </Card>
                            )}
                            {activeTab === 'listings' && (
                                <Card>
                                    <div className="flex justify-between items-center p-4 border-b dark:border-apple-gray-700"><h2 className="font-semibold text-lg">Manual Directory Listings</h2><Button iconLeft={<PlusCircle size={16} />} onClick={handleOpenCreateListingModal}>Add New Listing</Button></div>
                                    <div className="overflow-x-auto"><table className="min-w-full text-sm"><thead><tr><th>Business Name</th><th>City</th><th>Phone</th><th>Status</th><th>Actions</th></tr></thead><tbody className="divide-y">
                                        {listings.map(listing => (<tr key={listing._id}>
                                            <td className="px-4 py-2 font-medium">{listing.name}</td>
                                            <td className="px-4 py-2">{listing.city || 'N/A'}</td>
                                            <td className="px-4 py-2">{listing.publicPhone || 'N/A'}</td>
                                            <td className="px-4 py-2"><span className={`px-2 py-0.5 rounded-full text-xs ${listing.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>{listing.isActive ? 'Active' : 'Inactive'}</span></td>
                                            <td className="px-4 py-2 text-center"><div className="flex justify-center space-x-2"><Button size="sm" variant="ghost" onClick={() => handleOpenEditListingModal(listing)}><Edit3 size={16} /></Button><Button size="sm" variant="ghost" className="text-apple-red" onClick={() => handleDeleteListing(listing)}><Trash2 size={16} /></Button></div></td>
                                        </tr>))}</tbody></table></div>
                                </Card>
                            )}
                        </div>
                    )}
                </div>
            </div>
            <ListingFormModal isOpen={isListingModalOpen} onClose={() => setIsListingModalOpen(false)} onSubmit={handleListingFormSubmit} listingToEdit={editingListing} apiError={apiError} isLoading={isSubmitting} />
            <TenantFormModal isOpen={isTenantModalOpen} onClose={() => setIsTenantModalOpen(false)} onSubmit={handleTenantFormSubmit} tenantToEdit={editingTenant} apiError={apiError} isLoading={isSubmitting} />
        </>
    );
};
export default DirectoryAdminDashboard;