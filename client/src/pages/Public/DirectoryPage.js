// client/src/pages/Public/DirectoryPage.js
import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { getPublicDirectoryApi } from '../../services/api'; // Add this to api.js
import Card from '../../components/UI/Card';
import Input from '../../components/UI/Input';
import Spinner from '../../components/UI/Spinner';
import { Building, Search, MapPin, Phone, Mail } from 'lucide-react';
// Import PublicHeader and PublicFooter if they are separate components
// const PublicHeader = () => ...;
// const PublicFooter = () => ...;

const BusinessCard = ({ business }) => (
    <Card className="flex flex-col h-full">
        <div className="p-6 flex-grow">
            {business.logoUrl ? (
                <img src={business.logoUrl} alt={`${business.name} logo`} className="h-16 w-16 mb-4 object-contain rounded-md" />
            ) : (
                <div className="h-16 w-16 mb-4 bg-apple-gray-200 dark:bg-apple-gray-700 rounded-md flex items-center justify-center">
                    <Building size={32} className="text-apple-gray-400" />
                </div>
            )}
            <h3 className="font-bold text-xl mb-2 text-apple-gray-800 dark:text-apple-gray-100">{business.name}</h3>
            <p className="text-sm text-apple-gray-600 dark:text-apple-gray-400 mb-4">{business.description || 'Quality pressing and laundry services.'}</p>
            
            <div className="space-y-2 text-xs text-apple-gray-500 dark:text-apple-gray-300">
                {business.publicAddress && <p className="flex items-start"><MapPin size={14} className="mr-2 mt-0.5 flex-shrink-0" />{business.publicAddress}</p>}
                {business.publicPhone && <p className="flex items-center"><Phone size={14} className="mr-2" />{business.publicPhone}</p>}
                {business.publicEmail && <p className="flex items-center"><Mail size={14} className="mr-2" />{business.publicEmail}</p>}
            </div>
        </div>
        <div className="bg-apple-gray-50 dark:bg-apple-gray-800/50 p-4 mt-auto">
            {/* This could be a link to a dedicated profile page for the business if you build one */}
            <span className="text-xs text-apple-blue">{business.city || ''}{business.country ? `, ${business.country}` : ''}</span>
        </div>
    </Card>
);

const DirectoryPage = () => {
    const [businesses, setBusinesses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [search, setSearch] = useState('');
    const [city, setCity] = useState('');

    const loadDirectory = useCallback(async () => {
        setLoading(true);
        try {
            const { data } = await getPublicDirectoryApi({ search, city });
            setBusinesses(data);
        } catch (err) {
            setError("Could not load business directory.");
        } finally {
            setLoading(false);
        }
    }, [search, city]);

    useEffect(() => {
        loadDirectory();
    }, [loadDirectory]);
    const PublicFooter = () => (
        <footer className="bg-apple-gray-100 dark:bg-apple-gray-900 border-t border-apple-gray-200 dark:border-apple-gray-800">
            <div className="container mx-auto px-6 py-8">
                <div className="flex flex-col md:flex-row justify-between items-center">
                    <div className="text-center md:text-left mb-4 md:mb-0">
                        <p className="text-sm text-apple-gray-600 dark:text-apple-gray-400">© {new Date().getFullYear()} PressFlow. All rights reserved.</p>
                    </div>
                    <div className="flex space-x-6">
                        <Link to="/privacy-policy" className="text-sm text-apple-gray-500 hover:text-apple-blue dark:hover:text-white">Privacy Policy</Link>
                        <Link to="/terms-of-service" className="text-sm text-apple-gray-500 hover:text-apple-blue dark:hover:text-white">Terms of Service</Link>
                    </div>
                </div>
            </div>
        </footer>
    );
    return (
        <div className="bg-apple-gray-50 dark:bg-apple-gray-950 min-h-screen">
            {/* <PublicHeader /> */}
            <main className="container mx-auto px-6 py-12">
                <div className="text-center mb-12">
                    <h1 className="text-4xl md:text-5xl font-bold tracking-tight">Business Directory</h1>
                    <p className="mt-4 text-lg text-apple-gray-600 dark:text-apple-gray-400">Find a PressFlow-powered laundry and dry cleaning service near you.</p>
                </div>

                <div className="max-w-2xl mx-auto mb-12 p-4 bg-white dark:bg-apple-gray-900 rounded-lg shadow-sm">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input label="Search by Business Name" value={search} onChange={e => setSearch(e.target.value)} prefixIcon={<Search size={16} />} className="mb-0" />
                        <Input label="Filter by City" value={city} onChange={e => setCity(e.target.value)} prefixIcon={<MapPin size={16} />} className="mb-0" />
                    </div>
                </div>

                {loading ? (
                    <div className="text-center"><Spinner size="lg" /></div>
                ) : error ? (
                    <p className="text-center text-apple-red">{error}</p>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {businesses.map(business => (
                            <BusinessCard key={business._id} business={business} />
                        ))}
                    </div>
                )}
                 { !loading && businesses.length === 0 && <p className="text-center text-apple-gray-500 mt-8">No businesses found matching your criteria.</p>}
            </main>
            <PublicFooter />
        </div>
    );
};

export default DirectoryPage;