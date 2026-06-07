// client/src/components/Layout/Sidebar.js
import React, { useState } from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
    LayoutDashboard,
    PlusCircle,
    ClipboardList,
    Users,      // Using Users icon for "Customers" link
    Settings,   // For Admin settings
    Package,    // For Logo
    CreditCard, // This was for a placeholder "Payments" link, remove if not used
    X,
    KeyRound,
    Tags,
    LogOut,
    Zap,
    Store,
    HelpCircle,
    CirclePlay,
} from 'lucide-react';
import { useAppTour } from '../../contexts/AppTourContext';
import { useAuth } from '../../contexts/AuthContext';
import {  WALLET_CURRENCY_SYMBOL } from '../../utils/onboarding';
import Button from '../UI/Button';

// NavItem component (assuming this is already correct and handles active/disabled states)
const NavItem = ({ to, icon: Icon, children, end = false, disabled = false, onWalletZero = null }) => (
    <NavLink
        to={to}
        end={end}
        onClick={(e) => {
            if (disabled) {
                e.preventDefault();
            } else if (onWalletZero) {
                onWalletZero(e, to);
            }
        }}
        className={({ isActive }) =>
            `flex items-center space-x-3 px-3 py-2.5 rounded-apple text-sm font-medium
            transition-colors duration-150 ease-apple
            ${disabled
                ? 'text-apple-gray-400 dark:text-apple-gray-600 cursor-not-allowed opacity-50' // Added opacity for disabled
                : isActive
                    ? 'bg-apple-blue text-white shadow-apple-sm'
                    : 'text-apple-gray-700 dark:text-apple-gray-300 hover:bg-apple-gray-200 dark:hover:bg-apple-gray-700/60'
            }`
        }
        aria-disabled={disabled}
        tabIndex={disabled ? -1 : undefined}
    >
        <Icon size={18} className="flex-shrink-0" />
        <span>{children}</span>
    </NavLink>
);

