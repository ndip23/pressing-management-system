// client/src/pages/Public/SignUpPage.js
import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import { initiateRegistrationApi, finalizeRegistrationApi } from '../../services/api';
import Card from '../../components/UI/Card';
import Button from '../../components/UI/Button';
import Input from '../../components/UI/Input';
import { ArrowLeft, ArrowRight, CheckCircle2, AlertTriangle, User, Building, Wrench, KeyRound, Eye, EyeOff, Plus, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import PhoneInput from '../../components/UI/PhoneInput'; 
const countryCurrencyMap = {
    CM: 'FCFA', // Cameroon
    NG: 'NGN',  // Nigeria
    GH: 'GHS',  // Ghana
    KE: 'KES',  // Kenya
    ZA: 'ZAR',  // South Africa
    US: 'USD',  // United States
    GB: 'GBP',  // United Kingdom
    FR: 'EUR',  // France (Euro)
    // Add any other countries and currencies you want to support
};

// --- Step Components (can be moved to separate files) ---
const Step1AdminAccount = ({ data, setData, onNext }) => {
    const { t } = useTranslation();
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [showPassword, setShowPassword] = useState(false); 
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const handleNext = () => {
        setError('');
        if (!data.username || !password) { setError(t('signup.step1.errors.usernameRequired')); return; }
        if (!data.email || !/^\S+@\S+\.\S+$/.test(data.email)) { setError(t('signup.step1.errors.emailInvalid')); return; }
        if (password.length < 6) { setError(t('signup.step1.errors.passwordLength')); return; }
        if (password !== confirmPassword) { setError(t('signup.step1.errors.passwordMismatch')); return; }
        setData('adminUser', 'password', password);
        onNext();
    };
    return (
        <div className="space-y-4 animate-fade-in">
            <div className="flex items-center space-x-3 mb-4"><div className="bg-apple-blue text-white rounded-full p-2"><User size={20} /></div><h3 className="font-semibold text-xl dark:text-white">{t('signup.step1.title')}</h3></div>
            <p className="text-sm text-apple-gray-500">{t('signup.step1.subtitle')}</p>
            {error && <p className="text-sm text-red-500 p-2 bg-red-100 dark:bg-red-900/30 rounded-md">{error}</p>}
            <Input label={t('signup.step1.username')} name="username" value={data.username} onChange={e => setData('adminUser', 'username', e.target.value)}  />
            <Input label={t('signup.step1.email')} name="email" type="email" value={data.email} onChange={e => setData('adminUser', 'email', e.target.value)} />
            <Input label={t('signup.step1.password')} name="password" type={showPassword ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)} suffixIcon={
                    showPassword ? (
                        <EyeOff size={18} onClick={() => setShowPassword(false)} className="cursor-pointer text-apple-gray-400 hover:text-apple-gray-600" />
                    ) : (
                        <Eye size={18} onClick={() => setShowPassword(true)} className="cursor-pointer text-apple-gray-400 hover:text-apple-gray-600" />
                    )
                } />
            <Input label={t('signup.step1.confirmPassword')} name="confirmPassword"  type={showConfirmPassword ? "text" : "password"} value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} suffixIcon={
                    showConfirmPassword ? (
                        <EyeOff size={18} onClick={() => setShowConfirmPassword(false)} className="cursor-pointer text-apple-gray-400 hover:text-apple-gray-600" />
                    ) : (
                        <Eye size={18} onClick={() => setShowConfirmPassword(true)} className="cursor-pointer text-apple-gray-400 hover:text-apple-gray-600" />
                    )
                } />
            <div className="flex justify-end pt-4"><Button onClick={handleNext} iconRight={<ArrowRight size={16} />}>{t('signup.step1.nextButton')}</Button></div>
        </div>
    );
};
const Step2CompanyInfo = ({ data, setData, onNext, onPrev }) => {
    const { t } = useTranslation();
    const [error, setError] = useState('');
    const handleNext = () => {
        setError('');
        if (!data.name) { setError(t('signup.step2.errors.nameRequired')); return; }
        if (!data.currencySymbol) { setError(t('signup.step2.errors.currencyRequired')); return; }
        onNext();
    };
     const handleCountryChange = (countryCode) => {
     
        const newCurrency = countryCurrencyMap[countryCode] || '$';
       
        setData('setTopLevel', 'currencySymbol', newCurrency);

        setData('companyInfo', 'countryCode', countryCode); 
    };
    return (
        <div className="space-y-4 animate-fade-in">
            <div className="flex items-center space-x-3 mb-4"><div className="bg-apple-blue text-white rounded-full p-2"><Building size={20} /></div><h3 className="font-semibold text-xl dark:text-white">{t('signup.step2.title')}</h3></div>
            {error && <p className="text-sm text-red-500 p-2 bg-red-100 dark:bg-red-900/30 rounded-md">{error}</p>}
            <Input label={t('signup.step2.businessName')} name="name" value={data.name} onChange={e => setData('companyInfo', 'name', e.target.value)} />
            <Input label={t('signup.step2.businessAddress')} name="address" value={data.address} onChange={e => setData('companyInfo', 'address', e.target.value)} />
            <PhoneInput label={t('signup.step2.businessPhone')} value={data.phone} onChange={(value) => setData('companyInfo', 'phone', value)} onCountryChange={handleCountryChange}/>
            <Input label={t('signup.step2.currencySymbol')} name="currencySymbol" value={data.currencySymbol} onChange={e => setData('setTopLevel', 'currencySymbol', e.target.value)} />
            <div className="flex justify-between pt-4"><Button variant="secondary" onClick={onPrev} iconLeft={<ArrowLeft size={16} />}>{t('signup.step2.backButton')}</Button><Button onClick={handleNext} iconRight={<ArrowRight size={16} />}>{t('signup.step2.nextButton')}</Button></div>
        </div>
    );
};

