// client/src/pages/Public/PublicLayout.js
import React, { useState } from 'react';
import { Link, Outlet } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import { Menu, X } from 'lucide-react';
import Button from '../../components/UI/Button';
import LanguageSwitcher from '../../components/UI/LanguageSwitcher';
import UserMenu from '../../components/UI/UserMenu';
import ThemeToggle from '../../components/UI/ThemeToggle';

// --- Reusable Public Header Component ---
export const PublicHeader = () => {
    const { t } = useTranslation();
    const { isAuthenticated } = useAuth();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isAnimating, setIsAnimating] = useState(false);
    const [shouldShowMenu, setShouldShowMenu] = useState(false);

    const closeMobileMenu = () => {
        setIsAnimating(true);
        setTimeout(() => {
            setShouldShowMenu(false);
            setIsMobileMenuOpen(false);
            setIsAnimating(false);
        }, 300);
    };

    const openMobileMenu = () => {
        setIsMobileMenuOpen(true);
        setShouldShowMenu(true);
        // Start with menu off-screen, then animate in
        setTimeout(() => {
            setIsAnimating(false);
        }, 10);
        setIsAnimating(true); // This will be false after timeout, creating slide-in effect
    };
    
    return (
        <>
            <header className="sticky top-0 bg-white/80 dark:bg-apple-gray-900/80 backdrop-blur-md z-50 shadow-apple-sm">
                <nav className="container mx-auto px-6 py-4 flex justify-between items-center">
                    <Link to="/directory" className="flex items-center space-x-2">
                    <img src="/logo.png" alt="PressFlow Logo" className="h-8 w-auto" />
                    <span className="text-xl font-bold text-apple-gray-800 dark:text-apple-gray-100">PressFlow</span>
                </Link>
                    
                    {/* Desktop Navigation */}
                    <div className="hidden md:flex space-x-6 items-center">
                       {/* <Link to="/directory" className="text-sm font-medium hover:text-apple-blue transition-colors dark:text-white">{t('public.header.home')}</Link>*/}
                       < Link to="/add-your-buisness" className="text-sm font-medium hover:text-apple-blue transition-colors dark:text-white">{t('public.header.add')}</Link>
                        <Link to="/features" className="text-sm font-medium hover:text-apple-blue transition-colors dark:text-white">{t('public.header.features')}</Link>
                        <Link to="/demo" className="text-sm font-medium hover:text-apple-blue transition-colors dark:text-white">Demo</Link>
                        <Link to="/pricing" className="text-sm font-medium hover:text-apple-blue transition-colors dark:text-white">{t('public.header.pricing')}</Link>
                    </div>
                    
                    {/* Desktop Auth & Language */}
                    <div className="hidden md:flex space-x-4 items-center">
                        <LanguageSwitcher />
                        <ThemeToggle />
                        {!isAuthenticated ? (
                            // Not authenticated - show login/signup buttons
                            <>
                                <Link to="/login" className="text-sm font-medium hover:text-apple-blue transition-colors dark:text-white">
                                    {t('public.header.login')}
                                </Link>
                                <Link to="/pricing">
                                    <Button variant="primary" size="md">{t('public.header.getStarted')}</Button>
                                </Link>
                            </>
                        ) : (
                            // Authenticated - show user menu
                            <UserMenu />
                        )}
                    </div>

                    {/* Mobile Hamburger Button */}
                    <button
                        onClick={() => isMobileMenuOpen ? closeMobileMenu() : openMobileMenu()}
                        className="md:hidden flex items-center justify-center w-10 h-10 rounded-lg hover:bg-apple-gray-100 dark:hover:bg-apple-gray-800 transition-colors"
                        aria-label="Toggle mobile menu"
                    >
                        {isMobileMenuOpen ? (
                            <X size={24} className="text-apple-gray-700 dark:text-apple-gray-300" />
                        ) : (
                            <Menu size={24} className="text-apple-gray-700 dark:text-apple-gray-300" />
                        )}
                    </button>
                </nav>
            </header>

            {/* Mobile Menu Overlay */}
            {shouldShowMenu && (
                <div className="fixed inset-0 z-40 md:hidden">
                    {/* Backdrop with fade animation */}
                    <div 
                        className={`fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-300 ease-out ${
                            isAnimating ? 'opacity-0' : 'opacity-100'
                        }`}
                        onClick={closeMobileMenu}
                    />
                    
                    {/* Mobile Menu with slide animation */}
                    <div className={`fixed top-[73px] right-0 w-80 max-w-[90vw] h-[calc(100vh-73px)] bg-white dark:bg-apple-gray-900 shadow-xl border-l border-apple-gray-200 dark:border-apple-gray-800 transform transition-transform duration-300 ease-out ${
                        isAnimating ? 'translate-x-full' : 'translate-x-0'
                    }`}>
                        <div className="flex flex-col h-full">
                            {/* Navigation Links */}
                            <div className="flex-1 px-6 py-6 space-y-4">
                                <Link 
                                    to="/directory" 
                                    className="block px-4 py-3 text-lg font-medium text-apple-gray-700 dark:text-apple-gray-300 hover:text-apple-blue hover:bg-apple-gray-50 dark:hover:bg-apple-gray-800 rounded-lg transition-all"
                                    onClick={closeMobileMenu}
                                >
                                    {t('public.header.home')}
                                </Link>
                                <Link 
                                    to="/features" 
                                    className="block px-4 py-3 text-lg font-medium text-apple-gray-700 dark:text-apple-gray-300 hover:text-apple-blue hover:bg-apple-gray-50 dark:hover:bg-apple-gray-800 rounded-lg transition-all"
                                    onClick={closeMobileMenu}
                                >
                                    {t('public.header.features')}
                                </Link>
                                <Link 
                                    to="/pricing" 
                                    className="block px-4 py-3 text-lg font-medium text-apple-gray-700 dark:text-apple-gray-300 hover:text-apple-blue hover:bg-apple-gray-50 dark:hover:bg-apple-gray-800 rounded-lg transition-all"
                                    onClick={closeMobileMenu}
                                >
                                    {t('public.header.pricing')}
                                </Link>
                                
                                {/* Language Switcher in Mobile Menu */}
                                <div className="px-4 py-3">
                                    <div className="text-sm font-medium text-apple-gray-500 dark:text-apple-gray-400 mb-3">
                                        Language / Langue
                                    </div>
                                    <div className="flex items-center space-x-3">
                                        <LanguageSwitcher />
                                        <ThemeToggle />
                                    </div>
                                </div>
                            </div>
                            
                            {/* Auth Buttons at Bottom */}
                            <div className="px-6 py-6 border-t border-apple-gray-200 dark:border-apple-gray-800 space-y-3">
                                {!isAuthenticated ? (
                                    // Not authenticated - show login/signup buttons
                                    <>
                                        <Link 
                                            to="/login" 
                                            className="block w-full"
                                            onClick={closeMobileMenu}
                                        >
                                            <Button variant="secondary" size="lg" className="w-full justify-center">
                                                {t('public.header.login')}
                                            </Button>
                                        </Link>
                                        <Link 
                                            to="/signup" 
                                            className="block w-full"
                                            onClick={closeMobileMenu}
                                        >
                                            <Button variant="primary" size="lg" className="w-full justify-center">
                                                {t('public.header.getStarted')}
                                            </Button>
                                        </Link>
                                    </>
                                ) : (
                                    // Authenticated - show user menu options
                                    <UserMenu 
                                        variant="compact"
                                        onMenuClose={closeMobileMenu}
                                    />
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

// --- Reusable Public Footer Component ---
export const PublicFooter = () => {
    const { t } = useTranslation();
    
    return (
        <footer className="bg-apple-gray-100 dark:bg-black/20">
            <div className="container mx-auto px-6 py-8 text-center text-sm text-apple-gray-500 dark:text-apple-gray-400">
                <p>&copy; {new Date().getFullYear()} PressMark. {t('public.footer.allRightsReserved')}</p>
                <div className="mt-4 space-x-6">
                    <Link to="/privacy" className="hover:text-apple-blue">{t('public.footer.privacyPolicy')}</Link>
                    <Link to="/terms" className="hover:text-apple-blue">{t('public.footer.termsOfService')}</Link>
                    <Link to="/contact" className="hover:text-apple-blue">{t('public.footer.contact')}</Link>
                </div>
            </div>
        </footer>
    );
};


// --- Main Layout Component ---
const PublicLayout = () => {
    return (
        <div className="bg-apple-gray-50 dark:bg-apple-gray-950 min-h-screen flex flex-col">
            <PublicHeader />
            <main className="flex-grow">
                <Outlet /> {/* This is where the specific page content will be rendered */}
            </main>
            <PublicFooter />
        </div>
    );
};

export default PublicLayout;