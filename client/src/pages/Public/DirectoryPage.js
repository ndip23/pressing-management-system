// client/src/pages/Public/DirectoryPage.js
import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { getPublicDirectoryApi } from '../../services/api';
import Spinner from '../../components/UI/Spinner';
import Input from '../../components/UI/Input';
import { MapPin, Search } from 'lucide-react';

// Reusable card for the directory listing
const BusinessCard = ({ business }) => (
    <div className="bg-white dark:bg-apple-gray-900 rounded-apple-lg shadow-apple transition-all hover:shadow-apple-md hover:-translate-y-1">
        <Link to={`/directory/${business.slug}`} className="block p-5 sm:p-6">
            <div className="flex items-center">
                <div className="w-16 h-16 rounded-full bg-apple-gray-200 dark:bg-apple-gray-700 flex-shrink-0 mr-4 flex items-center justify-center overflow-hidden">
                    {business.logoUrl ? (
                        <img src={business.logoUrl} alt={`${business.name} logo`} className="w-full h-full object-cover" />
                    ) : (
                        <span className="text-3xl font-light text-apple-gray-500">{business.name?.charAt(0).toUpperCase()}</span>
                    )}
                </div>
                <div className="flex-1 overflow-hidden">
                    <h3 className="font-semibold text-lg text-apple-gray-900 dark:text-white truncate" title={business.name}>{business.name}</h3>
                    <p className="text-sm text-apple-gray-600 dark:text-apple-gray-400 mt-1 truncate">
                        {business.description?.substring(0, 70) || 'Pressing & Laundry Service'}...
                    </p>
                    <div className="flex items-center mt-2 text-xs text-apple-gray-500 dark:text-apple-gray-400">
                        <MapPin size={12} className="mr-1.5" />
                        <span>{business.city || 'N/A'}, {business.country || 'N/A'}</span>
                    </div>
                </div>
            </div>
        </Link>
    </div>
);

const DirectoryPage = () => {
    const [businesses, setBusinesses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [cityFilter, setCityFilter] = useState('');

    const loadBusinesses = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const filters = {};
            if (searchTerm) filters.search = searchTerm;
            if (cityFilter) filters.city = cityFilter;
            const { data } = await getPublicDirectoryApi(filters);
            setBusinesses(data || []);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to load directory.');
            console.error("Load Directory Error:", err);
        } finally {
            setLoading(false);
        }
    }, [searchTerm, cityFilter]);

    // Use useEffect with debounce for searching
    useEffect(() => {
        const handler = setTimeout(() => {
            loadBusinesses();
        }, 500); // 500ms debounce
        return () => clearTimeout(handler);
    }, [searchTerm, cityFilter, loadBusinesses]);


    return (
        <>
            {/* Header section */}
            <section className="py-12 bg-white dark:bg-apple-gray-900 border-b dark:border-apple-gray-800">
                <div className="container mx-auto px-6 text-center">
                    <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-apple-gray-900 dark:text-white">Business Directory</h1>
                    <p className="mt-3 text-lg text-apple-gray-600 dark:text-apple-gray-400 max-w-2xl mx-auto">
                        Find a professional pressing and laundry service powered by PressFlow near you.
                    </p>
                    <div className="mt-8 max-w-2xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input
                            id="search"
                            placeholder="Search by business name..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            prefixIcon={<Search size={16} />}
                            className="mb-0"
                        />
                        <Input
                            id="city"
                            placeholder="Filter by city..."
                            value={cityFilter}
                            onChange={(e) => setCityFilter(e.target.value)}
                            prefixIcon={<MapPin size={16} />}
                            className="mb-0"
                        />
                    </div>
                </div>
            </section>

            {/* Business listing section */}
            <section className="py-12">
                <div className="container mx-auto px-6">
                    {loading ? (
                        <div className="flex justify-center items-center h-40"><Spinner size="lg" /></div>
                    ) : error ? (
                        <p className="text-center text-red-500">{error}</p>
                    ) : businesses.length === 0 ? (
                        <p className="text-center text-apple-gray-500">No businesses found matching your criteria.</p>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {businesses.map(business => (
                                <BusinessCard key={business._id} business={business} />
                            ))}
                        </div>
                    )}
                </div>
            </section>
        </>
    );
};

export default DirectoryPage;