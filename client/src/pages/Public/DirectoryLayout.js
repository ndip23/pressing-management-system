import React from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

// --- Helper to point to the SaaS URL ---
const getSaasUrl = (path = '') => {
    // If you are on production, use the subdomain
    if (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
        return `https://sys.pressmark.site${path}`;
    }
    
    // ✅ FIX: Remove the '/#' prefix. If using BrowserRouter, you don't need it!
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    return cleanPath; 
};

export const DirectoryHeader = () => {
    const { t } = useTranslation();
    const location = useLocation();

    const getLinkClass = (path) => {
        const baseClass = "text-sm font-medium hover:text-apple-blue dark:hover:text-sky-300 transition-colors";
        const activeClass = "text-apple-blue dark:text-sky-400 font-semibold";
        const isActive = path === '/directory' ? location.pathname === path || location.pathname === "/" : location.pathname.startsWith(path);
        return `${baseClass} ${isActive ? activeClass : 'text-apple-gray-600 dark:text-apple-gray-300'}`;
    };

    return (
        <header className="sticky top-0 bg-white/80 dark:bg-apple-gray-900/80 backdrop-blur-md z-50 shadow-apple-sm">
            <nav className="container mx-auto px-6 py-4 flex justify-between items-center">
                <Link to="/directory" className="flex items-center space-x-2">
                    <svg className="h-8 w-8 text-apple-blue" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                    <span className="text-xl font-bold text-apple-gray-800 dark:text-apple-gray-100">{t("directory.brand")}</span>
                </Link>

                <div className="hidden md:flex space-x-8 items-center">
                    <Link to="/directory" className={getLinkClass('/directory')}>{t("directory.nav.findService")}</Link>
                    
                    {/* External Link using Helper */}
                    <a href={getSaasUrl('/')} className="text-sm font-medium text-apple-gray-600 hover:text-apple-blue transition-colors">
                        {t("directory.nav.getSoftware")}
                    </a>
                </div>
            </nav>
        </header>
    );
};

export const DirectoryFooter = () => {
    const { t } = useTranslation();
    return (
        <footer className="bg-apple-blue text-white">
            <div className="container mx-auto px-6 py-12">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center md:text-left">
                    <div>
                        <h4 className="font-bold text-lg mb-3">{t("directory.footer.aboutTitle")}</h4>
                        <p className="text-sm text-sky-200 leading-relaxed">{t("directory.footer.aboutText")}</p>
                    </div>

                    <div className="md:mx-auto">
                        <h4 className="font-bold text-lg mb-3">{t("directory.footer.quickLinks")}</h4>
                        <ul className="space-y-2 text-sm">
                            <li><Link to="/directory" className="text-sky-200 hover:text-white hover:underline">{t("directory.footer.searchDirectory")}</Link></li>
                            <li><a href={getSaasUrl('/signup')} className="text-sky-200 hover:text-white hover:underline">{t("directory.footer.getSoftware")}</a></li>
                            <li><a href={getSaasUrl('/features')} className="text-sky-200 hover:text-white hover:underline">{t("directory.footer.features")}</a></li>
                        </ul>
                    </div>

                    <div className="md:text-right">
                        <h4 className="font-bold text-lg mb-3">{t("directory.footer.resources")}</h4>
                        <ul className="space-y-2 text-sm">
                            <li><a href={getSaasUrl('/privacy')} className="text-sky-200 hover:text-white hover:underline">{t("directory.footer.privacy")}</a></li>
                            <li><a href={getSaasUrl('/terms')} className="text-sky-200 hover:text-white hover:underline">{t("directory.footer.terms")}</a></li>
                            <li><a href={getSaasUrl('/contact')} className="text-sky-200 hover:text-white hover:underline">{t("directory.footer.contact")}</a></li>
                        </ul>
                    </div>
                </div>
                <div className="mt-10 pt-6 border-t border-sky-700 text-center text-xs text-sky-300">
                    <p>&copy; {new Date().getFullYear()} PressMark. {t("directory.footer.rights")}</p>
                    {/* Admin portal stays local */}
                    <Link to="/directory-admin/login" className="mt-2 inline-block hover:text-white hover:underline">
                        {t("directory.footer.adminPortal")}
                    </Link>
                </div>
            </div>
        </footer>
    );
};

const DirectoryLayout = () => {
    return (
        <div className="bg-apple-gray-100 dark:bg-apple-gray-950 min-h-screen flex flex-col">
            <DirectoryHeader />
            <main className="flex-grow">
                <Outlet />
            </main>
            <DirectoryFooter />
        </div>
    );
};

export default DirectoryLayout;