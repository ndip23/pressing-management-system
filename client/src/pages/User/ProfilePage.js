// client/src/pages/User/ProfilePage.js
import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import Card from '../../components/UI/Card';
import { UserCircle, ShieldCheck, Briefcase } from 'lucide-react'; // Example icons
import Spinner from '../../components/UI/Spinner'; // Assuming you have this

const DetailItem = ({ label, value, icon: Icon }) => (
    <div className="py-3 sm:grid sm:grid-cols-3 sm:gap-4 border-b border-apple-gray-200 dark:border-apple-gray-700 last:border-b-0">
        <dt className="text-sm font-medium text-apple-gray-500 dark:text-apple-gray-400 flex items-center">
            {Icon && <Icon size={16} className="mr-2 text-apple-gray-400" />}
            {label}
        </dt>
        <dd className="mt-1 text-sm text-apple-gray-900 dark:text-apple-gray-100 sm:mt-0 sm:col-span-2">
            {value || <span className="italic text-apple-gray-400">Not set</span>}
        </dd>
    </div>
);

const ProfilePage = () => {
    const { user, loading: authLoading } = useAuth(); // Get user from AuthContext

    if (authLoading || !user) {
        return (
            <div className="flex justify-center items-center h-64">
                <Spinner size="lg" />
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <div className="flex items-center space-x-3 mb-6">
                <UserCircle size={32} className="text-apple-blue" />
                <h1 className="text-2xl sm:text-3xl font-semibold text-apple-gray-800 dark:text-apple-gray-100">
                    My Profile
                </h1>
            </div>

            <Card title="Account Information">
                <dl>
                    <DetailItem label="Username" value={user.username} icon={UserCircle} />
                    <DetailItem label="Role" value={user.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : 'N/A'} icon={user.role === 'admin' ? ShieldCheck : Briefcase} />
                    {/* <DetailItem label="Email" value={user.email} icon={MailIcon} /> */}
                </dl>
            </Card>

            <Card title="Actions (Coming Soon)">
                <p className="text-sm text-apple-gray-500 dark:text-apple-gray-400 p-4 text-center">
                    Functionality to update your profile details and change your password will be available here soon.
                </p>
            </Card>
        </div>
    );
};

export default ProfilePage;