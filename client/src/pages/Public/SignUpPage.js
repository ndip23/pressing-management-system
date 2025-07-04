// client/src/pages/Public/SignUpPage.js
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { registerTenantWithSetup } from '../../services/api';
import Card from '../../components/UI/Card';
import Button from '../../components/UI/Button';
import Input from '../../components/UI/Input';
import { ArrowLeft, ArrowRight, PartyPopper, AlertTriangle, User, Building, Wrench, CheckCircle2 } from 'lucide-react';

// --- Step 1 Component ---
const Step1_AdminAccount = ({ data, setData, nextStep }) => {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');

    const handleNext = () => {
        setError('');
        if (!data.username || !password) { setError('Username and password are required.'); return; }
        if (password.length < 6) { setError('Password must be at least 6 characters.'); return; }
        if (password !== confirmPassword) { setError('Passwords do not match.'); return; }
        setData('adminUser', 'password', password); // Set the password in the main form data
        nextStep();
    };

    return (
        <div className="space-y-4 animate-fade-in">
            <div className="flex items-center space-x-3 mb-4">
                <div className="bg-apple-blue text-white rounded-full p-2"><User size={20} /></div>
                <h3 className="font-semibold text-xl text-apple-gray-800 dark:text-white">Create Your Admin Account</h3>
            </div>
            <p className="text-sm text-apple-gray-500 dark:text-apple-gray-400">This will be your personal login for managing the business.</p>
            {error && <p className="text-sm text-red-500 p-2 bg-red-100 dark:bg-red-900/30 rounded-md">{error}</p>}
            <Input label="Username*" name="username" value={data.username} onChange={e => setData('adminUser', 'username', e.target.value)} />
            <Input label="Email (for password recovery)" name="email" type="email" value={data.email} onChange={e => setData('adminUser', 'email', e.target.value)} />
            <Input label="Password*" name="password" type="password" value={password} onChange={e => setPassword(e.target.value)} />
            <Input label="Confirm Password*" name="confirmPassword" type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} />
            <div className="flex justify-end pt-4">
                <Button onClick={handleNext} iconRight={<ArrowRight size={16} />}>Next: Company Info</Button>
            </div>
        </div>
    );
};

// --- Step 2 Component ---
const Step2_CompanyInfo = ({ data, setData, nextStep, prevStep }) => {
    const [error, setError] = useState('');

    const handleNext = () => {
        setError('');
        if (!data.name) { setError('Business name is required.'); return; }
        if (!data.currencySymbol) { setError('Currency symbol is required.'); return; }
        nextStep();
    };

    return (
        <div className="space-y-4 animate-fade-in">
            <div className="flex items-center space-x-3 mb-4">
                <div className="bg-apple-blue text-white rounded-full p-2"><Building size={20} /></div>
                <h3 className="font-semibold text-xl text-apple-gray-800 dark:text-white">Tell Us About Your Business</h3>
            </div>
            {error && <p className="text-sm text-red-500 p-2 bg-red-100 dark:bg-red-900/30 rounded-md">{error}</p>}
            <Input label="Business Name*" name="name" value={data.name} onChange={e => setData('companyInfo', 'name', e.target.value)} />
            <Input label="Business Address" name="address" value={data.address} onChange={e => setData('companyInfo', 'address', e.target.value)} />
            <Input label="Business Phone" name="phone" value={data.phone} onChange={e => setData('companyInfo', 'phone', e.target.value)} />
            <Input label="Currency Symbol*" name="currencySymbol" value={data.currencySymbol} onChange={e => setData('currencySymbol', e.target.value)} />
            <div className="flex justify-between pt-4">
                <Button variant="secondary" onClick={prevStep} iconLeft={<ArrowLeft size={16} />}>Back</Button>
                <Button onClick={handleNext} iconRight={<ArrowRight size={16} />}>Next: Setup Services</Button>
            </div>
        </div>
    );
};

