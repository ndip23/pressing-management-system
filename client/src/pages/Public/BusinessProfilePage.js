import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getBusinessBySlugApi, getTenantPriceListApi, getBusinessGalleryApi } from '../../services/api'; 
import Spinner from '../../components/UI/Spinner';
import Button from '../../components/UI/Button';
import { Phone, Mail, MapPin, Globe, Facebook, Twitter, Image as ImageIcon } from 'lucide-react';
import { LazyLoadImage } from 'react-lazy-load-image-component';
import 'react-lazy-load-image-component/src/effects/blur.css';

const InfoItem = ({ icon, label, value, href }) => {
    if (!value || value.trim() === ',' || value.trim().toLowerCase() === 'not available') return null;
    const content = href ? (
        <a href={href} target="_blank" rel="noopener noreferrer" className="hover:text-apple-blue transition-colors break-all">{value}</a>
    ) : (<span className="break-all">{value}</span>);
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
    const [gallery, setGallery] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchBusinessData = async () => {
            setLoading(true);
            try {
                const { data: businessData } = await getBusinessBySlugApi(slug);
                if (!businessData) throw new Error('Business not found');
                setBusiness(businessData);

                if (businessData._id) {
                    const [priceRes, galleryRes] = await Promise.all([
                        getTenantPriceListApi(businessData._id),
                        getBusinessGalleryApi(businessData._id) 
                    ]);
                    setPriceList(priceRes.data || []);
                    setGallery(galleryRes.data || []);
                }
            } catch (error) {
                setError('The business data could not be loaded.');
            } finally {
                setLoading(false);
            }
        };
        fetchBusinessData();
    }, [slug]);

    const { itemTypes, serviceTypes, priceTable } = useMemo(() => {
        if (!priceList || priceList.length === 0) return { itemTypes: [], serviceTypes: [], priceTable: {} };
        const itemTypes = [...new Set(priceList.map(p => p.itemType))].sort();
        const serviceTypes = [...new Set(priceList.map(p => p.serviceType))].sort();
        const table = {};
        itemTypes.forEach(item => table[item] = {});
        priceList.forEach(p => { if (p.itemType) table[p.itemType][p.serviceType] = p.price; });
        return { itemTypes, serviceTypes, priceTable: table };
    }, [priceList]);

    const handleWhatsAppContact = () => {
        if (!business?.publicPhone) return;
        const phoneNumber = business.publicPhone.replace(/\s/g, '').replace('+', '');
        window.open(`https://wa.me/${phoneNumber}?text=${encodeURIComponent(`Hello ${business.name}, I found you on PressMark...`)}`, '_blank');
    };

    if (loading) return <div className="min-h-[60vh] flex justify-center items-center"><Spinner size="lg" /></div>;

    if (error || !business) {
        return (
            <div className="min-h-[60vh] flex flex-col justify-center items-center text-center p-4">
                <p className="text-xl text-apple-red">{error || 'Business data could not be loaded.'}</p>
                <Link to="/directory" className="mt-4"><Button>Back to Directory</Button></Link>
            </div>
        );
    }

    const bannerUrl = business?.bannerUrl || business?.logoUrl || 'https://images.unsplash.com/photo-1626802393339-b4f728b26b6a?q=80&w=1080';

    return (
        <div className="bg-apple-gray-50 dark:bg-apple-gray-950 min-h-screen">
            <div className="container mx-auto px-4 py-12 md:py-16">
                <div className="grid lg:grid-cols-3 gap-8 lg:gap-12">
                    <div className="lg:col-span-2 space-y-8">
                        <div className="h-64 rounded-xl bg-cover bg-center shadow-lg" style={{ backgroundImage: `url(${bannerUrl})` }} />
                        
                        <div className="bg-white dark:bg-apple-gray-900 p-6 rounded-xl shadow-sm">
                            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2"><ImageIcon /> Gallery</h2>
                            {gallery.length > 0 ? (
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                    {gallery.map((img, index) => (
                                        <LazyLoadImage key={img._id || index} src={img.imageUrl} effect="blur" className="rounded-lg w-full h-48 object-cover" alt={`Gallery item ${index}`} />
                                    ))}
                                </div>
                            ) : <p className="text-apple-gray-500">No photos available.</p>}
                        </div>

                        <div className="bg-white dark:bg-apple-gray-900 p-6 rounded-xl shadow-sm">
                            <h2 className="text-2xl font-bold mb-4">Price List</h2>
                            {priceList.length > 0 ? (
                                <div className="overflow-x-auto">
                                    <table className="min-w-full text-left text-sm">
                                        <thead><tr><th className="p-3">Item</th>{serviceTypes.map(s => <th key={s} className="p-3 text-center">{s}</th>)}</tr></thead>
                                        <tbody>{itemTypes.map(item => (
                                            <tr key={item} className="border-t">
                                                <td className="p-3 font-medium">{item}</td>
                                                {serviceTypes.map(service => (
                                                    <td key={service} className="p-3 text-center">
                                                        {priceTable[item]?.[service] ? `${priceTable[item][service].toLocaleString()} FCFA` : '-'}
                                                    </td>
                                                ))}
                                            </tr>
                                        ))}</tbody>
                                    </table>
                                </div>
                            ) : <p>Price list not available.</p>}
                        </div>
                    </div>
                    
                    <aside className="lg:col-span-1">
                        <div className="bg-white dark:bg-apple-gray-900 p-6 rounded-xl shadow-sm space-y-6 sticky top-24">
                            <div className="text-center">
                                <div className="w-24 h-24 rounded-full mx-auto bg-gray-200 overflow-hidden mb-4 flex items-center justify-center">
                                    {business.logoUrl ? <img src={business.logoUrl} alt="Logo" className="w-full h-full object-cover" /> : <span className="text-3xl">{business.name[0]}</span>}
                                </div>
                                <h1 className="text-2xl font-bold">{business.name}</h1>
                            </div>
                            <InfoItem icon={<Phone size={20} />} label="Phone" value={business.publicPhone} href={`tel:${business.publicPhone}`} />
                            <InfoItem icon={<Mail size={20} />} label="Email" value={business.publicEmail} href={`mailto:${business.publicEmail}`} />
                            <InfoItem icon={<MapPin size={20} />} label="Location" value={business.city && business.country ? `${business.city}, ${business.country}` : business.city || business.country} />
                            
                            {/* ✅ USE ALL ICONS */}
                            <div className="border-t dark:border-apple-gray-700 pt-6">
                                <h3 className="font-semibold mb-4 text-apple-gray-800 dark:text-white">Connect</h3>
                                <div className="flex gap-4 text-apple-gray-500">
                                    <a href={business.website} target="_blank" rel="noreferrer" className="hover:text-apple-blue"><Globe size={20} /></a>
                                    <a href={business.facebook} target="_blank" rel="noreferrer" className="hover:text-apple-blue"><Facebook size={20} /></a>
                                    <a href={business.twitter} target="_blank" rel="noreferrer" className="hover:text-apple-blue"><Twitter size={20} /></a>
                                </div>
                            </div>
                            <Button onClick={handleWhatsAppContact} className="w-full mt-4" variant="primary">Contact via WhatsApp</Button>
                        </div>
                    </aside>
                </div>
            </div>
        </div>
    );
};
export default BusinessDetailPage;