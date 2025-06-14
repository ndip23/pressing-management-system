// client/src/pages/User/ProfilePage.js
import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { updateMyProfile, changeMyPassword, uploadMyProfilePicture } from '../../services/api';
import Card from '../../components/UI/Card';
import Input from '../../components/UI/Input';
import Button from '../../components/UI/Button';
import Spinner from '../../components/UI/Spinner';
import { UserCircle, ShieldCheck, Briefcase, Edit3, KeyRound, Save, AlertTriangle, CheckCircle2, Camera, UploadCloud, Mail, Eye, EyeOff } from 'lucide-react'; // Added Mail, Eye, EyeOff

// Reusable DetailItem component for displaying profile info
const DetailItem = ({ label, value, icon: IconComponent, children }) => (
    <div className="py-3 sm:grid sm:grid-cols-3 sm:gap-4"> {/* Removed border here, will be handled by Card's internal dl styling */}
        <dt className="text-sm font-medium text-apple-gray-500 dark:text-apple-gray-400 flex items-center">
            {IconComponent && <IconComponent size={16} className="mr-2 text-apple-gray-400 dark:text-apple-gray-500" />}
            {label}
        </dt>
        <dd className="mt-1 text-sm text-apple-gray-900 dark:text-apple-gray-100 sm:mt-0 sm:col-span-2">
            {children || value || <span className="italic text-apple-gray-400 dark:text-apple-gray-500">Not set</span>}
        </dd>
    </div>
);

