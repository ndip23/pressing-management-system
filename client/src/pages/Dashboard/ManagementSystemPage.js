import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import Card from '../../components/UI/Card';
import { Settings, Users, CreditCard, FolderSearch, ArrowLeft } from 'lucide-react';

const ManageSystemPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const managementOptions = [
    {
      title: 'Store Settings',
      description: 'Configure your laundry business profile, hours, and branding.',
      icon: <Settings className="text-apple-blue" size={24} />,
      path: '/app/admin/settings',
      adminRequired: true,
    },
    {
      title: 'Manage Staff & Users',
      description: 'Invite team members, assign operator roles, and track activity.',
      icon: <Users className="text-apple-blue" size={24} />,
      path: '/app/admin/users',
      adminRequired: true,
    },
    {
      title: 'Pricing & Services',
      description: 'Set rates and services (e.g., dry cleaning, pressing, washing).',
      icon: <CreditCard className="text-apple-blue" size={24} />,
      path: '/app/admin/pricing',
      adminRequired: true,
    },
    {
      title: 'Directory Listing',
      description: 'Customize how your shop appears on our public business directory.',
      icon: <FolderSearch className="text-apple-blue" size={24} />,
      path: '/app/admin/directory',
      adminRequired: true,
    },
  ];

  return (
    <div className="max-w-5xl mx-auto p-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <button 
          onClick={() => navigate('/app/dashboard')}
          className="p-2 rounded-full hover:bg-apple-gray-100 dark:hover:bg-apple-gray-800 transition-colors"
        >
          <ArrowLeft size={20} className="text-apple-gray-600 dark:text-apple-gray-300" />
        </button>
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-apple-gray-900 dark:text-white">
            Manage System
          </h1>
          <p className="text-sm text-apple-gray-500 dark:text-apple-gray-400 mt-1">
            Access administrative controls, configurations, and directory listing settings.
          </p>
        </div>
      </div>

      {/* Grid of Options */}
      <div className="grid gap-6 md:grid-cols-2">
        {managementOptions.map((option, index) => {
          const isLocked = option.adminRequired && !isAdmin;

          return (
            <Card 
              key={index} 
              className={`p-6 transition-all duration-200 ${
                isLocked 
                  ? 'opacity-60 cursor-not-allowed' 
                  : 'hover:shadow-apple-lg hover:-translate-y-1 cursor-pointer'
              }`}
              onClick={() => {
                if (!isLocked) navigate(option.path);
              }}
            >
              <div className="flex items-start gap-4">
                <div className="p-3 bg-apple-blue/10 rounded-2xl">
                  {option.icon}
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-apple-gray-900 dark:text-white flex items-center gap-2">
                    {option.title}
                    {isLocked && (
                      <span className="text-xs bg-red-100 text-red-800 px-2 py-0.5 rounded-full font-medium">
                        Admin Only
                      </span>
                    )}
                  </h3>
                  <p className="text-sm text-apple-gray-500 dark:text-apple-gray-400 mt-1.5 leading-relaxed">
                    {option.description}
                  </p>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default ManageSystemPage;