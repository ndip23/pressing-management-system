// client/src/pages/Public/DirectoryPage.js
import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { getPublicDirectoryApi } from '../../services/api';
import Spinner from '../../components/UI/Spinner';
import Input from '../../components/UI/Input';
import { MapPin, Search, Aperture } from 'lucide-react'; // Added Aperture for empty state

// --- NEW, IMPROVED BusinessCard Component ---
const BusinessCard = ({ business }) => (
    <Link
        to={`/directory/${business.slug}`}
        className="block bg-white dark:bg-apple-gray-900 rounded-apple-xl shadow-apple transition-all duration-300 ease-in-out hover:shadow-apple-lg hover:-translate-y-1.5"
    >
        <div className="p-5">
            <div className="flex items-center">
                <div className="w-16 h-16 rounded-lg bg-apple-gray-200 dark:bg-apple-gray-700 flex-shrink-0 mr-5 flex items-center justify-center overflow-hidden">
                    {business.logoUrl ? (
                        <img src={business.logoUrl} alt={`${business.name} logo`} className="w-full h-full object-cover" />
                    ) : (
                        <span className="text-3xl font-light text-apple-gray-500">{business.name?.charAt(0).toUpperCase()}</span>
                    )}
                </div>
                <div className="flex-1 overflow-hidden">
                    <h3 className="font-semibold text-lg text-apple-gray-900 dark:text-white truncate" title={business.name}>
                        {business.name}
                    </h3>
                    <div className="flex items-center mt-1 text-xs text-apple-gray-500 dark:text-apple-gray-400">
                        <MapPin size={12} className="mr-1.5 flex-shrink-0" />
                        <span className="truncate">{business.city || 'N/A'}{business.country && `, ${business.country}`}</span>
                    </div>
                </div>
            </div>
            <p className="mt-4 text-sm text-apple-gray-600 dark:text-apple-gray-400 h-10 line-clamp-2">
                {business.description || 'Professional pressing, laundry, and dry cleaning services.'}
            </p>
        </div>
        <div className="px-5 py-3 bg-apple-gray-50 dark:bg-apple-gray-800/50 border-t border-apple-gray-200 dark:border-apple-gray-700/50">
            <span className="text-xs font-semibold text-apple-blue dark:text-sky-400">View Profile &rarr;</span>
        </div>
    </Link>
);

const DirectoryPage = () => {
    const [businesses, setBusinesses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [cityFilter, setCityFilter] = useState('');

    const loadBusinesses = useCallback(async () => {
        // Don't show the main spinner on subsequent filter changes, only on initial load
        if (!loading) setLoading(true); // Or use a different loading state for filtering
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
        }, 400); // 400ms debounce
        return () => clearTimeout(handler);
    }, [searchTerm, cityFilter, loadBusinesses]);


    return (
        <>
            {/* Header section */}
            <section className="py-16 md:py-20 bg-white dark:bg-apple-gray-900 border-b border-apple-gray-200 dark:border-apple-gray-800">
                <div className="container mx-auto px-6 text-center">
                    <div className="mb-2">
                        <span className="inline-block px-3 py-1 text-xs font-semibold text-apple-blue bg-apple-blue/10 rounded-full">
                            Powered by PressFlow
                        </span>
                    </div>
                    <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-apple-gray-900 dark:text-white">
                        Business Directory
                    </h1>
                    <p className="mt-4 text-lg text-apple-gray-600 dark:text-apple-gray-400 max-w-2xl mx-auto">
                        Find a professional pressing and laundry service near you.
                    </p>
                    <div className="mt-8 max-w-2xl mx-auto grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Input
                            id="search"
                            placeholder="Search by business name..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            prefixIcon={<Search size={18} />}
                            className="mb-0" // Removes bottom margin
                        />
                        <Input
                            id="city"
                            placeholder="Filter by city..."
                            value={cityFilter}
                            onChange={(e) => setCityFilter(e.target.value)}
                            prefixIcon={<MapPin size={18} />}
                            className="mb-0"
                        />
                    </div>
                </div>
            </section>

            {/* Business listing section */}
            <section className="py-12 md:py-16">
                <div className="container mx-auto px-6">
                    {loading ? (
                        <div className="flex justify-center items-center h-40"><Spinner size="lg" /></div>
                    ) : error ? (
                        <p className="text-center text-red-500 py-12">{error}</p>
                    ) : businesses.length === 0 ? (
                        <div className="text-center py-12">
                            <Aperture size={48} className="mx-auto text-apple-gray-400 dark:text-apple-gray-600 mb-4" />
                            <h3 className="text-xl font-semibold text-apple-gray-700 dark:text-apple-gray-300">No Businesses Found</h3>
                            <p className="text-apple-gray-500 dark:text-apple-gray-400 mt-2">
                                We couldn't find any listings matching your criteria. Try a different search.
                            </p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {businesses.map(business => (
                                <BusinessCard key={business._id || business.slug} business={business} />
                            ))}
                        </div>
                    )}
                </div>
            </section>
        </>
    );
};

export default DirectoryPage;