// client/src/pages/Admin/DirectoryAdminDashboard.js

import React, { useState, useEffect, useCallback } from 'react';
import { useDirectoryAuth } from '../../contexts/DirectoryAuthContext';
import {
    getAllDirectoryListingsApi, createDirectoryListingApi, updateDirectoryListingApi, deleteDirectoryListingApi,
    getAllTenantsApi, updateTenantApi, getAllPlansAdminApi, updatePlanApi
} from '../../services/api';
import Card from '../../components/UI/Card';
import Button from '../../components/UI/Button';
import Spinner from '../../components/UI/Spinner';
import ListingFormModal from '../../components/Admin/ListingFormModal';
import TenantFormModal from '../../components/Admin/TenantFormModal';
import { List, Users, Tag, PlusCircle, Edit3, Trash2, AlertTriangle, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';

// Reusable Tab Button Component
const TabButton = ({ label, icon, isActive, onPress }) => (
    <button
        onClick={onPress}
        className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-t-lg transition-colors border-b-2 ${
            isActive
                ? 'border-apple-blue text-apple-blue font-semibold'
                : 'border-transparent text-apple-gray-500 hover:border-apple-gray-300 hover:text-apple-gray-800'
        }`}
    >
        {icon}
        <span>{label}</span>
    </button>
);

// Self-contained component for the Pricing Management Tab
const PricingTab = () => {
    const [plans, setPlans] = useState([]);
    const [loading, setLoading] = useState(true);
    const [savingPlanId, setSavingPlanId] = useState(null);

    const fetchPlans = useCallback(async () => {
        setLoading(true);
        try {
            const { data } = await getAllPlansAdminApi();
            setPlans(data);
        } catch (error) {
            toast.error("Failed to load pricing plans.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchPlans();
    }, [fetchPlans]);

    const handlePriceChange = (planId, currency, newAmount) => {
        setPlans(currentPlans =>
            currentPlans.map(plan => {
                if (plan._id === planId) {
                    const updatedPrices = plan.prices.map(price => 
                        price.currency === currency 
                            ? { ...price, amount: parseFloat(newAmount) || 0 } 
                            : price
                    );
                    return { ...plan, prices: updatedPrices };
                }
                return plan;
            })
        );
    };

    const handleSave = async (planToSave) => {
        setSavingPlanId(planToSave._id);
        try {
            await updatePlanApi(planToSave._id, {
                prices: planToSave.prices.map(({ currency, amount }) => ({ currency, amount }))
            });
            toast.success(`${planToSave.name} plan prices updated successfully!`);
        } catch (error) {
            toast.error(`Failed to save ${planToSave.name} plan prices.`);
            fetchPlans(); // Re-fetch to revert optimistic update on failure
        } finally {
            setSavingPlanId(null);
        }
    };

    if (loading) return <div className="p-8 flex justify-center"><Spinner text="Loading Pricing Plans..." /></div>;

    return (
        <Card>
            <div className="p-4 border-b dark:border-apple-gray-700">
                <h2 className="font-semibold text-lg">Subscription Price Management</h2>
                <p className="text-sm text-apple-gray-500">Set the price for each plan in all supported currencies.</p>
            </div>
            <div className="p-4 md:p-6 space-y-8">
                {plans && plans.length > 0 ? (
                    plans.filter(p => p.name !== 'Trial').map((plan) => (
                        <div key={plan._id} className="bg-apple-gray-50 dark:bg-apple-gray-900 p-4 rounded-lg">
                            <h3 className="text-xl font-semibold mb-4">{plan.name} Plan</h3>
                            {plan.prices && plan.prices.map((price) => (
                                <div key={price.currency} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center mb-3">
                                    <label className="font-medium text-apple-gray-600 dark:text-apple-gray-300">{price.currency}</label>
                                    <div className="md:col-span-2 relative">
                                        <input type="number" value={price.amount} onChange={(e) => handlePriceChange(plan._id, price.currency, e.target.value)} className="w-full p-2 border rounded-md dark:bg-apple-gray-800 dark:border-apple-gray-700 pr-16" placeholder="0.00" />
                                        <span className="absolute inset-y-0 right-0 flex items-center pr-3 text-apple-gray-400">{price.currency}</span>
                                    </div>
                                </div>
                            ))}
                            <div className="text-right mt-6">
                                <Button onClick={() => handleSave(plan)} isLoading={savingPlanId === plan._id}>
                                    Save {plan.name} Prices
                                </Button>
                            </div>
                        </div>
                    ))
                ) : (
                    <p className="p-4 text-apple-gray-500">No subscription plans found. Run the seeder to initialize them.</p>
                )}
            </div>
        </Card>
    );
};

// Main Dashboard Component
const DirectoryAdminDashboard = () => {
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
        if (activeTab === 'tenants' || activeTab === 'listings') {
            setLoading(true);
            setError('');
            try {
                const [tenantsRes, listingsRes] = await Promise.all([ getAllTenantsApi(), getAllDirectoryListingsApi() ]);
                setTenants(tenantsRes.data);
                setListings(listingsRes.data);
            } catch (err) { setError("Failed to load dashboard data."); console.error(err);
            } finally { setLoading(false); }
        }
    }, [activeTab]);

    useEffect(() => { 
        loadData();
    }, [loadData]);

    useEffect(() => {
        let timer;
        if (success || error) { timer = setTimeout(() => { setSuccess(''); setError(''); }, 4000); }
        return () => clearTimeout(timer);
    }, [success, error]);

    const handleOpenCreateListingModal = () => { setEditingListing(null); setApiError(''); setIsListingModalOpen(true); };
    const handleOpenEditListingModal = (listing) => { setEditingListing(listing); setApiError(''); setIsListingModalOpen(true); };
    const handleOpenEditTenantModal = (tenant) => { setEditingTenant(tenant); setApiError(''); setIsTenantModalOpen(true); };

    const handleListingFormSubmit = async (formData) => {
        setIsSubmitting(true); setApiError('');
        try {
            const { data } = editingListing ? await updateDirectoryListingApi(editingListing._id, formData) : await createDirectoryListingApi(formData);
            setSuccess(`Listing "${data.name}" ${editingListing ? 'updated' : 'created'} successfully.`);
            setIsListingModalOpen(false);
            loadData();
        } catch (err) { setApiError(err.response?.data?.message || "An error occurred."); throw err;
        } finally { setIsSubmitting(false); }
    };

    const handleTenantFormSubmit = async (formData) => {
        setIsSubmitting(true); setApiError('');
        try {
            const { data } = await updateTenantApi(editingTenant._id, formData);
            setSuccess(`Software Customer "${data.name}" updated successfully.`);
            setIsTenantModalOpen(false);
            loadData();
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

    const renderTabContent = () => {
        switch (activeTab) {
            case 'tenants':
                return loading ? <div className="p-8 flex justify-center"><Spinner /></div> : (
                    <Card>
                        <div className="p-4 border-b dark:border-apple-gray-700"><h2 className="font-semibold text-lg">Software Customers (Tenants)</h2><p className="text-sm text-apple-gray-500">Businesses that signed up for lsmbooker. Edit their public directory profile here.</p></div>
                        <div className="overflow-x-auto"><table className="min-w-full text-sm"><thead><tr><th className="px-4 py-3 text-left">Name</th><th className="px-4 py-3 text-left">City</th><th className="px-4 py-3 text-left">Listed in Directory?</th><th className="px-4 py-3 text-center">Actions</th></tr></thead><tbody className="divide-y dark:divide-apple-gray-700">
                            {tenants.map(tenant => (<tr key={tenant._id}><td className="px-4 py-2 font-medium">{tenant.name}</td><td className="px-4 py-2">{tenant.city || 'N/A'}</td><td className="px-4 py-2">{tenant.isListedInDirectory ? 'Yes' : 'No'}</td><td className="px-4 py-2 text-center"><Button size="sm" variant="ghost" onClick={() => handleOpenEditTenantModal(tenant)} title="Edit Public Profile"><Edit3 size={16} /></Button></td></tr>))}</tbody></table></div>
                    </Card>
                );
            case 'listings':
                return loading ? <div className="p-8 flex justify-center"><Spinner /></div> : (
                    <Card>
                        <div className="flex justify-between items-center p-4 border-b dark:border-apple-gray-700"><h2 className="font-semibold text-lg">Manual Directory Listings</h2><Button iconLeft={<PlusCircle size={16} />} onClick={handleOpenCreateListingModal}>Add New Listing</Button></div>
                        <div className="overflow-x-auto"><table className="min-w-full text-sm"><thead><tr><th className="px-4 py-3 text-left">Business Name</th><th className="px-4 py-3 text-left">City</th><th className="px-4 py-3 text-left">Phone</th><th className="px-4 py-3 text-left">Status</th><th className="px-4 py-3 text-center">Actions</th></tr></thead><tbody className="divide-y dark:divide-apple-gray-700">
                            {listings.map(listing => (<tr key={listing._id}><td className="px-4 py-2 font-medium">{listing.name}</td><td className="px-4 py-2">{listing.city || 'N/A'}</td><td className="px-4 py-2">{listing.publicPhone || 'N/A'}</td><td className="px-4 py-2"><span className={`px-2 py-0.5 rounded-full text-xs ${listing.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>{listing.isActive ? 'Active' : 'Inactive'}</span></td><td className="px-4 py-2 text-center"><div className="flex justify-center space-x-2"><Button size="sm" variant="ghost" onClick={() => handleOpenEditListingModal(listing)}><Edit3 size={16} /></Button><Button size="sm" variant="ghost" className="text-apple-red" onClick={() => handleDeleteListing(listing)}><Trash2 size={16} /></Button></div></td></tr>))}</tbody></table></div>
                    </Card>
                );
            case 'pricing':
                return <PricingTab />;
            default:
                return null;
        }
    };

    return (
        <>
            <div className="min-h-screen bg-apple-gray-100 dark:bg-apple-gray-900 text-apple-gray-900 dark:text-apple-gray-100 p-4 sm:p-8">
                <div className="max-w-7xl mx-auto">
                    <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
                        <div className="flex items-center space-x-3">
                            <List size={32} className="text-apple-blue" />
                            <h1 className="text-3xl font-bold">Directory Admin Dashboard</h1>
                        </div>
                        <Button onClick={handleLogout} variant="secondary">Logout</Button>
                    </div>
                    {success && <div className="p-3 mb-4 bg-green-100 text-apple-green rounded-apple flex items-center"><CheckCircle2 size={18} className="mr-2"/>{success}</div>}
                    {error && <div className="p-3 mb-4 bg-red-100 text-apple-red rounded-apple flex items-center"><AlertTriangle size={18} className="mr-2"/>{error}</div>}

                    <div className="flex space-x-2 border-b dark:border-apple-gray-700 mb-6">
                        <TabButton label={`Software Customers (${tenants.length})`} icon={<Users size={16}/>} isActive={activeTab === 'tenants'} onPress={() => setActiveTab('tenants')} />
                        <TabButton label={`Manual Listings (${listings.length})`} icon={<List size={16}/>} isActive={activeTab === 'listings'} onPress={() => setActiveTab('listings')} />
                        <TabButton label="Plan Pricing" icon={<Tag size={16}/>} isActive={activeTab === 'pricing'} onPress={() => setActiveTab('pricing')} />
                    </div>
                    
                    {renderTabContent()}
                </div>
            </div>
            <ListingFormModal isOpen={isListingModalOpen} onClose={() => setIsListingModalOpen(false)} onSubmit={handleListingFormSubmit} listingToEdit={editingListing} apiError={apiError} isLoading={isSubmitting} />
            <TenantFormModal isOpen={isTenantModalOpen} onClose={() => setIsTenantModalOpen(false)} onSubmit={handleTenantFormSubmit} tenantToEdit={editingTenant} apiError={apiError} isLoading={isSubmitting} />
        </>
    );
};
export default DirectoryAdminDashboard;