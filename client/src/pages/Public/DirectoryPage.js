// client/src/pages/Public/DirectoryPage.js
import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { getPublicDirectoryApi } from '../../services/api';
import Spinner from '../../components/UI/Spinner';
import Input from '../../components/UI/Input';
import { MapPin, Search, Aperture } from 'lucide-react';

// --- NEW, IMPROVED BusinessCard Component ---
const BusinessCard = ({ business }) => (
    <div className="bg-white dark:bg-apple-gray-900 rounded-xl shadow-lg overflow-hidden transition-all duration-300 ease-in-out hover:shadow-2xl hover:-translate-y-2">
        <div className="p-6">
            <div className="flex items-center">
                <div className="w-16 h-16 rounded-lg bg-apple-gray-100 dark:bg-apple-gray-700 flex-shrink-0 mr-5 flex items-center justify-center overflow-hidden">
                    {business.logoUrl ? (
                        <img src={business.logoUrl} alt={`${business.name} logo`} className="w-full h-full object-cover" />
                    ) : (
                        <span className="text-3xl font-bold text-apple-blue">{business.name?.charAt(0).toUpperCase()}</span>
                    )}
                </div>
                <div className="flex-1 overflow-hidden">
                    <h3 className="font-bold text-lg text-apple-gray-900 dark:text-white truncate" title={business.name}>
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
        <Link to={`/directory/${business.slug}`} className="block px-6 py-3 bg-apple-gray-50 dark:bg-apple-gray-800/50 hover:bg-apple-gray-100 dark:hover:bg-apple-gray-800 transition-colors">
            <span className="text-sm font-semibold text-apple-blue dark:text-sky-400">View Profile &rarr;</span>
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
        if (!loading) setLoading(true); // Re-show spinner on filter change
        setError('');
        try {
            const filters = {};
            if (searchTerm) filters.search = searchTerm;
            if (cityFilter) filters.city = cityFilter;
            const { data } = await getPublicDirectoryApi(filters);
            setBusinesses(data || []);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to load directory.');
        } finally {
            setLoading(false);
        }
    }, [searchTerm, cityFilter]); // Removed loading from deps to control it manually

    useEffect(() => {
        const handler = setTimeout(() => {
            loadBusinesses();
        }, 400);
        return () => clearTimeout(handler);
    }, [searchTerm, cityFilter, loadBusinesses]);

    return (
        <>
            {/* --- Vibrant Header/Search Section --- */}
            <section className="py-16 md:py-20 bg-gradient-hero text-white">
                <div className="container mx-auto px-6 text-center">
                    <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-shadow-sm">
                        Find Your Perfect Pressing Service
                    </h1>
                    <p className="mt-4 text-lg text-indigo-200 max-w-2xl mx-auto">
                        Browse our directory of professional laundry and dry cleaning businesses.
                    </p>
                    <div className="mt-8 max-w-2xl mx-auto grid grid-cols-1 sm:grid-cols-2 gap-4 bg-white/10 backdrop-blur-sm p-4 rounded-xl">
                        <Input
                            id="search"
                            placeholder="Search by business name..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            prefixIcon={<Search size={18} />}
                            className="mb-0"
                            // Custom styling for dark background
                            inputClassName="bg-white/20 text-white placeholder-gray-300 border-white/30 focus:bg-white/30 focus:border-white"
                        />
                        <Input
                            id="city"
                            placeholder="Filter by city..."
                            value={cityFilter}
                            onChange={(e) => setCityFilter(e.target.value)}
                            prefixIcon={<MapPin size={18} />}
                            className="mb-0"
                            inputClassName="bg-white/20 text-white placeholder-gray-300 border-white/30 focus:bg-white/30 focus:border-white"
                        />
                    </div>
                </div>
            </section>

            {/* --- Business Listing Section --- */}
            <section className="py-12 md:py-16 bg-apple-gray-100 dark:bg-apple-gray-950">
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