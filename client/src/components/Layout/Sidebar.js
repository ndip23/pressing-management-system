// client/src/components/Layout/Sidebar.js
import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import {
    LayoutDashboard, PlusCircle, Users, Settings, Package, CreditCard, KeyRound, X
} from 'lucide-react'; // Added KeyRound for example
import { useAuth } from '../../contexts/AuthContext';
import Button from '../UI/Button';

const NavItem = ({ to, icon: Icon, children, end = false, disabled = false }) => (
    <NavLink
        to={to}
        end={end}
        onClick={(e) => disabled && e.preventDefault()}
        className={({ isActive }) =>
            `flex items-center space-x-3 px-3 py-2.5 rounded-apple text-sm font-medium 
            transition-colors duration-150 ease-apple
            ${disabled
                ? 'text-apple-gray-400 dark:text-apple-gray-600 cursor-not-allowed opacity-70'
                : isActive
                    ? 'bg-apple-blue text-white shadow-apple-sm'
                    : 'text-apple-gray-700 dark:text-apple-gray-300 hover:bg-apple-gray-200 dark:hover:bg-apple-gray-700/60'
            }`
        }
        aria-disabled={disabled}
        tabIndex={disabled ? -1 : undefined}
    >
        {Icon && <Icon size={18} className="flex-shrink-0" />}
        <span>{children}</span>
    </NavLink>
);

const Sidebar = ({ isOpen, setIsOpen }) => {
    const { user } = useAuth(); // Get user to check role

    return (
        <>
            {isOpen && (<div className="fixed inset-0 z-30 bg-black/30 lg:hidden" onClick={() => setIsOpen(false)}></div>)}
            <aside className={`fixed lg:static inset-y-0 left-0 z-40 flex flex-col w-64 bg-apple-gray-50 dark:bg-apple-gray-900 border-r border-apple-gray-200 dark:border-apple-gray-800 transform transition-transform duration-300 ease-apple ${isOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 flex-shrink-0`}>
                <div className="flex items-center justify-between h-[60px] px-4 border-b border-apple-gray-200 dark:border-apple-gray-800">
                    <Link to="/" className="flex items-center space-x-2">
                        <Package size={24} className="text-apple-blue" />
                        <span className="text-xl font-bold text-apple-gray-800 dark:text-apple-gray-100">Press<span className="text-apple-blue">Flow</span></span>
                    </Link>
                    <Button variant="ghost" size="sm" onClick={() => setIsOpen(false)} className="p-1 lg:hidden"><X size={20} /></Button>
                </div>

                <nav className="flex-1 p-3 space-y-1.5 overflow-y-auto">
                    {/* Links accessible to both Admin and Staff */}
                    <NavItem to="/" icon={LayoutDashboard} end={true}>Dashboard</NavItem>
                    <NavItem to="/orders/new" icon={PlusCircle}>New Order</NavItem>
                    <NavItem to="/customers" icon={Users}>Customers</NavItem>
                    {/* <NavItem to="/payments" icon={CreditCard} disabled={true}>Payments (Soon)</NavItem> */}


                    {/* Admin-Specific Links */}
                    {user?.role === 'admin' && (
                        <>
                            <div className="pt-4 pb-1 px-3"> {/* Added more top padding */}
                                <span className="text-xs font-semibold text-apple-gray-500 dark:text-apple-gray-400 uppercase tracking-wider">Admin Area</span>
                            </div>
                            <NavItem to="/admin/settings" icon={Settings}>Settings</NavItem>
                            {/* Example: If you build a UI for managing admin/staff accounts later */}
                            {/* <NavItem to="/admin/manage-logins" icon={KeyRound}>Manage Logins</NavItem> */}
                        </>
                    )}
                </nav>

                <div className="p-4 border-t border-apple-gray-200 dark:border-apple-gray-800">
                    <p className="text-xs text-apple-gray-500 dark:text-apple-gray-400 text-center">© {new Date().getFullYear()} PressFlow</p>
                </div>
            </aside>
        </>
    );
};
export default Sidebar;