import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { getPublicDirectoryApi, contactBusinessViaWhatsAppApi } from '../../services/api';
import Spinner from '../../components/UI/Spinner';
import Input from '../../components/UI/Input';
import Button from '../../components/UI/Button'; // Assuming you have this for the WhatsApp button
import { MapPin, Search, Aperture, Phone } from 'lucide-react';

// --- SELF-CONTAINED, UPGRADED BusinessCard Component ---
const BusinessCard = ({ business }) => {
    // Provide a professional fallback image if a business hasn't uploaded a banner.
    const bannerUrl = business.bannerUrl || 'https://images.unsplash.com/photo-1582735689369-7fe275765448?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3wzNzEyNjZ8MHwxfHNlYXJjaHwxfHxMYXVuZHJ5fGVufDB8MHx8fDE3MjE2Nzg0MDR8MA&ixlib=rb-4.0.3&q=80&w=1080';
    const logoUrl = business.logoUrl;

    const handleWhatsAppContact = async (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (!business.publicPhone) return;

        try {
            const { data } = await contactBusinessViaWhatsAppApi(business.slug);
            if (data?.whatsappUrl) {
                window.open(data.whatsappUrl, '_blank');
            } else {
                throw new Error('Unable to open WhatsApp contact right now.');
            }
        } catch (error) {
            const message = error.response?.data?.message || error.message || 'Unable to contact this business.';
            window.alert(message);
        }
    };

    return (
        <div className="bg-white dark:bg-apple-gray-900 rounded-xl shadow-lg overflow-hidden transition-all duration-300 ease-in-out hover:shadow-2xl hover:-translate-y-2 flex flex-col">
            
            {/* --- Banner and Logo Section --- */}
            <div className="relative">
                {/* 1. The Banner Image (fills the top) */}
                <div 
                    className="h-32 bg-cover bg-center" 
                    style={{ backgroundImage: `url(${bannerUrl})` }}
                />
                
                {/* 2. The Logo (overlaid on top of the banner) */}
                <div className="absolute top-20 left-6 w-20 h-20 rounded-lg bg-white dark:bg-apple-gray-800 p-1 shadow-md flex items-center justify-center overflow-hidden">
                    {logoUrl ? (
                        <img src={logoUrl} alt={`${business.name} logo`} className="w-full h-full object-cover rounded-md" />
                    ) : (
                        <span className="text-3xl font-bold text-apple-blue">{business.name?.charAt(0).toUpperCase()}</span>
                    )}
                </div>
            </div>

            {/* --- Content Section --- */}
            <div className="p-6 pt-12 flex-grow flex flex-col">
                <h3 className="font-bold text-lg text-apple-gray-900 dark:text-white truncate" title={business.name}>
                    {business.name}
                </h3>
                <div className="flex items-center mt-1 text-xs text-apple-gray-500 dark:text-apple-gray-400">
                    <MapPin size={12} className="mr-1.5 flex-shrink-0" />
                    <span className="truncate">{business.city || 'N/A'}{business.country && `, ${business.country}`}</span>
                </div>
                <p className="mt-4 text-sm text-apple-gray-600 dark:text-apple-gray-400 h-10 line-clamp-2 flex-grow">
                    {business.description || 'Professional pressing, laundry, and dry cleaning services.'}
                </p>
                
                {/* Action Buttons */}
                <div className="mt-6 flex flex-col sm:flex-row gap-3">
                    <Link to={`/directory/${business.slug}`} className="flex-1">
                        <Button variant="secondary" className="w-full">
                            View Details
                        </Button>
                    </Link>
                    <Button 
                        onClick={handleWhatsAppContact} 
                        className="flex-1"
                        variant="primary"
                        iconLeft={<Phone size={16} />}
                        disabled={!business.publicPhone}
                    >
                        Contact
                    </Button>
                </div>
            </div>
        </div>
    );
};

// --- Main DirectoryPage Component ---
const DirectoryPage = () => {
    const [businesses, setBusinesses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [cityFilter, setCityFilter] = useState('');

    useEffect(() => {
        const loadBusinesses = async () => {
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
            } finally {
                setLoading(false);
            }
        };
        
        const handler = setTimeout(() => {
            loadBusinesses();
        }, 500); // Debounce search to prevent API calls on every keystroke

        return () => clearTimeout(handler);
    }, [searchTerm, cityFilter]);

    return (
        <>
            {/* --- Header/Search Section --- */}
            <section className="py-16 md:py-20 bg-gradient-to-r from-apple-blue to-apple-blue-dark text-white">
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