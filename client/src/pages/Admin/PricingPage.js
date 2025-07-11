// client/src/pages/Admin/PricingSettingsPage.js
import React, { useState, useEffect, useCallback } from 'react';
import { fetchAppSettings, updateAppSettingsApi, fetchPrices, upsertPricesApi } from '../../services/api';
import Card from '../../components/UI/Card';
import Input from '../../components/UI/Input';
import Button from '../../components/UI/Button';
import Spinner from '../../components/UI/Spinner';
import { Save, Tags, AlertTriangle, CheckCircle2, Plus, Trash2 } from 'lucide-react';

const PricingManager = () => {
    const [settings, setSettings] = useState({ itemTypes: [], serviceTypes: [], defaultCurrencySymbol: '$' });
    const [priceList, setPriceList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const [newItem, setNewItem] = useState('');
    const [newService, setNewService] = useState('');

    const currencySymbol = settings.defaultCurrencySymbol || '$';

    const loadData = useCallback(async () => {
        setLoading(true); setError('');
        try {
            const [settingsRes, pricesRes] = await Promise.all([fetchAppSettings(), fetchPrices()]);
            setSettings(settingsRes.data || { itemTypes: [], serviceTypes: [], defaultCurrencySymbol: '$' });
            setPriceList(pricesRes.data || []);
        } catch (err) {
            setError(err.response?.data?.message || "Failed to load pricing data. Please try again.");
            console.error("Pricing Page Load Error:", err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const handlePriceChange = (itemType, serviceType, price) => {
        const priceValue = parseFloat(price);
        const existingIndex = priceList.findIndex(p => p.itemType === itemType && p.serviceType === serviceType);
        let newList = [...priceList];
        if (existingIndex > -1) {
            newList[existingIndex].price = isNaN(priceValue) ? 0 : priceValue;
        } else {
            newList.push({ itemType, serviceType, price: isNaN(priceValue) ? 0 : priceValue });
        }
        setPriceList(newList);
    };

    const addItemType = () => {
        const trimmed = newItem.trim();
        if (trimmed && !settings.itemTypes.includes(trimmed)) {
            setSettings(prev => ({ ...prev, itemTypes: [...prev.itemTypes, trimmed] }));
        }
        setNewItem('');
    };
    const addServiceType = () => {
        const trimmed = newService.trim();
        if (trimmed && !settings.serviceTypes.includes(trimmed)) {
            setSettings(prev => ({ ...prev, serviceTypes: [...prev.serviceTypes, trimmed] }));
        }
        setNewService('');
    };
    const removeType = (typeToRemove, listName) => {
        setSettings(prev => ({ ...prev, [listName]: prev[listName].filter(item => item !== typeToRemove)}));
        if (listName === 'itemTypes') setPriceList(prev => prev.filter(p => p.itemType !== typeToRemove));
        else if (listName === 'serviceTypes') setPriceList(prev => prev.filter(p => p.serviceType !== typeToRemove));
    };

    const handleSaveChanges = async () => {
        setSaving(true); setError(''); setSuccess('');
        try {
            const { itemTypes, serviceTypes } = settings;
            // Send all three updates in parallel
            await Promise.all([
                updateAppSettingsApi({ itemTypes, serviceTypes }),
                upsertPricesApi({ priceList })
            ]);
            setSuccess("Services and pricing updated successfully!");
        } catch (err) {
            setError(err.response?.data?.message || "Failed to save settings.");
            console.error("Pricing Save Error:", err);
        } finally {
            setSaving(false);
            setTimeout(() => { setSuccess(''); setError('') }, 4000);
        }
    };

    if (loading) return <div className="p-8 text-center"><Spinner size="lg" /><p className="mt-2 text-sm">Loading pricing configuration...</p></div>;

    return (
        <div className="space-y-6">
            {error && <div className="p-3 my-4 text-sm bg-red-100 text-apple-red rounded-apple flex items-center"><AlertTriangle size={18} className="mr-2"/>{error}</div>}
            {success && <div className="p-3 my-4 text-sm bg-green-100 text-apple-green rounded-apple flex items-center"><CheckCircle2 size={18} className="mr-2"/>{success}</div>}

            <Card>
                <h4 className="font-semibold text-lg mb-2 text-apple-gray-800 dark:text-apple-gray-100">Manage Item Types</h4>
                <div className="flex space-x-2 mb-3"> <Input value={newItem} onChange={e => setNewItem(e.target.value)} placeholder="e.g., Jacket" className="mb-0 flex-grow" /> <Button type="button" onClick={addItemType} iconLeft={<Plus size={16} />}>Add Item</Button> </div>
                <div className="flex flex-wrap gap-2"> {settings.itemTypes.map(item => (<span key={item} className="flex items-center bg-apple-gray-200 dark:bg-apple-gray-700 text-sm rounded-full px-3 py-1"> {item} <button onClick={() => removeType(item, 'itemTypes')} className="ml-2 text-apple-gray-500 hover:text-apple-red" aria-label={`Remove ${item}`}><Trash2 size={14} /></button> </span>))} </div>
            </Card>

            <Card>
                <h4 className="font-semibold text-lg mb-2 text-apple-gray-800 dark:text-apple-gray-100">Manage Service Types</h4>
                <div className="flex space-x-2 mb-3"> <Input value={newService} onChange={e => setNewService(e.target.value)} placeholder="e.g., Alterations" className="mb-0 flex-grow" /> <Button type="button" onClick={addServiceType} iconLeft={<Plus size={16} />}>Add Service</Button> </div>
                <div className="flex flex-wrap gap-2"> {settings.serviceTypes.map(service => (<span key={service} className="flex items-center bg-apple-gray-200 dark:bg-apple-gray-700 text-sm rounded-full px-3 py-1"> {service} <button onClick={() => removeType(service, 'serviceTypes')} className="ml-2 text-apple-gray-500 hover:text-apple-red" aria-label={`Remove ${service}`}><Trash2 size={14} /></button> </span>))} </div>
            </Card>

            <Card>
                <h4 className="text-lg font-semibold mb-2 text-apple-gray-800 dark:text-apple-gray-100">Price Matrix</h4>
                <p className="text-sm text-apple-gray-500 mb-4">Set the price for each combination. Blank or 0 means the service is not offered for that item.</p>
                <div className="overflow-x-auto border rounded-md dark:border-apple-gray-700">
                    <table className="min-w-full text-sm">
                        <thead className="bg-apple-gray-100 dark:bg-apple-gray-800/50">
                            <tr>
                                <th className="p-2 text-left font-semibold text-apple-gray-700 dark:text-apple-gray-200">Item Type</th>
                                {settings.serviceTypes.map(s => <th key={s} className="p-2 text-center font-semibold text-apple-gray-700 dark:text-apple-gray-200">{s}</th>)}
                            </tr>
                        </thead>
                        <tbody>
                            {settings.itemTypes.map(item => (
                                <tr key={item} className="border-t dark:border-apple-gray-700">
                                    <td className="p-2 font-semibold bg-apple-gray-100 dark:bg-apple-gray-800/50">{item}</td>
                                    {settings.serviceTypes.map(service => (
                                        <td key={service} className="p-1 sm:p-2 text-center">
                                            <Input type="number" value={priceList.find(p => p.itemType === item && p.serviceType === service)?.price ?? ''} onChange={e => handlePriceChange(item, service, e.target.value)} placeholder="0.00" className="mb-0 w-24 mx-auto" prefix={currencySymbol} />
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Card>

            <div className="flex justify-end mt-6">
                <Button onClick={handleSaveChanges} isLoading={saving} iconLeft={<Save size={18} />} size="lg">Save All Pricing & Service Changes</Button>
            </div>
        </div>
    );
};

const PricingSettingsPage = () => {
    return (
        <div className="space-y-6">
            <div className="flex items-center space-x-3 mb-6">
                <Tags size={28} className="text-apple-blue" />
                <h1 className="text-2xl sm:text-3xl font-semibold text-apple-gray-800 dark:text-apple-gray-100">Services & Pricing</h1>
            </div>
            <PricingManager />
        </div>
    );
};

export default PricingSettingsPage;