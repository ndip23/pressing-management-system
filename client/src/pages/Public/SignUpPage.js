// client/src/pages/Public/SignUpPage.js
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { initiateRegistrationApi, finalizeRegistrationApi } from '../../services/api';
import Card from '../../components/UI/Card';
import Button from '../../components/UI/Button';
import Input from '../../components/UI/Input';
import { ArrowLeft, ArrowRight, PartyPopper, AlertTriangle,Plus, Trash2, User, Building, Wrench, CheckCircle2, KeyRound, Eye, EyeOff } from 'lucide-react';

// --- Step Components (can be moved to separate files) ---
const Step1AdminAccount = ({ data, setData, onNext }) => {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [showPassword, setShowPassword] = useState(false); 
    const togglePasswordVisibility = () => {
            setShowPassword(!showPassword);
        };
    
        const passwordIcon = (
            showPassword ? (
                <EyeOff size={18} onClick={togglePasswordVisibility} className="cursor-pointer text-apple-gray-400 hover:text-apple-gray-600 dark:hover:text-apple-gray-200" />
            ) : (
                <Eye size={18} onClick={togglePasswordVisibility} className="cursor-pointer text-apple-gray-400 hover:text-apple-gray-600 dark:hover:text-apple-gray-200" />
            )
        );

    const handleNext = () => {
        setError('');
        if (!data.username || !password) { setError('Username and password are required.'); return; }
        if (!data.email || !/^\S+@\S+\.\S+$/.test(data.email)) { setError('A valid email is required for verification.'); return; }
        if (password.length < 6) { setError('Password must be at least 6 characters.'); return; }
        if (password !== confirmPassword) { setError('Passwords do not match.'); return; }
        setData('adminUser', 'password', password);
        onNext();
    };
    return (
        <div className="space-y-4 animate-fade-in">
            <div className="flex items-center space-x-3 mb-4"><div className="bg-apple-blue text-white rounded-full p-2"><User size={20} /></div><h3 className="font-semibold text-xl">Create Your Admin Account</h3></div>
            <p className="text-sm text-apple-gray-500">This will be your personal login for managing the business.</p>
            {error && <p className="text-sm text-red-500 p-2 bg-red-100 dark:bg-red-900/30 rounded-md">{error}</p>}
            <Input label="Username*" name="username" value={data.username} onChange={e => setData('adminUser', 'username', e.target.value)}  />
            <Input label="Email (for verification)*" name="email" type="email" value={data.email} onChange={e => setData('adminUser', 'email', e.target.value)} />
            <Input label="Password*" name="password" type="password" value={password} onChange={e => setPassword(e.target.value)} suffixIcon={passwordIcon} />
            <Input label="Confirm Password*" name="confirmPassword" type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} suffixIcon={passwordIcon} />
            <div className="flex justify-end pt-4"><Button onClick={handleNext} iconRight={<ArrowRight size={16} />}>Next: Company Info</Button></div>
        </div>
    );
};
const Step2CompanyInfo = ({ data, setData, onNext, onPrev }) => {
    const [error, setError] = useState('');
    const handleNext = () => {
        setError('');
        if (!data.name) { setError('Business name is required.'); return; }
        if (!data.currencySymbol) { setError('Currency symbol is required.'); return; }
        onNext();
    };
    return (
        <div className="space-y-4 animate-fade-in">
            <div className="flex items-center space-x-3 mb-4"><div className="bg-apple-blue text-white rounded-full p-2"><Building size={20} /></div><h3 className="font-semibold text-xl">Tell Us About Your Business</h3></div>
            {error && <p className="text-sm text-red-500 p-2 bg-red-100 dark:bg-red-900/30 rounded-md">{error}</p>}
            <Input label="Business Name*" name="name" value={data.name} onChange={e => setData('companyInfo', 'name', e.target.value)} />
            <Input label="Business Address" name="address" value={data.address} onChange={e => setData('companyInfo', 'address', e.target.value)} />
            <Input label="Business Phone" name="phone" value={data.phone} onChange={e => setData('companyInfo', 'phone', e.target.value)} />
            <Input label="Currency Symbol*" name="currencySymbol" value={data.currencySymbol} onChange={e => setData('currencySymbol', e.target.value)} />
            <div className="flex justify-between pt-4"><Button variant="secondary" onClick={onPrev} iconLeft={<ArrowLeft size={16} />}>Back</Button><Button onClick={handleNext} iconRight={<ArrowRight size={16} />}>Next: Setup Services</Button></div>
        </div>
    );
};

