import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getBusinessBySlugApi, getTenantPriceListApi, contactBusinessViaWhatsAppApi } from '../../services/api';
import Spinner from '../../components/UI/Spinner';
import Button from '../../components/UI/Button';
import { Phone, Mail, MapPin, Globe, Facebook, Twitter } from 'lucide-react';

// Reusable component for displaying contact info items, making the main JSX cleaner.
const InfoItem = ({ icon, label, value, href }) => {
    // Don't render the item if the value is missing or just a comma.
    if (!value || value.trim() === ',' || value.trim().toLowerCase() === 'not available') {
        return null;
    }

    const content = href ? (
        <a href={href} target="_blank" rel="noopener noreferrer" className="hover:text-apple-blue transition-colors break-all">
            {value}
        </a>
    ) : (
        <span className="break-all">{value}</span>
    );

    return (
        <div className="flex items-start gap-4">
            <div className="flex-shrink-0 text-apple-gray-400 mt-1">{icon}</div>
            <div>
                <p className="text-xs text-apple-gray-500 dark:text-apple-gray-400">{label}</p>
                <p className="font-semibold text-apple-gray-800 dark:text-white">{content}</p>
            </div>
        </div>
    );
};

const BusinessDetailPage = () => {
    const { slug } = useParams();
    const [business, setBusiness] = useState(null);
    const [priceList, setPriceList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchBusinessData = async () => {
            setLoading(true);
            setError('');
            try {
                const { data: businessData } = await getBusinessBySlugApi(slug);
                if (!businessData) throw new Error('Business not found');
                setBusiness(businessData);

                // If the business is found, use its ID to fetch its price list
                if (businessData._id) {
                    const { data: priceData } = await getTenantPriceListApi(businessData._id);
                    setPriceList(priceData);
                }
            } catch (error) {
                console.error("Failed to fetch business data:", error);
                setError('The business you are looking for could not be found.');
            } finally {
                setLoading(false);
            }
        };
        fetchBusinessData();
    }, [slug]);

    // useMemo hook transforms the flat price list array into a structured table format for easy rendering.
    // This calculation only re-runs when the priceList state changes.
    const { itemTypes, serviceTypes, priceTable } = useMemo(() => {
        if (!priceList || priceList.length === 0) {
            return { itemTypes: [], serviceTypes: [], priceTable: {} };
        }

        const itemTypes = [...new Set(priceList.map(p => p.itemType))].sort();
        const serviceTypes = [...new Set(priceList.map(p => p.serviceType))].sort();

        const table = {};
        itemTypes.forEach(item => table[item] = {});
        priceList.forEach(priceItem => {
            if (priceItem.itemType && priceItem.serviceType) {
                 table[priceItem.itemType][priceItem.serviceType] = priceItem.price;
            }
        });
        return { itemTypes, serviceTypes, priceTable: table };
    }, [priceList]);

    const handleWhatsAppContact = async () => {
        if (!business?.publicPhone) return;

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

    if (loading) {
        return <div className="min-h-[60vh] flex justify-center items-center"><Spinner text="Loading Business Profile..." /></div>;
    }

    if (error || !business) {
        return (
            <div className="min-h-[60vh] flex flex-col justify-center items-center text-center p-4">
                <p className="text-xl text-apple-red">{error || 'Business data could not be loaded.'}</p>
                <Link to="/directory" className="mt-4"><Button>Back to Directory</Button></Link>
            </div>
        );
    }

    // Define bannerUrl here, after we know 'business' is not null, with a fallback.
    const bannerUrl = business.bannerUrl || business.logoUrl || 'https://images.unsplash.com/photo-1626802393339-b4f728b26b6a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3wzNzEyNjZ8MHwxfHNlYXJjaHw3fHxMYXVuZHJ5fGVufDB8MHx8fDE3MjE2Nzg0MDR8MA&ixlib=rb-4.0.3&q=80&w=1080';

    return (
        <div className="bg-apple-gray-50 dark:bg-apple-gray-950">
            <div className="container mx-auto px-4 py-12 md:py-16">
                <div className="grid lg:grid-cols-3 gap-8 lg:gap-12">
                    {/* --- Left Column: About & Price List --- */}
                    <div className="lg:col-span-2 space-y-8">
                        
                        <div 
                            className="h-64 rounded-xl bg-cover bg-center bg-gray-200 dark:bg-apple-gray-800 shadow-lg" 
                            style={{ backgroundImage: `url(${bannerUrl})` }}
                            role="img"
                            aria-label={`${business.name} banner`}
                        />
                        
                        <div className="bg-white dark:bg-apple-gray-900 p-6 rounded-xl shadow-sm">
                            <h2 className="text-2xl font-bold mb-4 text-apple-gray-900 dark:text-white">About {business.name}</h2>
                            <p className="text-apple-gray-600 dark:text-apple-gray-300 whitespace-pre-wrap">{business.description || 'No description provided.'}</p>
                        </div>

                        <div className="bg-white dark:bg-apple-gray-900 p-6 rounded-xl shadow-sm">
                            <h2 className="text-2xl font-bold mb-4 text-apple-gray-900 dark:text-white">Price List</h2>
                            {priceList.length > 0 ? (
                                <div className="overflow-x-auto">
                                    <table className="min-w-full text-left text-sm">
                                        <thead className="border-b dark:border-apple-gray-700">
                                            <tr>
                                                <th className="font-semibold p-3 text-apple-gray-800 dark:text-apple-gray-200">Item Type</th>
                                                {serviceTypes.map(service => <th key={service} className="font-semibold p-3 text-center text-apple-gray-800 dark:text-apple-gray-200">{service}</th>)}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {itemTypes.map(item => (
                                                <tr key={item} className="border-b dark:border-apple-gray-800">
                                                    <td className="font-medium p-3 text-apple-gray-700 dark:text-apple-gray-200">{item}</td>
                                                    {serviceTypes.map(service => (
                                                        <td key={service} className="p-3 text-center text-apple-gray-600 dark:text-apple-gray-300">
                                                            {(priceTable[item]?.[service] && priceTable[item][service] > 0) ? `${priceTable[item][service].toLocaleString('fr-FR')} FCFA` : <span className="text-apple-gray-400">-</span>}
                                                        </td>
                                                    ))}
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (<p className="text-apple-gray-500">Price list is not available for this business.</p>)}
                        </div>
                    </div>
                    
                    {/* --- Right Column: Contact Information --- */}
                    <aside className="lg:col-span-1">
                        <div className="bg-white dark:bg-apple-gray-900 p-6 rounded-xl shadow-sm space-y-6 sticky top-24">
                             <div className="flex flex-col items-center text-center pb-6 border-b dark:border-apple-gray-700">
                                <div className="w-24 h-24 rounded-full bg-apple-gray-100 dark:bg-apple-gray-700 mb-4 flex items-center justify-center overflow-hidden">
                                    {business.logoUrl ? (
                                        <img src={business.logoUrl} alt={`${business.name} logo`} className="w-full h-full object-cover"/>
                                    ) : (
                                        <span className="text-4xl font-bold text-apple-blue">{business.name?.charAt(0).toUpperCase()}</span>
                                    )}
                                </div>
                                <h1 className="text-2xl font-bold text-apple-gray-900 dark:text-white">{business.name}</h1>
                            </div>
                            <h2 className="text-xl font-bold text-apple-gray-900 dark:text-white">Contact Information</h2>
                            <InfoItem icon={<Phone size={20} />} label="Phone" value={business.publicPhone} href={`tel:${business.publicPhone}`} />
                            <InfoItem icon={<Mail size={20} />} label="Email" value={business.publicEmail} href={`mailto:${business.publicEmail}`} />
                            <InfoItem icon={<MapPin size={20} />} label="Location" value={business.city && business.country ? `${business.city}, ${business.country}` : business.city || business.country} />
                            <div className="border-t dark:border-apple-gray-700 pt-6">
                                <h3 className="font-semibold mb-4 text-apple-gray-800 dark:text-white">Social Media</h3>
                                <div className="flex gap-4 text-apple-gray-500">
                                    <a href="#" className="hover:text-apple-blue"><Globe size={20} /></a>
                                    <a href="#" className="hover:text-apple-blue"><Facebook size={20} /></a>
                                    <a href="#" className="hover:text-apple-blue"><Twitter size={20} /></a>
                                </div>
                            </div>
                            <Button onClick={handleWhatsAppContact} className="w-full mt-4" variant="primary" disabled={!business.publicPhone}>Contact via WhatsApp</Button>
                        </div>
                    </aside>
                </div>
            </div>
        </div>
    );
};

export default BusinessDetailPage;