const ProfilePage = () => {
    const { user, updateUserInContext, loading: authLoading, logout } = useAuth();

    // Profile Details State
    const [username, setUsername] = useState('');
    // const [email, setEmail] = useState(''); // If you add email for editing
    const [isEditingProfile, setIsEditingProfile] = useState(false);
    const [profileSaving, setProfileSaving] = useState(false);
    const [profileError, setProfileError] = useState('');
    const [profileSuccess, setProfileSuccess] = useState('');

    // Profile Picture State
    const [profilePictureFile, setProfilePictureFile] = useState(null);
    const [profilePicturePreview, setProfilePicturePreview] = useState('');
    const [uploadingPicture, setUploadingPicture] = useState(false);
    const [pictureError, setPictureError] = useState('');
    const [pictureSuccess, setPictureSuccess] = useState('');
    const fileInputRef = useRef(null);

    // Change Password State
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmNewPassword, setConfirmNewPassword] = useState('');
    const [passwordChanging, setPasswordChanging] = useState(false);
    const [passwordError, setPasswordError] = useState('');
    const [passwordSuccess, setPasswordSuccess] = useState('');

    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    useEffect(() => {
        if (user) {
            setUsername(user.username || '');
            // setEmail(user.email || ''); // if managing email
            setProfilePicturePreview(user.profilePictureUrl || '');
        }
    }, [user]);

    useEffect(() => {
        let timer;
        if (profileSuccess || profileError || pictureSuccess || pictureError || passwordSuccess || passwordError) {
            timer = setTimeout(() => {
                setProfileSuccess(''); setProfileError('');
                setPictureSuccess(''); setPictureError('');
                setPasswordSuccess(''); setPasswordError('');
            }, 4000);
        }
        return () => clearTimeout(timer);
    }, [profileSuccess, profileError, pictureSuccess, pictureError, passwordSuccess, passwordError]);

    const handleProfileUpdate = async (e) => {
        e.preventDefault();
        if (!username.trim() || username === user.username) {
            setIsEditingProfile(false); // Just close if no change or empty
            setProfileError('');
            return;
        }
        setProfileSaving(true); setProfileError(''); setProfileSuccess('');
        try {
            const payload = { username: username.trim() };
            // if (email !== user.email) payload.email = email;
            const { data: updatedUser } = await updateMyProfile(payload);
            updateUserInContext(updatedUser);
            setProfileSuccess('Profile updated successfully!');
            setIsEditingProfile(false);
        } catch (err) {
            setProfileError(err.response?.data?.message || 'Failed to update profile.');
        } finally {
            setProfileSaving(false);
        }
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 2 * 1024 * 1024) { // Max 2MB
                setPictureError("File is too large (max 2MB)."); setProfilePictureFile(null); setProfilePicturePreview(user.profilePictureUrl || ''); return;
            }
            if (!['image/jpeg', 'image/png', 'image/gif'].includes(file.type)) {
                setPictureError("Invalid file type (JPG, PNG, GIF only)."); setProfilePictureFile(null); setProfilePicturePreview(user.profilePictureUrl || ''); return;
            }
            setPictureError(''); setProfilePictureFile(file); setProfilePicturePreview(URL.createObjectURL(file));
        }
    };

    const handlePictureUpload = async () => {
        if (!profilePictureFile) { setPictureError("Please select an image file."); return; }
        setUploadingPicture(true); setPictureError(''); setPictureSuccess('');
        const formData = new FormData();
        formData.append('profilePicture', profilePictureFile);
        console.log("[ProfilePage] Attempting to upload picture. FormData prepared.");

        try {
            const response = await uploadMyProfilePicture(formData);
            console.log("[ProfilePage] Full API response for picture upload:", response);
            const responseData = response.data;
            console.log("[ProfilePage] Backend response data (response.data):", responseData);

            if (responseData && responseData.profilePictureUrl) {
                updateUserInContext({ profilePictureUrl: responseData.profilePictureUrl });
                setProfilePicturePreview(responseData.profilePictureUrl);
                setProfilePictureFile(null);
                if (fileInputRef.current) fileInputRef.current.value = "";
                setPictureSuccess(responseData.message || 'Profile picture updated!');
                console.log("[ProfilePage] Picture upload success path taken.");
            } else {
                console.error("[ProfilePage] Unexpected backend response structure for picture upload:", responseData);
                setPictureError(responseData?.message || 'Unexpected response from server after upload.');
            }
        } catch (err) {
            console.error("[ProfilePage] Error during picture upload API call:", err);
            if (err.response) { console.error("[ProfilePage] Axios error response data:", err.response.data); }
            setPictureError(err.response?.data?.message || err.message || 'Failed to upload profile picture.');
        } finally {
            setUploadingPicture(false);
        }
    };

    const handlePasswordChange = async (e) => {
        e.preventDefault();
        if (newPassword !== confirmNewPassword) { setPasswordError('New passwords do not match.'); return; }
        if (newPassword.length < 6) { setPasswordError('New password must be at least 6 characters.'); return; }
        setPasswordChanging(true); setPasswordError(''); setPasswordSuccess('');
        try {
            const { data } = await changeMyPassword({ currentPassword, newPassword });
            setPasswordSuccess(data.message || 'Password changed successfully!');
            setCurrentPassword(''); setNewPassword(''); setConfirmNewPassword('');
        } catch (err) {
            setPasswordError(err.response?.data?.message || 'Failed to change password.');
        } finally {
            setPasswordChanging(false);
        }
    };

    const PasswordToggleIcon = ({ show, toggle }) => (
        show ? (
            <EyeOff size={18} onClick={toggle} className="cursor-pointer text-apple-gray-400 hover:text-apple-gray-600 dark:hover:text-apple-gray-200" />
        ) : (
            <Eye size={18} onClick={toggle} className="cursor-pointer text-apple-gray-400 hover:text-apple-gray-600 dark:hover:text-apple-gray-200" />
        )
    );

    if (authLoading && !user) { return <div className="flex justify-center items-center h-64"><Spinner size="lg" /></div>; }
    if (!user) { return <div className="text-center p-6">User data not available. Please log in.</div>; }

    return (
        <div className="max-w-2xl mx-auto space-y-8 pb-12">
            <div className="flex items-center space-x-4 pt-2">
                <div className="relative group">
                    {profilePicturePreview ? (
                        <img src={profilePicturePreview} alt={user.username} className="h-24 w-24 rounded-full object-cover border-4 border-white dark:border-apple-gray-700 shadow-md" />
                    ) : (
                        <UserCircle size={96} className="text-apple-gray-300 dark:text-apple-gray-600" />
                    )}
                    <button type="button" className="absolute bottom-1 right-1 bg-apple-gray-600 hover:bg-apple-gray-700 dark:bg-apple-gray-200 dark:hover:bg-apple-gray-300 text-white dark:text-apple-gray-800 p-2 rounded-full shadow-lg focus:outline-none focus:ring-2 focus:ring-apple-blue focus:ring-offset-2 dark:focus:ring-offset-apple-gray-900 transition-all duration-150 ease-in-out opacity-0 group-hover:opacity-100"
                        onClick={() => fileInputRef.current && fileInputRef.current.click()} aria-label="Change profile picture"> <Camera size={16} /> </button>
                    <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/png, image/jpeg, image/gif" className="hidden" />
                </div>
                <div><h1 className="text-3xl font-semibold text-apple-gray-800 dark:text-apple-gray-100">{user.username}</h1><p className="text-md text-apple-gray-500 dark:text-apple-gray-400 capitalize">{user.role}</p></div>
            </div>

            {profilePictureFile && !uploadingPicture && ( <div className="flex items-center justify-start gap-x-3 -mt-4 ml-28"> <Button onClick={handlePictureUpload} iconLeft={<UploadCloud size={16}/>} variant="primary" size="sm">Upload</Button> <Button onClick={() => { setProfilePictureFile(null); setProfilePicturePreview(user.profilePictureUrl || ''); if(fileInputRef.current) fileInputRef.current.value = ""; }} variant="secondary" size="sm">Cancel</Button> </div> )}
            {uploadingPicture && <div className="-mt-4 ml-28 text-sm text-apple-gray-500 flex items-center"><Spinner size="sm" className="inline mr-2"/>Uploading...</div>}
            {pictureSuccess && <p className="my-2 text-sm text-apple-green text-center flex items-center justify-center"><CheckCircle2 size={16} className="mr-1"/> {pictureSuccess}</p>}
            {pictureError && <p className="my-2 text-sm text-apple-red text-center flex items-center justify-center"><AlertTriangle size={16} className="mr-1"/> {pictureError}</p>}

            <Card title="Account Information" contentClassName="px-4 sm:px-6 divide-y divide-apple-gray-100 dark:divide-apple-gray-800"
                actions={!isEditingProfile && ( <Button variant="ghost" size="sm" onClick={() => {setIsEditingProfile(true); setProfileError(''); setProfileSuccess('');}} iconLeft={<Edit3 size={16}/>}> Edit </Button> )}>
                {profileSuccess && !isEditingProfile && <div className="p-3 text-sm bg-green-100 text-apple-green rounded-apple flex items-center"><CheckCircle2 size={18} className="mr-2"/>{profileSuccess}</div>}
                {profileError && isEditingProfile && <div className="p-3 mb-4 text-sm bg-red-100 text-apple-red rounded-apple flex items-center"><AlertTriangle size={18} className="mr-2"/>{profileError}</div>}

                {!isEditingProfile ? (
                    <dl> {/* Removed extra divide-y as DetailItem handles its own bottom border */}
                        <DetailItem label="Username" value={user.username} icon={UserCircle} />
                        <DetailItem label="Role" value={user.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : 'N/A'} icon={user.role === 'admin' ? ShieldCheck : Briefcase} />
                        {/* Example: If user object had email from backend /me endpoint */}
                        {/* <DetailItem label="Email" value={user.email || 'Not Provided'} icon={Mail} /> */}
                    </dl>
                ) : (
                    <form onSubmit={handleProfileUpdate} className="space-y-4 pt-2 pb-1"> {/* Added padding to form */}
                        <Input label="Username" id="username" name="username" value={username} onChange={(e) => setUsername(e.target.value)} required />
                        {/* Example: Email field if editable
                        <Input label="Email" id="email" name="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} /> */}
                        <div className="flex justify-end space-x-3 pt-2">
                            <Button type="button" variant="secondary" onClick={() => { setIsEditingProfile(false); setProfileError(''); setUsername(user.username); /* setEmail(user.email); */ }}>Cancel</Button>
                            <Button type="submit" variant="primary" isLoading={profileSaving} iconLeft={<Save size={16}/>}>Save Profile</Button>
                        </div>
                    </form>
                )}
            </Card>

            <Card title="Change Password" contentClassName="px-4 sm:px-6">
                {passwordSuccess && <div className="p-3 mb-4 text-sm bg-green-100 text-apple-green rounded-apple flex items-center"><CheckCircle2 size={18} className="mr-2"/>{passwordSuccess}</div>}
                {passwordError && <div className="p-3 mb-4 text-sm bg-red-100 text-apple-red rounded-apple flex items-center"><AlertTriangle size={18} className="mr-2"/>{passwordError}</div>}
                <form onSubmit={handlePasswordChange} className="space-y-4 py-2">
                    <Input label="Current Password" id="currentPassword" name="currentPassword" type={showCurrentPassword ? "text" : "password"} value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} required autoComplete="current-password" suffixIcon={<PasswordToggleIcon show={showCurrentPassword} toggle={() => setShowCurrentPassword(!showCurrentPassword)} />} />
                    <Input label="New Password" id="newPassword" name="newPassword" type={showNewPassword ? "text" : "password"} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required autoComplete="new-password" minLength={6} suffixIcon={<PasswordToggleIcon show={showNewPassword} toggle={() => setShowNewPassword(!showNewPassword)} />} />
                    <Input label="Confirm New Password" id="confirmNewPassword" name="confirmNewPassword" type={showConfirmPassword ? "text" : "password"} value={confirmNewPassword} onChange={(e) => setConfirmNewPassword(e.target.value)} required autoComplete="new-password" minLength={6} suffixIcon={<PasswordToggleIcon show={showConfirmPassword} toggle={() => setShowConfirmPassword(!showConfirmPassword)} />} />
                    <div className="flex justify-end pt-2"> <Button type="submit" variant="primary" isLoading={passwordChanging} iconLeft={<KeyRound size={16}/>}> Change Password </Button> </div>
                </form>
            </Card>
        </div>
    );
};

export default ProfilePage;