const Sidebar = ({ isOpen, setIsOpen }) => {
    const { t } = useTranslation();
    const { user, logout } = useAuth();
    const { startTour } = useAppTour();
    const navigate = useNavigate();
    const [showWalletModal, setShowWalletModal] = useState(false);
    const walletBalance = user?.tenant?.walletBalance ?? 0;

    const handleNavigation = (e, path) => {
        if (walletBalance <= 0 && path !== '/app/wallet' && path !== '/app/wallet/select-country' && path !== '/app/dashboard') {
            e.preventDefault();
            setShowWalletModal(true);
        }
    };

    return (
        <>
            {/* Overlay for mobile when sidebar is open */}
            {isOpen && (
                <div
                    className="fixed inset-0 z-30 bg-black/30 backdrop-blur-sm lg:hidden"
                    onClick={() => setIsOpen(false)}
                    aria-hidden="true"
                ></div>
            )}

            <aside
                className={`
                    fixed lg:static inset-y-0 left-0 z-40 flex flex-col
                    w-64 bg-apple-gray-50 dark:bg-apple-gray-900
                    border-r border-apple-gray-200 dark:border-apple-gray-800
                    transform transition-transform duration-300 ease-apple
                    ${isOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0
                    flex-shrink-0
                `}
                aria-label="Main sidebar"
            >
                <div className="flex items-center justify-between h-[60px] px-4 border-b border-apple-gray-200 dark:border-apple-gray-800">
                    <Link to="/" className="flex items-center space-x-2" onClick={() => isOpen && setIsOpen(false)}>
                        <Package size={24} className="text-apple-blue" />
                        <span className="text-xl font-bold text-apple-gray-800 dark:text-apple-gray-100">
                            Press<span className="text-apple-blue">Mark</span>
                        </span>
                    </Link>
                    <Button variant="ghost" size="sm" onClick={() => setIsOpen(false)} className="p-1 lg:hidden" aria-label={t('sidebar.closeSidebar')}>
                        <X size={20} />
                    </Button>
                </div>

                <nav className="flex-1 p-3 space-y-1.5 overflow-y-auto custom-scrollbar"> {/* Added custom-scrollbar if you defined it */}
                     <NavItem to="/app/dashboard" icon={LayoutDashboard} end={true}>{t('sidebar.navigation.dashboard')}</NavItem>
                    <NavItem to="/app/orders" icon={ClipboardList} onWalletZero={handleNavigation}>{t('sidebar.navigation.orders')}</NavItem>
                    <NavItem to="/app/orders/new" icon={PlusCircle} onWalletZero={handleNavigation}>{t('sidebar.navigation.newOrder')}</NavItem>
                    <NavItem to="/app/customers" icon={Users} onWalletZero={handleNavigation}>{t('sidebar.navigation.customers')}</NavItem>
                    <NavItem to="/app/wallet" icon={Zap}>{t('sidebar.navigation.wallet')}</NavItem>
                    <NavItem to="/app/payments" icon={CreditCard} onWalletZero={handleNavigation}>{t('sidebar.navigation.payments')}</NavItem>
                   {/* <NavItem to="/app/inbox" icon={Inbox} onWalletZero={handleNavigation}>{t('sidebar.navigation.inbox')}</NavItem>*/}

                    {(user?.role === 'admin' || user?.role === 'superadmin') && (
                        <>
                            <NavItem to="/app/business-profile" icon={Store} onWalletZero={handleNavigation}>
                                {t('sidebar.navigation.businessProfile')}
                            </NavItem>
                        </>
                    )}

                    {(user?.role === 'admin' || user?.role === 'superadmin') && (
                        <>
                            <div className="pt-4 pb-1 px-3"> {/* Added more top padding */}
                                <span className="text-xs font-semibold text-apple-gray-500 dark:text-apple-gray-400 uppercase tracking-wider">{t('sidebar.admin.title')}</span>
                            </div>
                             <NavItem to="/app/admin/pricing" icon={Tags} onWalletZero={handleNavigation}>{t('sidebar.admin.servicesPricing')}</NavItem>
                            <NavItem to="/app/admin/settings" icon={Settings} onWalletZero={handleNavigation}>{t('sidebar.admin.settings')}</NavItem>
                            <NavItem to="/app/admin/users" icon={KeyRound} onWalletZero={handleNavigation}>{t('sidebar.admin.manageStaff')}</NavItem>
                        </>
                    )}
                </nav>

                <div className="px-3 pb-2">
                    <div className="pt-3 pb-1 px-0">
                        <span className="text-xs font-semibold text-apple-gray-500 dark:text-apple-gray-400 uppercase tracking-wider">
                            {t('sidebar.help.title')}
                        </span>
                    </div>
                    <button
                        type="button"
                        onClick={() => {
                            startTour();
                            if (isOpen) setIsOpen(false);
                        }}
                        className="flex items-center w-full space-x-3 px-3 py-2.5 rounded-apple text-sm font-medium text-apple-gray-700 dark:text-apple-gray-300 hover:bg-apple-gray-200 dark:hover:bg-apple-gray-700/60 transition-colors"
                    >
                        <CirclePlay size={18} className="flex-shrink-0 text-apple-blue" />
                        <span>{t('sidebar.help.takeTour')}</span>
                    </button>
                    <a
                        href="/contact"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center w-full space-x-3 px-3 py-2.5 rounded-apple text-sm font-medium text-apple-gray-700 dark:text-apple-gray-300 hover:bg-apple-gray-200 dark:hover:bg-apple-gray-700/60 transition-colors"
                    >
                        <HelpCircle size={18} className="flex-shrink-0" />
                        <span>{t('sidebar.help.contactSupport')}</span>
                    </a>
                </div>

                <div className="p-4 border-t border-apple-gray-200 dark:border-apple-gray-800">
                     <button
                        onClick={logout}
                        className="flex items-center w-full space-x-3 px-3 py-2.5 rounded-apple text-sm font-medium text-apple-red hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                    >
                        <LogOut size={18} />
                        <span>Logout</span>
                    </button>
                    <p className="text-xs text-apple-gray-500 dark:text-apple-gray-400 text-center">
                        © {new Date().getFullYear()} PressMark
                    </p>
                </div>

                {/* Wallet Top Up Modal */}
                {showWalletModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                        <div className="bg-white dark:bg-apple-gray-800 rounded-apple shadow-apple-lg max-w-md w-full mx-4 p-6">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-3 rounded-full bg-amber-100 dark:bg-amber-900/30">
                                    <Zap size={24} className="text-amber-600 dark:text-amber-400" />
                                </div>
                                <h3 className="text-xl font-semibold text-apple-gray-900 dark:text-white">Top Up Wallet Required</h3>
                            </div>
                            <p className="text-sm text-apple-gray-600 dark:text-apple-gray-300 mb-6">
                                Your wallet balance is currently {WALLET_CURRENCY_SYMBOL}{walletBalance.toFixed(2)}. Please top up your wallet to access this feature.
                            </p>
                            <div className="flex justify-end gap-3">
                                <Button
                                    variant="secondary"
                                    onClick={() => setShowWalletModal(false)}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    variant="primary"
                                    onClick={() => {
                                        setShowWalletModal(false);
                                        navigate('/app/wallet/select-country');
                                    }}
                                    iconLeft={<Zap size={16} />}
                                >
                                    Top Up Wallet
                                </Button>
                            </div>
                        </div>
                    </div>
                )}
            </aside>
        </>
    );
};

export default Sidebar;