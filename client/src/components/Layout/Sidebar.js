// client/src/components/Layout/Sidebar.js
import React from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
    LayoutDashboard,
    PlusCircle,
    ClipboardList,
    Users,      // Using Users icon for "Customers" link
    Settings,   // For Admin settings
    CreditCard, // This was for a placeholder "Payments" link, remove if not used
    X,
    KeyRound,
    Tags,
    LogOut,
    Zap,
    Store,
    HelpCircle,
    CirclePlay,
    Lock,
} from 'lucide-react';
import { useAppTour } from '../../contexts/AppTourContext';
import { useAuth } from '../../contexts/AuthContext';
import { useWalletGuard } from '../../contexts/WalletGuardContext';
import { WALLET_CURRENCY_SYMBOL } from '../../utils/onboarding';
import Button from '../UI/Button';

// NavItem component. When `locked`, clicking opens the wallet-refill block
// (via guardClick) instead of navigating.
const NavItem = ({ to, icon: Icon, children, end = false, locked = false, guardClick }) => (
    <NavLink
        to={to}
        end={end}
        onClick={(e) => { if (locked && guardClick) guardClick(e); }}
        className={({ isActive }) =>
            `group flex items-center justify-between px-3 py-2.5 rounded-apple text-sm font-medium
            transition-colors duration-150 ease-apple
            ${isActive && !locked
                ? 'bg-apple-blue text-white shadow-apple-sm'
                : 'text-apple-gray-700 dark:text-apple-gray-300 hover:bg-apple-gray-200 dark:hover:bg-apple-gray-700/60'
            }`
        }
    >
        <span className="flex items-center space-x-3">
            <Icon size={18} className="flex-shrink-0" />
            <span>{children}</span>
        </span>
        {locked && <Lock size={13} className="flex-shrink-0 text-apple-gray-400 dark:text-apple-gray-500" />}
    </NavLink>
);

const Sidebar = ({ isOpen, setIsOpen }) => {
    const { t } = useTranslation();
    const { user, logout } = useAuth();
    const { startTour } = useAppTour();
    const { walletFunded, guardClick } = useWalletGuard();
    const navigate = useNavigate();
    const locked = !walletFunded;

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
                    <Link to="/app/dashboard" className="flex items-center space-x-2" onClick={() => isOpen && setIsOpen(false)}>
                        <img src="/logo.png" alt="PressMark" className="h-7 w-7 rounded-md object-contain" />
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
                    <NavItem to="/app/orders" icon={ClipboardList} locked={locked} guardClick={guardClick}>{t('sidebar.navigation.orders')}</NavItem>
                    <NavItem to="/app/orders/new" icon={PlusCircle} locked={locked} guardClick={guardClick}>{t('sidebar.navigation.newOrder')}</NavItem>
                    <NavItem to="/app/customers" icon={Users} locked={locked} guardClick={guardClick}>{t('sidebar.navigation.customers')}</NavItem>
                    <NavItem to={locked ? '/app/wallet/select-country' : '/app/wallet'} icon={Zap}>{t('sidebar.navigation.wallet')}</NavItem>
                    <NavItem to="/app/payments" icon={CreditCard} locked={locked} guardClick={guardClick}>{t('sidebar.navigation.payments')}</NavItem>
                   {/* <NavItem to="/app/inbox" icon={Inbox} locked={locked} guardClick={guardClick}>{t('sidebar.navigation.inbox')}</NavItem>*/}

                    {(user?.role === 'admin' || user?.role === 'superadmin') && (
                        <>
                            <NavItem to="/app/business-profile" icon={Store} locked={locked} guardClick={guardClick}>
                                {t('sidebar.navigation.businessProfile')}
                            </NavItem>
                        </>
                    )}

                    {/* Admin-specific section */}
                    <div className="border-t border-apple-gray-200 dark:border-apple-gray-800 pt-4 mt-4 px-3">
                        <p className="text-xs uppercase tracking-wide font-semibold text-apple-gray-500 dark:text-apple-gray-400 mb-2">Wallet balance</p>
                        <div className={`rounded-apple border p-3 ${locked
                            ? 'border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950/30'
                            : 'border-apple-gray-200 dark:border-apple-gray-800 bg-white dark:bg-apple-gray-950'}`}>
                            <p className="text-xs text-apple-gray-500 dark:text-apple-gray-400">Available</p>
                            <p className={`text-lg font-semibold ${locked ? 'text-amber-700 dark:text-amber-300' : 'text-apple-gray-900 dark:text-white'}`}>
                                {WALLET_CURRENCY_SYMBOL}{Number(user?.tenant?.walletBalance ?? 0).toFixed(2)}
                            </p>
                            {locked && (
                                <>
                                    <p className="mt-1 text-[11px] leading-4 text-amber-700/80 dark:text-amber-300/80">
                                        Refill your account to unlock every feature.
                                    </p>
                                    <Button
                                        variant="primary"
                                        size="sm"
                                        className="mt-2 w-full"
                                        iconLeft={<Zap size={14} />}
                                        onClick={() => { if (isOpen) setIsOpen(false); navigate('/app/wallet/select-country'); }}
                                    >
                                        Refill wallet
                                    </Button>
                                </>
                            )}
                        </div>
                    </div>

                    {(user?.role === 'admin' || user?.role === 'superadmin') && (
                        <>
                            <div className="pt-4 pb-1 px-3"> {/* Added more top padding */}
                                <span className="text-xs font-semibold text-apple-gray-500 dark:text-apple-gray-400 uppercase tracking-wider">{t('sidebar.admin.title')}</span>
                            </div>
                             <NavItem to="/app/admin/pricing" icon={Tags} locked={locked} guardClick={guardClick}>{t('sidebar.admin.servicesPricing')}</NavItem>
                            <NavItem to="/app/admin/settings" icon={Settings} locked={locked} guardClick={guardClick}>{t('sidebar.admin.settings')}</NavItem>
                            <NavItem to="/app/admin/users" icon={KeyRound} locked={locked} guardClick={guardClick}>{t('sidebar.admin.manageStaff')}</NavItem>
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
            </aside>
        </>
    );
};

export default Sidebar;