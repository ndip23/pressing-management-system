// client/src/pages/Admin/ManageDirectoryPage.js
import React, { useState, useEffect, useCallback } from 'react';
import { createDirectoryListingApi, getAllDirectoryListingsApi, updateDirectoryListingApi, deleteDirectoryListingApi } from '../../services/api'; // Create these in api.js
import Card from '../../components/UI/Card';
import Button from '../../components/UI/Button';
import Spinner from '../../components/UI/Spinner';
import { List, PlusCircle, AlertTriangle, CheckCircle2 } from 'lucide-react';
// You will also need a Form Modal for creating/editing, like UserFormModal

const ManageDirectoryPage = () => {
    const [listings, setListings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const loadListings = useCallback(async () => {
        setLoading(true);
        try {
            const { data } = await getAllDirectoryListingsApi();
            setListings(data);
        } catch (err) {
            setError('Failed to load directory listings.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadListings();
    }, [loadListings]);

    // Placeholder handlers - you would wire these up to a modal form
    const handleCreateListing = async (formData) => { /* Calls createDirectoryListingApi */ };
    const handleUpdateListing = async (listingId, formData) => { /* Calls updateDirectoryListingApi */ };
    const handleDeleteListing = async (listingId) => { /* Calls deleteDirectoryListingApi */ };

    return (
        <div className="space-y-6">
            <div className="flex items-center space-x-3">
                <List size={28} className="text-apple-blue" />
                <h1 className="text-2xl sm:text-3xl font-semibold">Manage Directory Listings</h1>
            </div>
            <p className="text-apple-gray-500">
                Manually add, edit, or remove businesses that are advertised in the public directory.
            </p>
            
            {success && <div className="p-3 bg-green-100 text-apple-green rounded-apple"><CheckCircle2 size={18} className="inline mr-2"/>{success}</div>}
            {error && <div className="p-3 bg-red-100 text-apple-red rounded-apple"><AlertTriangle size={18} className="inline mr-2"/>{error}</div>}

            <Card>
                <div className="flex justify-between items-center p-4 border-b">
                    <h2 className="font-semibold">Existing Manual Listings ({listings.length})</h2>
                    <Button iconLeft={<PlusCircle size={16} />}>Add New Listing</Button>
                </div>
                {loading ? <div className="p-8 text-center"><Spinner /></div> : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full">
                            <thead className="bg-apple-gray-50 dark:bg-apple-gray-800">
                                <tr>
                                    <th className="px-4 py-2 text-left">Name</th>
                                    <th className="px-4 py-2 text-left">City</th>
                                    <th className="px-4 py-2 text-left">Status</th>
                                    <th className="px-4 py-2">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {listings.map(listing => (
                                    <tr key={listing._id} className="border-t">
                                        <td className="px-4 py-2">{listing.name}</td>
                                        <td className="px-4 py-2">{listing.city}</td>
                                        <td className="px-4 py-2">{listing.isActive ? 'Active' : 'Inactive'}</td>
                                        <td className="px-4 py-2 text-center">
                                            {/* Add Edit and Delete buttons here */}
                                            <Button size="sm" variant="ghost">Edit</Button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </Card>
        </div>
    );
};

export default ManageDirectoryPage;