const Step3SetupServices = ({ formData, setFormData, onNext, onPrev }) => {
    const { t } = useTranslation();
    const [newItem, setNewItem] = useState('');
    const [newService, setNewService] = useState('');
    const [error, setError] = useState('');

    const currencySymbol = formData.currencySymbol || '$';

    // --- Handlers for Item and Service Types ---
    const addItemType = (e) => {
        e.preventDefault(); // Prevent form submission if inside a form tag
        const trimmed = newItem.trim();
        if (trimmed && !formData.itemTypes.find(i => i.toLowerCase() === trimmed.toLowerCase())) {
            setFormData(prev => ({ ...prev, itemTypes: [...prev.itemTypes, trimmed] }));
            setError('');
        }
        setNewItem('');
    };

    const addServiceType = (e) => {
        e.preventDefault();
        const trimmed = newService.trim();
        if (trimmed && !formData.serviceTypes.find(s => s.toLowerCase() === trimmed.toLowerCase())) {
            setFormData(prev => ({ ...prev, serviceTypes: [...prev.serviceTypes, trimmed] }));
            setError('');
        }
        setNewService('');
    };

    const removeItemType = (itemToRemove) => {
        setFormData(prev => ({
            ...prev,
            itemTypes: prev.itemTypes.filter(item => item !== itemToRemove),
            // Also remove any prices associated with this item type
            priceList: prev.priceList.filter(p => p.itemType !== itemToRemove),
        }));
    };

    const removeServiceType = (serviceToRemove) => {
        setFormData(prev => ({
            ...prev,
            serviceTypes: prev.serviceTypes.filter(service => service !== serviceToRemove),
            // Also remove any prices associated with this service type
            priceList: prev.priceList.filter(p => p.serviceType !== serviceToRemove),
        }));
    };

    // --- Handlers for Price Matrix ---
    const handlePriceChange = (itemType, serviceType, price) => {
        const priceValue = parseFloat(price);
        const existingIndex = formData.priceList.findIndex(p => p.itemType === itemType && p.serviceType === serviceType);
        let newList = [...formData.priceList];

        if (existingIndex > -1) {
            if (isNaN(priceValue) || priceValue <= 0) {
                // If price is cleared, remove the entry
                newList.splice(existingIndex, 1);
            } else {
                newList[existingIndex].price = priceValue;
            }
        } else if (!isNaN(priceValue) && priceValue > 0) {
            // If new price is entered, add it
            newList.push({ itemType, serviceType, price: priceValue });
        }
        setFormData(prev => ({ ...prev, priceList: newList }));
    };

    const getPrice = (itemType, serviceType) => {
        return formData.priceList.find(p => p.itemType === itemType && p.serviceType === serviceType)?.price ?? '';
    };

    // --- Validation and Navigation ---
    const handleNext = () => {
        setError('');
        if (formData.itemTypes.length === 0) {
            setError(t('signup.step3.errors.itemTypesRequired'));
            return;
        }
        if (formData.serviceTypes.length === 0) {
            setError(t('signup.step3.errors.serviceTypesRequired'));
            return;
        }
        const hasAtLeastOnePrice = formData.priceList.some(p => p.price > 0);
        if (!hasAtLeastOnePrice) {
            if (!window.confirm(t('signup.step3.errors.noPricesConfirm'))) {
                return;
            }
        }
        onNext(); // Call the prop function to move to the next step
    };

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex items-center space-x-3 mb-4">
                <div className="bg-apple-blue text-white rounded-full p-2"><Wrench size={20} /></div>
                <h3 className="font-semibold text-xl text-apple-gray-800 dark:text-white">{t('signup.step3.title')}</h3>
            </div>
            <p className="text-sm text-apple-gray-500 dark:text-apple-gray-400">{t('signup.step3.subtitle')}</p>
            {error && <p className="text-sm text-red-500 p-2 bg-red-100 dark:bg-red-900/30 rounded-md">{error}</p>}

            {/* --- Manage Item Types UI --- */}
            <div className="space-y-3 p-4 border rounded-apple-md dark:border-apple-gray-700">
                <h4 className="font-medium text-apple-gray-800 dark:text-apple-gray-100">{t('signup.step3.itemTypes.title')}</h4>
                <form onSubmit={addItemType} className="flex space-x-2">
                    <Input value={newItem} onChange={e => setNewItem(e.target.value)} placeholder={t('signup.step3.itemTypes.placeholder')} className="mb-0 flex-grow" />
                    <Button type="submit" iconLeft={<Plus size={16} />}>{t('signup.step3.itemTypes.addButton')}</Button>
                </form>
                <div className="flex flex-wrap gap-2 pt-2">
                    {formData.itemTypes.map(item => (
                        <span key={item} className="flex items-center bg-apple-gray-200 dark:bg-apple-gray-700 text-sm rounded-full px-3 py-1">
                            {item}
                            <button type="button" onClick={() => removeItemType(item)} className="ml-2 text-apple-gray-500 hover:text-apple-red" aria-label={`Remove ${item}`}>
                                <Trash2 size={14} />
                            </button>
                        </span>
                    ))}
                </div>
            </div>

            {/* --- Manage Service Types UI --- */}
            <div className="space-y-3 p-4 border rounded-apple-md dark:border-apple-gray-700">
                <h4 className="font-medium text-apple-gray-800 dark:text-apple-gray-100">{t('signup.step3.serviceTypes.title')}</h4>
                <form onSubmit={addServiceType} className="flex space-x-2">
                    <Input value={newService} onChange={e => setNewService(e.target.value)} placeholder={t('signup.step3.serviceTypes.placeholder')} className="mb-0 flex-grow" />
                    <Button type="button" onClick={addServiceType} iconLeft={<Plus size={16} />}>{t('signup.step3.serviceTypes.addButton')}</Button>
                </form>
                <div className="flex flex-wrap gap-2 pt-2">
                    {formData.serviceTypes.map(service => (
                        <span key={service} className="flex items-center bg-apple-gray-200 dark:bg-apple-gray-700 text-sm rounded-full px-3 py-1">
                            {service}
                            <button type="button" onClick={() => removeServiceType(service)} className="ml-2 text-apple-gray-500 hover:text-apple-red" aria-label={`Remove ${service}`}>
                                <Trash2 size={14} />
                            </button>
                        </span>
                    ))}
                </div>
            </div>
            
            {/* --- Pricing Grid --- */}
            {formData.itemTypes.length > 0 && formData.serviceTypes.length > 0 && (
                <div className="overflow-x-auto p-1 border rounded-md dark:border-apple-gray-700">
                    <table className="min-w-full text-sm">
                        <thead className="bg-apple-gray-100 dark:bg-apple-gray-800/50">
                            <tr>
                                <th className="p-2 text-left font-semibold text-apple-gray-700 dark:text-apple-gray-200">{t('signup.step3.pricingGrid.header')}</th>
                                {formData.serviceTypes.map(s => <th key={s} className="p-2 text-center font-semibold text-apple-gray-700 dark:text-apple-gray-200">{s}</th>)}
                            </tr>
                        </thead>
                        <tbody>
                            {formData.itemTypes.map(item => (
                                <tr key={item} className="border-t dark:border-apple-gray-700">
                                    <td className="p-2 font-medium bg-apple-gray-50 dark:bg-apple-gray-800/40">{item}</td>
                                    {formData.serviceTypes.map(service => (
                                        <td key={`${item}-${service}`} className="p-1 sm:p-2 text-center">
                                            <Input
                                                type="number"
                                                value={getPrice(item, service)}
                                                onChange={e => handlePriceChange(item, service, e.target.value)}
                                                placeholder="0.00"
                                                className="mb-0 w-24 mx-auto"
                                                prefix={currencySymbol} // Add prefix to your Input component if it supports it
                                            />
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            <div className="flex justify-between pt-4">
                <Button variant="secondary" onClick={onPrev} iconLeft={<ArrowLeft size={16} />}>{t('signup.step3.backButton')}</Button>
                <Button onClick={handleNext} iconRight={<ArrowRight size={16} />}>{t('signup.step3.nextButton')}</Button>
            </div>
        </div>
    );
};

const Step4Confirmation = ({ data, onPrev, onConfirm, isSubmitting }) => {
    const { t } = useTranslation();
    
    return (
        <div className="space-y-4 animate-fade-in">
            <div className="flex items-center space-x-3 mb-4"><div className="bg-apple-blue text-white rounded-full p-2"><CheckCircle2 size={20} /></div><h3 className="font-semibold text-xl">{t('signup.step4.title')}</h3></div>
            <p className="text-sm text-apple-gray-500">{t('signup.step4.subtitle')}</p>
            <div className="p-4 bg-apple-gray-100 dark:bg-apple-gray-800/50 rounded-md text-sm space-y-2">
                <p><strong>{t('signup.step4.adminUsername')}</strong> {data.adminUser.username}</p><p><strong>{t('signup.step4.adminEmail')}</strong> {data.adminUser.email}</p>
                <p><strong>{t('signup.step4.businessName')}</strong> {data.companyInfo.name}</p>
                <p><strong>{t('signup.step4.itemsServices')}</strong> {t('signup.step4.itemsServicesCount', { items: data.itemTypes.length, services: data.serviceTypes.length, prices: data.priceList.length })}</p>
            </div>
            <div className="flex justify-between pt-4">
                <Button variant="secondary" onClick={onPrev} iconLeft={<ArrowLeft size={16} />} disabled={isSubmitting}>{t('signup.step4.backButton')}</Button>
                <Button onClick={onConfirm} isLoading={isSubmitting} iconLeft={<KeyRound size={16} />}>{t('signup.step4.confirmButton')}</Button>
            </div>
        </div>
    );
};

const Step5OtpVerification = ({ data, onPrev, onFinalize, isSubmitting }) => {
    const { t } = useTranslation();
    const [otp, setOtp] = useState('');
    return (
        <div className="space-y-4 animate-fade-in">
            <h3 className="font-semibold text-xl">{t('signup.step5.title')}</h3>
            <p className="text-sm text-apple-gray-500">{t('signup.step5.subtitle', { email: data.adminUser.email })}</p>
            <Input label={t('signup.step5.verificationCode')} id="otp" value={otp} onChange={e => setOtp(e.target.value)} maxLength={6} placeholder="123456" />
            <div className="flex justify-between pt-4">
                <Button variant="secondary" onClick={onPrev} disabled={isSubmitting}>{t('signup.step5.backButton')}</Button>
                <Button onClick={() => onFinalize(otp)} isLoading={isSubmitting}>
                    {data.plan.toLowerCase() === 'trial' ? t('signup.step5.verifyTrial', 'Verify & Create Account') : t('signup.step5.verifyPaid', 'Verify & Proceed to Pay')}
                </Button>
            </div>
        </div>
    );
};


// --- Main SignUpPage Component ---
const SignUpPage = () => {
    const { t } = useTranslation();
    const { login } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const [step, setStep] = useState(1);
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const planNameFromUrl = new URLSearchParams(location.search).get('plan');
    const planCapitalized = planNameFromUrl 
        ? planNameFromUrl.charAt(0).toUpperCase() + planNameFromUrl.slice(1) 
        : 'Trial'; 

    const [formData, setFormData] = useState({
        adminUser: { username: '', password: '', email: '' },
        companyInfo: { name: '', address: '', phone: '' },
        currencySymbol: 'FCFA',
        itemTypes: [],
        serviceTypes: [],
        priceList: [],
        plan: planCapitalized, // This ensures "Trial" is sent by default
    });

    useEffect(() => {
        // This useEffect is fine.
        if (formData.itemTypes.length === 0 && formData.serviceTypes.length === 0) {
            setFormData(prev => ({
                ...prev,
                itemTypes: [t('signup.defaultItems.shirt'), t('signup.defaultItems.trousers'), t('signup.defaultItems.suit'), t('signup.defaultItems.dress')],
                serviceTypes: [t('signup.defaultServices.wash'), t('signup.defaultServices.ironOnly'), t('signup.defaultServices.dryClean')]
            }));
        }
    }, [t, formData.itemTypes.length, formData.serviceTypes.length]);
    const updateFormData = (section, field, value) => {
        if (section === 'topLevel') {
            // For top-level properties like 'currencySymbol'
            setFormData(prev => ({ ...prev, [field]: value }));
        } else {
            // For nested properties like 'adminUser.username'
            setFormData(prev => ({
                ...prev,
                [section]: {
                    ...prev[section],
                    [field]: value
                }
            }));
        }
    };
    // A simpler way to update the main component's state from the child
    const handleSetDataForStep2 = (section, field, value) => {
        if (section === 'setTopLevel') {
            setFormData(prev => ({ ...prev, [field]: value }));
        } else {
            setFormData(prev => ({ ...prev, [section]: { ...prev[section], [field]: value } }));
        }
    };
    const nextStep = () => setStep(prev => Math.min(prev + 1, 5));
    const prevStep = () => setStep(prev => Math.max(prev - 1, 1));
// Paste this entire block inside your SignUpPage component, replacing the old handler functions.

 const handleInitiateRegistration = async () => {
        setIsSubmitting(true);
        setError('');
        try {
            // It makes ONE API call. The backend's logic will decide what to do.
            const { data } = await initiateRegistrationApi(formData);

            if (data.paymentRequired) {
                // The backend says payment is needed and has sent us the link.
                if (!data.paymentLink) {
                    throw new Error("Payment link was not returned by the server.");
                }
                window.location.href = data.paymentLink;
            } else {
                // The backend says it's a Trial, so we move to the OTP step.
                setStep(5);
            }
        } catch (err) {
            setError(err.response?.data?.message || t('signup.errors.registrationFailed'));
            setStep(1);
        } finally {
            setIsSubmitting(false);
        }
    };
    
    // This function is ONLY for Trial signups. It is called from Step 5.
    const handleFinalizeRegistration = async (otp) => {
        if (!otp || otp.length !== 6) { setError(t('signup.errors.otpInvalid')); return; }
        setIsSubmitting(true);
        setError('');
        try {
            const { data } = await finalizeRegistrationApi({ email: formData.adminUser.email, otp });
            login(data);
            toast.success('Account created successfully!');
            navigate('/app/dashboard');
        } catch (err) {
            setError(err.response?.data?.message || t('signup.errors.verificationFailed'));
        } finally {
            setIsSubmitting(false);
        }
    };
    
    const renderStep = () => {
        switch (step) {
            case 1: return <Step1AdminAccount data={formData.adminUser} setData={updateFormData} onNext={nextStep} />;
            case 2: return <Step2CompanyInfo data={{...formData.companyInfo, currencySymbol: formData.currencySymbol}} setData={handleSetDataForStep2} onNext={nextStep} onPrev={prevStep} />;
            case 3: return <Step3SetupServices formData={formData} setFormData={setFormData} onNext={nextStep} onPrev={prevStep} />;
            // Pass the correct handler to the confirmation step
            case 4: return <Step4Confirmation data={formData} onPrev={prevStep} onConfirm={handleInitiateRegistration} isSubmitting={isSubmitting} plan={planCapitalized} />;
            // Pass the correct handler to the OTP step
            case 5: return <Step5OtpVerification data={formData} onPrev={() => setStep(4)} onFinalize={handleFinalizeRegistration} isSubmitting={isSubmitting} />;
            default: return <Step1AdminAccount data={formData.adminUser} setData={updateFormData} onNext={nextStep} />;
        }
    };
    return (
        <div className="min-h-screen bg-apple-gray-100 dark:bg-apple-gray-950 flex flex-col items-center justify-center p-4">
            {/* Back to Home Button */}
            <div className="absolute top-6 left-6">
                <Link 
                    to="/directory" 
                    className="flex items-center space-x-2 text-apple-gray-600 dark:text-apple-gray-400 hover:text-apple-blue dark:hover:text-apple-blue transition-colors"
                >
                    <ArrowLeft size={20} />
                                    </Link>
            </div>

             <Link to="/directory" className="flex items-center space-x-2 mb-8"><svg className="h-10 w-10 text-apple-blue" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
                <span className="text-3xl font-bold text-apple-gray-800 dark:text-apple-gray-100">PressMark</span></Link>
            <Card className="w-full max-w-3xl shadow-apple-lg">
                <div className="flex items-center p-4 border-b dark:border-apple-gray-700">
                    <h2 className="text-xl font-bold text-center flex-grow dark:text-white">{t('signup.title')}</h2>
                    <span className="text-sm font-medium text-apple-gray-500">{step < 5 ? t('signup.stepProgress', { current: step, total: 4 }) : t('signup.finalStep')}</span>
                </div>
                {error && <div className="p-3 m-4 text-sm bg-red-100 text-apple-red rounded-apple flex items-center"><AlertTriangle size={18} className="mr-2"/>{error}</div>}
                <div className="p-6">{renderStep()}</div>
            </Card>
        </div>
    );
};
export default SignUpPage;
