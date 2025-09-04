// client/src/pages/Public/BusinessProfilePage.js
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getBusinessBySlugApi } from '../../services/api';
import Spinner from '../../components/UI/Spinner';
import { Mail, Phone, MapPin, Globe } from 'lucide-react';
// No need to import PublicHeader/Footer as they will be in the parent layout route

const BusinessProfilePage = () => {
    const { slug } = useParams();
    const [business, setBusiness] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const loadBusinessProfile = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const { data } = await getBusinessBySlugApi(slug);
            setBusiness(data);
        } catch (err) {
            setError(err.response?.data?.message || 'Could not load business profile.');
        } finally {
            setLoading(false);
        }
    }, [slug]);

    useEffect(() => {
        loadBusinessProfile();
    }, [loadBusinessProfile]);

    if (loading) {
        return <div className="flex justify-center items-center h-screen"><Spinner size="lg" /></div>;
    }

    if (error) {
        return (
            <div className="text-center py-20">
                <p className="text-xl text-red-500">{error}</p>
                <Link to="/directory" className="mt-4 inline-block text-apple-blue hover:underline">
                    &larr; Back to Directory
                </Link>
            </div>
        );
    }

    if (!business) return null;

    return (
        <main className="container mx-auto px-4 py-8 md:py-12">
            <div className="max-w-4xl mx-auto">
                <div className="flex flex-col sm:flex-row items-center bg-white dark:bg-apple-gray-900 p-6 rounded-apple-xl shadow-apple-md">
                    <div className="w-32 h-32 md:w-40 md:h-40 rounded-full bg-apple-gray-200 dark:bg-apple-gray-700 flex-shrink-0 mb-4 sm:mb-0 sm:mr-8 flex items-center justify-center overflow-hidden">
                        {business.logoUrl ? (
                            <img src={business.logoUrl} alt={`${business.name} logo`} className="w-full h-full object-cover" />
                        ) : (
                            <span className="text-5xl font-light text-apple-gray-500">{business.name?.charAt(0).toUpperCase()}</span>
                        )}
                    </div>
                    <div className="text-center sm:text-left">
                        <h1 className="text-3xl md:text-4xl font-bold text-apple-gray-900 dark:text-white">{business.name}</h1>
                        <p className="text-lg text-apple-gray-600 dark:text-apple-gray-400 mt-1">Pressing & Laundry Service</p>
                        <div className="flex items-center justify-center sm:justify-start mt-3 text-sm text-apple-gray-500 dark:text-apple-gray-400">
                            <MapPin size={14} className="mr-1.5" />
                            <span>{business.city || 'Location not specified'}{business.country && `, ${business.country}`}</span>
                        </div>
                    </div>
                </div>

                <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-1">
                        <div className="bg-white dark:bg-apple-gray-900 p-6 rounded-apple-xl shadow-apple-md">
                            <h2 className="text-xl font-semibold mb-4 border-b pb-2 dark:border-apple-gray-700">Contact Details</h2>
                            <div className="space-y-4 text-sm">
                                {business.publicAddress && (
                                    <div className="flex items-start">
                                        <MapPin size={16} className="text-apple-gray-400 mr-3 mt-0.5 flex-shrink-0" />
                                        <span className="text-apple-gray-700 dark:text-apple-gray-300">{business.publicAddress}</span>
                                    </div>
                                )}
                                {business.publicPhone && (
                                    <div className="flex items-start">
                                        <Phone size={16} className="text-apple-gray-400 mr-3 mt-0.5 flex-shrink-0" />
                                        <a href={`tel:${business.publicPhone}`} className="text-apple-blue hover:underline">{business.publicPhone}</a>
                                    </div>
                                )}
                                {business.publicEmail && (
                                    <div className="flex items-start">
                                        <Mail size={16} className="text-apple-gray-400 mr-3 mt-0.5 flex-shrink-0" />
                                        <a href={`mailto:${business.publicEmail}`} className="text-apple-blue hover:underline">{business.publicEmail}</a>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="lg:col-span-2">
                         <div className="bg-white dark:bg-apple-gray-900 p-6 rounded-apple-xl shadow-apple-md">
                            <h2 className="text-xl font-semibold mb-4 border-b pb-2 dark:border-apple-gray-700">About {business.name}</h2>
                            {business.description ? (
                                <p className="text-apple-gray-700 dark:text-apple-gray-300 whitespace-pre-wrap leading-relaxed">{business.description}</p>
                            ) : (
                                <p className="italic text-apple-gray-500">No description provided.</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
};

export default BusinessProfilePage;