const Step3SetupServices = ({ formData, setFormData, onNext, onPrev }) => {
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
            setError("Please add at least one Item Type (e.g., Shirt).");
            return;
        }
        if (formData.serviceTypes.length === 0) {
            setError("Please add at least one Service Type (e.g., Wash).");
            return;
        }
        const hasAtLeastOnePrice = formData.priceList.some(p => p.price > 0);
        if (!hasAtLeastOnePrice) {
            if (!window.confirm("You haven't set any prices. The system will use 0 for all services. Are you sure you want to continue?")) {
                return;
            }
        }
        onNext(); // Call the prop function to move to the next step
    };

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex items-center space-x-3 mb-4">
                <div className="bg-apple-blue text-white rounded-full p-2"><Wrench size={20} /></div>
                <h3 className="font-semibold text-xl text-apple-gray-800 dark:text-white">Setup Your Services & Pricing</h3>
            </div>
            <p className="text-sm text-apple-gray-500 dark:text-apple-gray-400">Define what you clean and how much it costs. You can change this later in settings.</p>
            {error && <p className="text-sm text-red-500 p-2 bg-red-100 dark:bg-red-900/30 rounded-md">{error}</p>}

            {/* --- Manage Item Types UI --- */}
            <div className="space-y-3 p-4 border rounded-apple-md dark:border-apple-gray-700">
                <h4 className="font-medium text-apple-gray-800 dark:text-apple-gray-100">Item Types</h4>
                <form onSubmit={addItemType} className="flex space-x-2">
                    <Input value={newItem} onChange={e => setNewItem(e.target.value)} placeholder="e.g., Jacket, Bedding" className="mb-0 flex-grow" />
                    <Button type="submit" iconLeft={<Plus size={16} />}>Add</Button>
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
                <h4 className="font-medium text-apple-gray-800 dark:text-apple-gray-100">Service Types</h4>
                <form onSubmit={addServiceType} className="flex space-x-2">
                    <Input value={newService} onChange={e => setNewService(e.target.value)} placeholder="e.g., Alterations" className="mb-0 flex-grow" />
                    <Button type="button" onClick={addServiceType} iconLeft={<Plus size={16} />}>Add</Button>
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
                                <th className="p-2 text-left font-semibold text-apple-gray-700 dark:text-apple-gray-200">Item / Service</th>
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
                <Button variant="secondary" onClick={onPrev} iconLeft={<ArrowLeft size={16} />}>Back</Button>
                <Button onClick={handleNext} iconRight={<ArrowRight size={16} />}>Next: Review & Finish</Button>
            </div>
        </div>
    );
};

const Step4Confirmation = ({ data, onPrev, onConfirm, isSubmitting }) => (
    <div className="space-y-4 animate-fade-in">
        <div className="flex items-center space-x-3 mb-4"><div className="bg-apple-blue text-white rounded-full p-2"><CheckCircle2 size={20} /></div><h3 className="font-semibold text-xl">Review & Confirm</h3></div>
        <p className="text-sm text-apple-gray-500">Please confirm all details. After confirming, a verification code will be sent to your email to finalize your account.</p>
        <div className="p-4 bg-apple-gray-100 dark:bg-apple-gray-800/50 rounded-md text-sm space-y-2">
            <p><strong>Admin Username:</strong> {data.adminUser.username}</p><p><strong>Admin Email:</strong> {data.adminUser.email}</p>
            <p><strong>Business Name:</strong> {data.companyInfo.name}</p>
            <p><strong>Items/Services Defined:</strong> {data.itemTypes.length} items, {data.serviceTypes.length} services, {data.priceList.length} prices set.</p>
        </div>
        <div className="flex justify-between pt-4">
            <Button variant="secondary" onClick={onPrev} iconLeft={<ArrowLeft size={16} />} disabled={isSubmitting}>Back</Button>
            <Button onClick={onConfirm} isLoading={isSubmitting} iconLeft={<KeyRound size={16} />}>Confirm & Send Code</Button>
        </div>
    </div>
);

const Step5OtpVerification = ({ data, onPrev, onFinalize, isSubmitting }) => {
    const [otp, setOtp] = useState('');
    return (
        <div className="space-y-4 animate-fade-in">
            <h3 className="font-semibold text-xl">Verify Your Email</h3>
            <p className="text-sm text-apple-gray-500">A 6-digit code was sent to <strong>{data.adminUser.email}</strong>. It expires in 15 minutes.</p>
            <Input label="Verification Code*" id="otp" value={otp} onChange={e => setOtp(e.target.value)} maxLength={6} placeholder="123456" />
            <div className="flex justify-between pt-4">
                <Button variant="secondary" onClick={onPrev} disabled={isSubmitting}>Back</Button>
                <Button onClick={() => onFinalize(otp)} isLoading={isSubmitting}>Verify & Create Account</Button>
            </div>
        </div>
    );
};