// --- Step 3 Component (Complex - simplified UI for now) ---
const Step3_SetupServices = ({ formData, setFormData, nextStep, prevStep }) => {
    const [newItem, setNewItem] = useState('');
    const [newService, setNewService] = useState('');

    const handlePriceChange = (itemType, serviceType, price) => {
        const existingIndex = formData.priceList.findIndex(p => p.itemType === itemType && p.serviceType === serviceType);
        const newPrice = parseFloat(price) || 0;
        let newList = [...formData.priceList];
        if (existingIndex > -1) { newList[existingIndex].price = newPrice; }
        else { newList.push({ itemType, serviceType, price: newPrice }); }
        setFormData(prev => ({ ...prev, priceList: newList }));
    };

    const getPrice = (itemType, serviceType) => formData.priceList.find(p => p.itemType === itemType && p.serviceType === serviceType)?.price ?? '';
    const addItem = () => { if (newItem && !formData.itemTypes.includes(newItem)) setFormData(prev => ({ ...prev, itemTypes: [...prev.itemTypes, newItem.trim()] })); setNewItem(''); };
    const addService = () => { if (newService && !formData.serviceTypes.includes(newService)) setFormData(prev => ({ ...prev, serviceTypes: [...prev.serviceTypes, newService.trim()] })); setNewService(''); };
    const removeItem = (item) => setFormData(prev => ({ ...prev, itemTypes: prev.itemTypes.filter(i => i !== item)}));
    const removeService = (service) => setFormData(prev => ({ ...prev, serviceTypes: prev.serviceTypes.filter(s => s !== service)}));


    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex items-center space-x-3 mb-4">
                <div className="bg-apple-blue text-white rounded-full p-2"><Wrench size={20} /></div>
                <h3 className="font-semibold text-xl text-apple-gray-800 dark:text-white">Setup Your Services & Pricing</h3>
            </div>
            <p className="text-sm text-apple-gray-500 dark:text-apple-gray-400">Define what you clean and how much it costs. You can change this later in settings.</p>
            {/* ... (UI for adding/removing itemTypes and serviceTypes would go here) ... */}
            <div className="overflow-x-auto p-1 border rounded-md dark:border-apple-gray-700">
                <table className="min-w-full text-sm">
                    <thead className="bg-apple-gray-100 dark:bg-apple-gray-800/50"><tr><th className="p-2 text-left font-semibold">Item Type</th>{formData.serviceTypes.map(s => <th key={s} className="p-2">{s}</th>)}</tr></thead>
                    <tbody>{formData.itemTypes.map(item => (<tr key={item} className="border-t dark:border-apple-gray-700"><td className="p-2 font-medium">{item}</td>{formData.serviceTypes.map(service => (<td key={service} className="p-1 sm:p-2"><Input type="number" value={getPrice(item, service)} onChange={e => handlePriceChange(item, service, e.target.value)} placeholder="0.00" className="mb-0 w-24" /></td>))}</tr>))}</tbody>
                </table>
            </div>
            <div className="flex justify-between pt-4">
                <Button variant="secondary" onClick={prevStep} iconLeft={<ArrowLeft size={16} />}>Back</Button>
                <Button onClick={nextStep} iconRight={<ArrowRight size={16} />}>Next: Review & Finish</Button>
            </div>
        </div>
    );
};

