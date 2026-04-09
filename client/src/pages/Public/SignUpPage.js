// client/src/pages/Public/SignUpPage.js
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import { initiateRegistrationApi } from '../../services/api';
import Card from '../../components/UI/Card';
import Button from '../../components/UI/Button';
import Input from '../../components/UI/Input';
import { ArrowLeft, ArrowRight, CheckCircle2, AlertTriangle, User, Building, KeyRound, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';
import PhoneInput from '../../components/UI/PhoneInput'; 
import { PublicHeader, PublicFooter } from './PublicLayout'; 

const countryCurrencyMap = {
    CM: 'FCFA', NG: 'NGN', GH: 'GHS', KE: 'KES', ZA: 'ZAR', US: 'USD', GB: 'GBP', FR: 'EUR',
};

// --- Step Components ---
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
                    showPassword ? <EyeOff size={18} onClick={() => setShowPassword(false)} className="cursor-pointer text-apple-gray-400" /> : <Eye size={18} onClick={() => setShowPassword(true)} className="cursor-pointer text-apple-gray-400" />
                } />
            <Input label={t('signup.step1.confirmPassword')} name="confirmPassword"  type={showConfirmPassword ? "text" : "password"} value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} suffixIcon={
                    showConfirmPassword ? <EyeOff size={18} onClick={() => setShowConfirmPassword(false)} className="cursor-pointer text-apple-gray-400" /> : <Eye size={18} onClick={() => setShowConfirmPassword(true)} className="cursor-pointer text-apple-gray-400" />
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
            <div className="flex justify-between pt-4"><Button variant="secondary" onClick={onPrev} iconLeft={<ArrowLeft size={16} />}>{t('signup.step2.backButton')}</Button><Button onClick={handleNext} iconRight={<ArrowRight size={16} />}>Review & Confirm</Button></div>
        </div>
    );
};

// 🌟 STEP 3 IS NOW THE FINAL CONFIRMATION STEP 🌟
const Step3Confirmation = ({ data, onPrev, onConfirm, isSubmitting }) => {
    const { t } = useTranslation();
    
    return (
        <div className="space-y-4 animate-fade-in">
            <div className="flex items-center space-x-3 mb-4"><div className="bg-apple-blue text-white rounded-full p-2"><CheckCircle2 size={20} /></div><h3 className="font-semibold text-xl">{t('signup.step4.title')}</h3></div>
            <p className="text-sm text-apple-gray-500">Please review your information. Click confirm to instantly create your account.</p>
            <div className="p-4 bg-apple-gray-100 dark:bg-apple-gray-800/50 rounded-md text-sm space-y-2">
                <p><strong>{t('signup.step4.adminUsername')}</strong> {data.adminUser.username}</p>
                <p><strong>{t('signup.step4.adminEmail')}</strong> {data.adminUser.email}</p>
                <p><strong>{t('signup.step4.businessName')}</strong> {data.companyInfo.name}</p>
                {/* Removed the Items/Services summary since user didn't input them */}
            </div>
            <div className="flex justify-between pt-4">
                <Button variant="secondary" onClick={onPrev} iconLeft={<ArrowLeft size={16} />} disabled={isSubmitting}>{t('signup.step4.backButton')}</Button>
                <Button onClick={onConfirm} isLoading={isSubmitting} iconLeft={<KeyRound size={16} />}>Create Account</Button>
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
        priceList: [], // Will be empty until they set it in the admin dashboard
        plan: planCapitalized, 
    });

    // We still populate default item/service names in the background so the backend doesn't crash
    useEffect(() => {
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
            setFormData(prev => ({ ...prev, [field]: value }));
        } else {
            setFormData(prev => ({
                ...prev,
                [section]: {
                    ...prev[section],
                    [field]: value
                }
            }));
        }
    };
    
    const handleSetDataForStep2 = (section, field, value) => {
        if (section === 'setTopLevel') {
            setFormData(prev => ({ ...prev, [field]: value }));
        } else {
            setFormData(prev => ({ ...prev, [section]: { ...prev[section], [field]: value } }));
        }
    };

    // ONLY 3 STEPS NOW
    const nextStep = () => setStep(prev => Math.min(prev + 1, 3)); 
    const prevStep = () => setStep(prev => Math.max(prev - 1, 1));

    const handleInitiateRegistration = async () => {
        setIsSubmitting(true);
        setError('');
        try {
            const { data } = await initiateRegistrationApi(formData);

            if (data.paymentRequired) {
                if (!data.paymentLink) {
                    throw new Error("Payment link was not returned by the server.");
                }
                window.location.href = data.paymentLink;
            } else {
                // If Trial, instant login bypasses everything
                login(data);
                toast.success('Account created successfully!');
                navigate('/app/dashboard');
            }
        } catch (err) {
            setError(err.response?.data?.message || t('signup.errors.registrationFailed'));
            setStep(1);
        } finally {
            setIsSubmitting(false);
        }
    };
    
    const renderStep = () => {
        switch (step) {
            case 1: return <Step1AdminAccount data={formData.adminUser} setData={updateFormData} onNext={nextStep} />;
            case 2: return <Step2CompanyInfo data={{...formData.companyInfo, currencySymbol: formData.currencySymbol}} setData={handleSetDataForStep2} onNext={nextStep} onPrev={prevStep} />;
            case 3: return <Step3Confirmation data={formData} onPrev={prevStep} onConfirm={handleInitiateRegistration} isSubmitting={isSubmitting} plan={planCapitalized} />;
            default: return <Step1AdminAccount data={formData.adminUser} setData={updateFormData} onNext={nextStep} />;
        }
    };

    return (
        <div className="bg-apple-gray-50 dark:bg-apple-gray-950 min-h-screen flex flex-col">

            <main className="flex-grow flex flex-col items-center justify-center p-4 py-12">
                <Card className="w-full max-w-3xl shadow-apple-lg border border-apple-gray-200 dark:border-apple-gray-800">
                    <div className="flex items-center p-4 border-b dark:border-apple-gray-700 bg-apple-gray-50/50 dark:bg-apple-gray-900/50">
                        <h2 className="text-xl font-bold text-center flex-grow dark:text-white">{t('signup.title')}</h2>
                        <span className="text-sm font-medium text-apple-gray-500 bg-white dark:bg-apple-gray-800 px-3 py-1 rounded-full shadow-sm border border-apple-gray-200 dark:border-apple-gray-700">
                            {/* Adjusted to say out of 3 */}
                            {step < 3 ? `Step ${step} of 3` : t('signup.finalStep')}
                        </span>
                    </div>
                    {error && <div className="p-3 m-4 text-sm bg-red-100 text-apple-red rounded-apple flex items-center"><AlertTriangle size={18} className="mr-2"/>{error}</div>}
                    <div className="p-6 md:p-8">{renderStep()}</div>
                </Card>
            </main>

            <PublicFooter />
        </div>
    );
};

export default SignUpPage;