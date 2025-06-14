// client/src/pages/User/ProfilePage.js
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { updateMyProfile, changeMyPassword, uploadMyProfilePicture } from '../../services/api';
import Card from '../../components/UI/Card';
import Input from '../../components/UI/Input';
import Button from '../../components/UI/Button';
import Spinner from '../../components/UI/Spinner';
import { UserCircle, ShieldCheck, Briefcase, Edit3, KeyRound, Save, AlertTriangle, CheckCircle2, Camera, UploadCloud, Mail } from 'lucide-react'; // Added Mail

const DetailItem = ({ label, value, icon: IconComponent, children }) => (
    <div className="py-3 sm:grid sm:grid-cols-3 sm:gap-4">
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

    const [username, setUsername] = useState('');
    // const [email, setEmail] = useState(''); 
    const [isEditingProfile, setIsEditingProfile] = useState(false);
    const [profileSaving, setProfileSaving] = useState(false);
    const [profileError, setProfileError] = useState('');
    const [profileSuccess, setProfileSuccess] = useState('');

    
    const [profilePictureFile, setProfilePictureFile] = useState(null);
    const [profilePicturePreview, setProfilePicturePreview] = useState('');
    const [uploadingPicture, setUploadingPicture] = useState(false);
    const [pictureError, setPictureError] = useState('');
    const [pictureSuccess, setPictureSuccess] = useState('');
    const fileInputRef = useRef(null);

    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmNewPassword, setConfirmNewPassword] = useState('');
    const [passwordChanging, setPasswordChanging] = useState(false);
    const [passwordError, setPasswordError] = useState('');
    const [passwordSuccess, setPasswordSuccess] = useState('');

    useEffect(() => {
        if (user) {
            setUsername(user.username || '');
            // setEmail(user.email || ''); 
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
        if (username === user.username) { 
            setIsEditingProfile(false);
            setProfileError('');
            return;
        }
        setProfileSaving(true); setProfileError(''); setProfileSuccess('');
        try {
            const payload = { username };
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
            if (file.size > 2 * 1024 * 1024) { 
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
        try {
            const { data } = await uploadMyProfilePicture(formData);
            updateUserInContext({ profilePictureUrl: data.profilePictureUrl }); 
            setProfilePicturePreview(data.profilePictureUrl);
            setProfilePictureFile(null);
            if (fileInputRef.current) fileInputRef.current.value = ""; 
            setPictureSuccess(data.message || 'Profile picture updated!');
        } catch (err) {
            setPictureError(err.response?.data?.message || 'Failed to upload profile picture.');
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
            setTimeout(() => logout(), 2000);
        } catch (err) {
            setPasswordError(err.response?.data?.message || 'Failed to change password.');
        } finally {
            setPasswordChanging(false);
        }
    };

    if (authLoading && !user) {
        return <div className="flex justify-center items-center h-64"><Spinner size="lg" /></div>;
    }
    if (!user) { 
        return <div className="text-center p-6">User data not available. Please log in.</div>;
    }

    return (
        <div className="max-w-2xl mx-auto space-y-8 pb-12">
            <div className="flex items-center space-x-4 pt-2">
                <div className="relative group">
                    {profilePicturePreview ? (
                        <img src={profilePicturePreview} alt={user.username} className="h-24 w-24 rounded-full object-cover border-4 border-white dark:border-apple-gray-700 shadow-md" />
                    ) : (
                        <UserCircle size={96} className="text-apple-gray-300 dark:text-apple-gray-600" />
                    )}
                    <Button
                        variant="ghost"
                        size="sm"
                        className="absolute bottom-1 right-1 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => fileInputRef.current && fileInputRef.current.click()}
                        aria-label="Change profile picture"
                    > <Camera size={16} /> </Button>
                    <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/png, image/jpeg, image/gif" className="hidden" />
                </div>
                <div>
                    <h1 className="text-3xl font-semibold text-apple-gray-800 dark:text-apple-gray-100">
                        {user.username}
                    </h1>
                    <p className="text-md text-apple-gray-500 dark:text-apple-gray-400 capitalize">{user.role}</p>
                </div>
            </div>
            {profilePictureFile && !uploadingPicture && (
                 <div className="flex items-center justify-start gap-x-3 -mt-4 ml-28"> 
                    <Button onClick={handlePictureUpload} iconLeft={<UploadCloud size={16}/>} variant="primary" size="sm">Upload</Button>
                    <Button onClick={() => { setProfilePictureFile(null); setProfilePicturePreview(user.profilePictureUrl || ''); if(fileInputRef.current) fileInputRef.current.value = ""; }} variant="secondary" size="sm">Cancel</Button>
                </div>
            )}
            {uploadingPicture && <div className="-mt-4 ml-28 text-sm text-apple-gray-500"><Spinner size="sm" className="inline mr-2"/>Uploading...</div>}
            {pictureSuccess && <p className="my-2 text-sm text-apple-green text-center">{pictureSuccess}</p>}
            {pictureError && <p className="my-2 text-sm text-apple-red text-center">{pictureError}</p>}

            <Card title="Account Information"
                actions={!isEditingProfile && (
                    <Button variant="ghost" size="sm" onClick={() => {setIsEditingProfile(true); setProfileError(''); setProfileSuccess('');}} iconLeft={<Edit3 size={16}/>}>
                        Edit
                    </Button>
                )}
            >
                {profileSuccess && !isEditingProfile && <p className="p-3 mb-0 text-sm bg-green-100 text-apple-green rounded-apple flex items-center"><CheckCircle2 size={18} className="mr-2"/>{profileSuccess}</p>}
                {profileError && isEditingProfile && <p className="p-3 mb-4 text-sm bg-red-100 text-apple-red rounded-apple flex items-center"><AlertTriangle size={18} className="mr-2"/>{profileError}</p>}

                {!isEditingProfile ? (
                    <dl className="divide-y divide-apple-gray-100 dark:divide-apple-gray-800">
                        <DetailItem label="Username" value={user.username} icon={UserCircle} />
                        <DetailItem label="Role" value={user.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : 'N/A'} icon={user.role === 'admin' ? ShieldCheck : Briefcase} />
                        {/* <DetailItem label="Email" value={user.email || 'Not Provided'} icon={Mail} /> */}
                    </dl>
                ) : (
                    <form onSubmit={handleProfileUpdate} className="space-y-4 pt-2">
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

            <Card title="Change Password">
                {passwordSuccess && <p className="p-3 mb-4 text-sm bg-green-100 text-apple-green rounded-apple flex items-center"><CheckCircle2 size={18} className="mr-2"/>{passwordSuccess}</p>}
                {passwordError && <p className="p-3 mb-4 text-sm bg-red-100 text-apple-red rounded-apple flex items-center"><AlertTriangle size={18} className="mr-2"/>{passwordError}</p>}
                <form onSubmit={handlePasswordChange} className="space-y-4">
                    <Input label="Current Password" id="currentPassword" name="currentPassword" type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} required autoComplete="current-password" />
                    <Input label="New Password" id="newPassword" name="newPassword" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required autoComplete="new-password" />
                    <Input label="Confirm New Password" id="confirmNewPassword" name="confirmNewPassword" type="password" value={confirmNewPassword} onChange={(e) => setConfirmNewPassword(e.target.value)} required autoComplete="new-password"/>
                    <div className="flex justify-end pt-2">
                        <Button type="submit" variant="primary" isLoading={passwordChanging} iconLeft={<KeyRound size={16}/>}>Change Password</Button>
                    </div>
                </form>
            </Card>
        </div>
    );
};

export default ProfilePage;