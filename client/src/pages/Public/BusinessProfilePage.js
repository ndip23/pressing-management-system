// client/src/pages/Public/BusinessProfilePage.js
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getBusinessBySlugApi } from '../../services/api';
import Spinner from '../../components/UI/Spinner';
import { Building, MapPin, Phone, Mail } from 'lucide-react';

const BusinessProfilePage = () => {
    const { slug } = useParams();
    const [business, setBusiness] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const loadBusiness = async () => {
            setLoading(true);
            try {
                const { data } = await getBusinessBySlugApi(slug);
                setBusiness(data);
            } catch (err) {
                setError("Business not found or not available.");
            } finally {
                setLoading(false);
            }
        };
        loadBusiness();
    }, [slug]);

    if (loading) return <div className="p-12 text-center"><Spinner size="lg" /></div>;
    if (error) return <div className="p-12 text-center text-apple-red">{error}</div>;
    if (!business) return null;

    return (
        <div className="container mx-auto px-6 py-12 max-w-4xl">
            <div className="bg-white dark:bg-apple-gray-900 rounded-lg shadow-xl p-8">
                <div className="flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left">
                    {business.logoUrl ? (
                        <img src={business.logoUrl} alt={`${business.name} logo`} className="h-24 w-24 rounded-md object-contain mb-4 sm:mb-0 sm:mr-6 flex-shrink-0" />
                    ) : (
                        <div className="h-24 w-24 rounded-md bg-apple-gray-200 dark:bg-apple-gray-700 flex items-center justify-center mb-4 sm:mb-0 sm:mr-6 flex-shrink-0">
                            <Building size={48} className="text-apple-gray-400" />
                        </div>
                    )}
                    <div>
                        <h1 className="text-3xl font-bold text-apple-gray-900 dark:text-white">{business.name}</h1>
                        <p className="text-lg text-apple-gray-600 dark:text-apple-gray-400 mt-2">{business.description}</p>
                    </div>
                </div>

                <hr className="my-8 dark:border-apple-gray-700" />

                <div className="space-y-4 text-apple-gray-700 dark:text-apple-gray-300">
                     <div className="flex items-start"><MapPin size={18} className="mr-3 mt-1 text-apple-blue flex-shrink-0" /><p>{business.publicAddress}<br/>{business.city}, {business.country}</p></div>
                     {business.publicPhone && <div className="flex items-center"><Phone size={18} className="mr-3 text-apple-blue flex-shrink-0" /><a href={`tel:${business.publicPhone}`} className="hover:underline">{business.publicPhone}</a></div>}
                     {business.publicEmail && <div className="flex items-center"><Mail size={18} className="mr-3 text-apple-blue flex-shrink-0" /><a href={`mailto:${business.publicEmail}`} className="hover:underline">{business.publicEmail}</a></div>}
                </div>
            </div>
        </div>
    );
};
export default BusinessProfilePage;