// --- Step 4 Component (Confirmation) ---
const Step4_Confirmation = ({ data, prevStep, handleSubmit, isSubmitting }) => (
    <div className="space-y-4 animate-fade-in">
        <div className="flex items-center space-x-3 mb-4">
            <div className="bg-apple-blue text-white rounded-full p-2"><PartyPopper size={20} /></div>
            <h3 className="font-semibold text-xl text-apple-gray-800 dark:text-white">Review & Confirm</h3>
        </div>
        <p className="text-sm text-apple-gray-500 dark:text-apple-gray-400">Please confirm all details are correct before creating your account.</p>
        {/* Simple display of confirmation data */}
        <div className="p-4 bg-apple-gray-100 dark:bg-apple-gray-800/50 rounded-md text-sm space-y-2">
            <p><strong>Admin Username:</strong> {data.adminUser.username}</p>
            <p><strong>Business Name:</strong> {data.companyInfo.name}</p>
            <p><strong>Item Types:</strong> {data.itemTypes.join(', ')}</p>
            <p><strong>Service Types:</strong> {data.serviceTypes.join(', ')}</p>
            <p><strong>Prices Set:</strong> {data.priceList.length} combinations</p>
        </div>
        <div className="flex justify-between pt-4">
            <Button variant="secondary" onClick={prevStep} iconLeft={<ArrowLeft size={16} />} disabled={isSubmitting}>Back</Button>
            <Button onClick={handleSubmit} isLoading={isSubmitting} iconLeft={<CheckCircle2 size={16}/>}>Create My Account</Button>
        </div>
    </div>
);
const Step5_SuccessAndLogin = ({ companyName, adminUsername }) => {
    return (
        <div className="text-center space-y-4 animate-fade-in p-4">
            <PartyPopper size={48} className="mx-auto text-apple-green" />
            <h3 className="font-bold text-2xl text-apple-gray-800 dark:text-white">
                Registration Successful!
            </h3>
            <p className="text-apple-gray-600 dark:text-apple-gray-400">
                The account for <strong className="text-apple-gray-800 dark:text-white">{companyName}</strong> has been created.
            </p>
            <p className="text-sm text-apple-gray-500 dark:text-apple-gray-400 pt-2">
                You can now log in with your new admin credentials:
                <br />
                Username: <strong className="text-apple-gray-700 dark:text-apple-gray-200">{adminUsername}</strong>
            </p>
            <div className="pt-4">
                <Link to="/login">
                    <Button variant="primary" size="lg">
                        Proceed to Login
                    </Button>
                </Link>
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

    const updateFormData = (section, field, value) => {
        setFormData(prev => ({ ...prev, [section]: { ...prev[section], [field]: value } }));
    };
    const setTopLevelFormData = (field, value) => {
         setFormData(prev => ({ ...prev, [field]: value }));
    };

    const nextStep = () => setStep(prev => Math.min(prev + 1, 4));
    const prevStep = () => setStep(prev => Math.max(prev - 1, 1));

const handleSubmit = async () => {
        setIsSubmitting(true);
        setError('');
        try {
            // Call the backend to create the tenant and user
            await registerTenantWithSetup(formData);
            // On success, simply move to the final success step
            setStep(5);
        } catch (err) {
            setError(err.response?.data?.message || 'Registration failed. A user or business with these details may already exist.');
            setStep(1); // On major error, reset to the first step
        } finally {
            setIsSubmitting(false);
        }
    };


    const renderStep = () => {
        switch (step) {
            case 1:
                return <Step1_AdminAccount data={formData.adminUser} setData={updateFormData} nextStep={nextStep} />;
            case 2:
                // Pass the combined currency and company data, and the correct setters
                return <Step2_CompanyInfo data={{...formData.companyInfo, currencySymbol: formData.currencySymbol}} setData={(section, field, value) => {
                    if (section === 'currencySymbol') setTopLevelFormData('currencySymbol', value);
                    else updateFormData('companyInfo', field, value);
                }} nextStep={nextStep} prevStep={prevStep} />;
            case 3:
                return <Step3_SetupServices formData={formData} setFormData={setFormData} nextStep={nextStep} prevStep={prevStep} />;
            case 4:
                return <Step4_Confirmation data={formData} prevStep={prevStep} handleSubmit={handleSubmit} isSubmitting={isSubmitting} />;
            case 5:
                return <Step5_SuccessAndLogin companyName={formData.companyInfo.name} adminUsername={formData.adminUser.username} />;
            default:
                return <Step1_AdminAccount data={formData.adminUser} setData={updateFormData} nextStep={nextStep} />;
        }
    };

    return (
        <div className="min-h-screen bg-apple-gray-100 dark:bg-apple-gray-950 flex flex-col items-center justify-center p-4">
             <Link to="/" className="flex items-center space-x-2 mb-8">
                <svg className="h-10 w-10 text-apple-blue" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
                <span className="text-3xl font-bold text-apple-gray-800 dark:text-apple-gray-100">PressFlow</span>
            </Link>
            <Card className="w-full max-w-3xl shadow-apple-lg">
                <div className="flex items-center p-4 border-b dark:border-apple-gray-700">
                    <h2 className="text-xl font-bold text-center flex-grow">Set Up Your Business</h2>
                    <span className="text-sm font-medium text-apple-gray-500">Step {step} of 4</span>
                </div>
                {error && <div className="p-3 m-4 text-sm bg-red-100 text-apple-red rounded-apple flex items-center"><AlertTriangle size={18} className="mr-2"/>{error}</div>}
                <div className="p-6">
                    {renderStep()}
                </div>
            </Card>
        </div>
    );
};

export default SignUpPage;