// --- Main SignUpPage Component ---
const SignUpPage = () => {
    const auth = useAuth();
    const navigate = useNavigate();
    const [step, setStep] = useState(1);
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        adminUser: { username: '', password: '', email: '' },
        companyInfo: { name: '', address: '', phone: '' },
        currencySymbol: 'FCFA',
        itemTypes: ['Shirt', 'Trousers', 'Suit', 'Dress'],
        serviceTypes: ['Wash', 'Iron Only', 'Dry Clean'],
        priceList: [],
    });

    const updateFormData = (section, field, value) => setFormData(prev => ({ ...prev, [section]: { ...prev[section], [field]: value } }));
    const setTopLevelFormData = (field, value) => setFormData(prev => ({ ...prev, [field]: value }));
    const nextStep = () => setStep(prev => Math.min(prev + 1, 5)); // Now goes up to step 5
    const prevStep = () => setStep(prev => Math.max(prev - 1, 1));

    const handleInitiateRegistration = async () => {
        setIsSubmitting(true); setError('');
        try {
            const { data } = await initiateRegistrationApi(formData);
            alert(data.message); // Or use a success message state
            setStep(5); // Move to OTP step
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to start registration process.');
            setStep(1); // On major validation error from backend, go back to start
        } finally { setIsSubmitting(false); }
    };

    const handleFinalizeRegistration = async (otp) => {
        if (!otp || otp.length !== 6) { setError('Please enter a valid 6-digit code.'); return; }
        setIsSubmitting(true); setError('');
        try {
            const { data } = await finalizeRegistrationApi({ email: formData.adminUser.email, otp });
            await auth.loginWithToken(data.token); // This needs to be implemented in AuthContext
            alert("Success! Account created. You are now being redirected to your dashboard.");
            navigate('/app/dashboard');
        } catch (err) {
            setError(err.response?.data?.message || 'Verification failed. Please check your code or go back.');
        } finally { setIsSubmitting(false); }
    };

    const renderStep = () => {
        switch (step) {
            case 1: return <Step1AdminAccount data={formData.adminUser} setData={updateFormData} onNext={nextStep} />;
            case 2: return <Step2CompanyInfo data={{...formData.companyInfo, currencySymbol: formData.currencySymbol}} setData={(section, field, value) => { if (field === 'currencySymbol') setTopLevelFormData('currencySymbol', value); else updateFormData('companyInfo', field, value); }} onNext={nextStep} onPrev={prevStep} />;
            case 3: return <Step3SetupServices formData={formData} setFormData={setFormData} onNext={nextStep} onPrev={prevStep} />;
            case 4: return <Step4Confirmation data={formData} onPrev={prevStep} onConfirm={handleInitiateRegistration} isSubmitting={isSubmitting} />;
            case 5: return <Step5OtpVerification data={formData} onPrev={() => setStep(4)} onFinalize={handleFinalizeRegistration} isSubmitting={isSubmitting} />;
            default: return <Step1AdminAccount data={formData.adminUser} setData={updateFormData} onNext={nextStep} />;
        }
    };

    return (
        <div className="min-h-screen bg-apple-gray-100 dark:bg-apple-gray-950 flex flex-col items-center justify-center p-4">
             <Link to="/" className="flex items-center space-x-2 mb-8"><svg className="h-10 w-10 text-apple-blue" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
                <span className="text-3xl font-bold text-apple-gray-800 dark:text-apple-gray-100">PressFlow</span></Link>
            <Card className="w-full max-w-3xl shadow-apple-lg">
                <div className="flex items-center p-4 border-b dark:border-apple-gray-700">
                    <h2 className="text-xl font-bold text-center flex-grow">Set Up Your Business</h2>
                    <span className="text-sm font-medium text-apple-gray-500">{step < 5 ? `Step ${step} of 4` : 'Final Step: Verification'}</span>
                </div>
                {error && <div className="p-3 m-4 text-sm bg-red-100 text-apple-red rounded-apple flex items-center"><AlertTriangle size={18} className="mr-2"/>{error}</div>}
                <div className="p-6">{renderStep()}</div>
            </Card>
        </div>
    );
};
export default SignUpPage;