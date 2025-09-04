// client/src/pages/Admin/DirectoryAdminDashboard.js
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDirectoryAuth } from '../../contexts/DirectoryAuthContext';
import {
    getAllDirectoryListingsApi,
    createDirectoryListingApi,
    updateDirectoryListingApi,
    deleteDirectoryListingApi
} from '../../services/api';
import Card from '../../components/UI/Card';
import Button from '../../components/UI/Button';
import Spinner from '../../components/UI/Spinner';
import ListingFormModal from '../../components/Admin/ListingFormModal'; // The form modal
import { List, PlusCircle, AlertTriangle, CheckCircle2, Edit3, Trash2 } from 'lucide-react';

const DirectoryAdminDashboard = () => {
    const navigate = useNavigate();
    const { dirAdminLogout } = useDirectoryAuth();

    const [listings, setListings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [apiError, setApiError] = useState(''); // For passing errors to the modal

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingListing, setEditingListing] = useState(null);

    const loadListings = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const { data } = await getAllDirectoryListingsApi();
            setListings(data);
        } catch (err) {
            setError('Failed to load directory listings.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadListings();
    }, [loadListings]);

    useEffect(() => {
        let timer;
        if (success || error) {
            timer = setTimeout(() => { setSuccess(''); setError(''); }, 4000);
        }
        return () => clearTimeout(timer);
    }, [success, error]);

    const handleOpenCreateModal = () => {
        setEditingListing(null);
        setApiError('');
        setIsModalOpen(true);
    };

    const handleOpenEditModal = (listing) => {
        setEditingListing(listing);
        setApiError('');
        setIsModalOpen(true);
    };

    const handleFormSubmit = async (formData) => {
        setIsSubmitting(true);
        setApiError('');
        try {
            if (editingListing) {
                const { data } = await updateDirectoryListingApi(editingListing._id, formData);
                setSuccess(`Listing "${data.name}" updated successfully.`);
            } else {
                const { data } = await createDirectoryListingApi(formData);
                setSuccess(`Listing "${data.name}" created successfully.`);
            }
            setIsModalOpen(false);
            loadListings();
        } catch (err) {
            setApiError(err.response?.data?.message || "An error occurred. Please try again.");
            throw err; // Re-throw to let the modal know submission failed
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteListing = async (listing) => {
        if (window.confirm(`Are you sure you want to delete the listing for "${listing.name}"? This action cannot be undone.`)) {
            try {
                const { data } = await deleteDirectoryListingApi(listing._id);
                setSuccess(data.message);
                loadListings();
            } catch (err) {
                setError(err.response?.data?.message || "Failed to delete listing.");
            }
        }
    };

    const handleLogout = () => {
        dirAdminLogout();
        // The DirectoryAdminRoute will automatically redirect to the login page
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

                    <Card>
                        <div className="flex justify-between items-center p-4 border-b dark:border-apple-gray-700">
                            <h2 className="font-semibold text-lg">Manual Business Listings</h2>
                            <Button iconLeft={<PlusCircle size={16} />} onClick={handleOpenCreateModal}>Add New Listing</Button>
                        </div>
                        {loading ? (
                            <div className="p-8 text-center"><Spinner /></div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="min-w-full text-sm">
                                    <thead className="bg-apple-gray-50 dark:bg-apple-gray-800">
                                        <tr>
                                            <th className="px-4 py-3 text-left font-semibold">Business Name</th>
                                            <th className="px-4 py-3 text-left font-semibold">City</th>
                                            <th className="px-4 py-3 text-left font-semibold">Phone</th>
                                            <th className="px-4 py-3 text-left font-semibold">Status</th>
                                            <th className="px-4 py-3 text-center font-semibold">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-apple-gray-200 dark:divide-apple-gray-700">
                                        {listings.length === 0 && (
                                            <tr><td colSpan="5" className="text-center p-8 text-apple-gray-500">No manual listings found. Click "Add New Listing" to begin.</td></tr>
                                        )}
                                        {listings.map(listing => (
                                            <tr key={listing._id} className="hover:bg-apple-gray-50 dark:hover:bg-apple-gray-800/50">
                                                <td className="px-4 py-3 font-medium">{listing.name}</td>
                                                <td className="px-4 py-3">{listing.city || 'N/A'}</td>
                                                <td className="px-4 py-3">{listing.publicPhone || 'N/A'}</td>
                                                <td className="px-4 py-3">
                                                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${listing.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                                                        {listing.isActive ? 'Active' : 'Inactive'}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 text-center">
                                                    <div className="flex justify-center space-x-2">
                                                        <Button size="sm" variant="ghost" onClick={() => handleOpenEditModal(listing)} title="Edit"><Edit3 size={16} /></Button>
                                                        <Button size="sm" variant="ghost" className="text-apple-red" onClick={() => handleDeleteListing(listing)} title="Delete"><Trash2 size={16} /></Button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </Card>
                </div>
            </div>
            
            <ListingFormModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSubmit={handleFormSubmit}
                listingToEdit={editingListing}
                apiError={apiError}
                isLoading={isSubmitting}
            />
        </>
    );
};

export default DirectoryAdminDashboard;