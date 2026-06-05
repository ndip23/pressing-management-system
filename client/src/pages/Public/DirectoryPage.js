import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useLocalization } from '../../contexts/LocalizationContext';
import { COUNTRY_NAMES } from '../../utils/currencyMap';
import { getPublicDirectoryApi, contactBusinessViaWhatsAppApi } from '../../services/api';
import Spinner from '../../components/UI/Spinner';
import Input from '../../components/UI/Input';
import Button from '../../components/UI/Button';
import { MapPin, Search, Aperture, Phone, ChevronLeft, ChevronRight } from 'lucide-react';

// --- ✅ UPGRADED i18n BusinessCard Component ---
const BusinessCard = ({ business }) => {
  const { t } = useTranslation();

  const bannerUrl =
    business.bannerUrl ||
    'https://images.unsplash.com/photo-1582735689369-7fe275765448?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080';

  const logoUrl = business.logoUrl;
  const displayCountry = business.country || COUNTRY_NAMES[business.countryCode] || business.countryCode || ' ';

  const handleWhatsAppContact = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!business.publicPhone) return;

    try {
      const { data } = await contactBusinessViaWhatsAppApi(business.slug, t('directoryPage.businessCard.whatsappMessage', { name: business.name }));
      if (data?.whatsappUrl) {
        window.open(data.whatsappUrl, '_blank');
      } else {
        throw new Error('Unable to build WhatsApp link at this time.');
      }
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'Unable to contact this business.';
      window.alert(message);
    }
  };

  return (
    <div className="group bg-white dark:bg-apple-gray-900 rounded-2xl shadow-apple-md border border-apple-gray-100 dark:border-apple-gray-800 overflow-hidden transition-all duration-300 hover:shadow-apple-xl hover:-translate-y-1.5 hover:border-apple-blue/30 flex flex-col">
      {/* Banner */}
      <div className="relative h-28">
        <div
          className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-105"
          style={{ backgroundImage: `url(${bannerUrl})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />

        {/* Logo */}
        <div className="absolute -bottom-8 left-5 w-16 h-16 rounded-2xl bg-white dark:bg-apple-gray-800 ring-4 ring-white dark:ring-apple-gray-900 shadow-apple-md flex items-center justify-center overflow-hidden">
          {logoUrl ? (
            <img src={logoUrl} alt={business.name} className="w-full h-full object-cover" />
          ) : (
            <span className="text-2xl font-bold text-apple-blue">
              {business.name?.charAt(0).toUpperCase()}
            </span>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="px-5 pt-11 pb-5 flex-grow flex flex-col">
        <h3 className="font-bold text-lg text-apple-gray-900 dark:text-white truncate">{business.name}</h3>

        <div className="flex items-center mt-1 text-xs text-apple-gray-500 dark:text-apple-gray-400">
          <MapPin size={13} className="mr-1.5 flex-shrink-0" />
          <span className="truncate">
            {business.city || t('directoryPage.businessCard.noLocation')}
            {displayCountry && `, ${displayCountry}`}
          </span>
        </div>

        <p className="mt-3 text-sm text-apple-gray-600 dark:text-apple-gray-300 line-clamp-2 flex-grow min-h-[2.5rem]">
          {business.description || t('directoryPage.businessCard.defaultDescription')}
        </p>

        <div className="mt-5 flex items-center gap-3">
          <Link to={`/directory/${business.slug}`} className="flex-1">
            <Button variant="secondary" className="w-full">
              {t('directoryPage.businessCard.viewDetails')}
            </Button>
          </Link>

          <Button
            onClick={handleWhatsAppContact}
            className="flex-1"
            variant="primary"
            iconLeft={<Phone size={16} />}
            disabled={!business.publicPhone}
          >
            {t('directoryPage.businessCard.contact')}
          </Button>
        </div>
      </div>
    </div>
  );
};

// --- ✅ FULL i18n MAIN DIRECTORY PAGE ---
const shuffleArray = (items) => items.slice().sort(() => Math.random() - 0.5);

const DirectoryPage = () => {
  const { t } = useTranslation();
  const { location } = useLocalization();

  const [businesses, setBusinesses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [cityInput, setCityInput] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [cityFilter, setCityFilter] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 9,
    total: 0,
    totalPages: 1,
    hasNextPage: false,
    hasPrevPage: false,
  });

  const localCountryCode = location?.country || '';
  const localCountryName = COUNTRY_NAMES[localCountryCode] || localCountryCode;
  const isShowingLocalDirectory = !searchTerm && !cityFilter && Boolean(localCountryCode);

  useEffect(() => {
    const loadBusinesses = async () => {
      setLoading(true);
      setError('');

      try {
        const filters = {
          page,
          pageSize: pagination.pageSize,
        };

        if (searchTerm) filters.search = searchTerm;
        if (cityFilter) filters.city = cityFilter;
        if (!searchTerm && !cityFilter && localCountryCode) filters.country = localCountryCode;

        const { data } = await getPublicDirectoryApi(filters);
        setBusinesses(shuffleArray(data?.items || []));
        setPagination(data?.pagination || {
          page: 1,
          pageSize: 9,
          total: 0,
          totalPages: 1,
          hasNextPage: false,
          hasPrevPage: false,
        });
      } catch (err) {
        setError(t('directoryPage.states.error'));
      } finally {
        setLoading(false);
      }
    };

    loadBusinesses();
  }, [searchTerm, cityFilter, page, pagination.pageSize, localCountryCode, t]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    setSearchTerm(searchInput.trim());
    setCityFilter(cityInput.trim());
  };

  const handleClearFilters = () => {
    setSearchInput('');
    setCityInput('');
    setSearchTerm('');
    setCityFilter('');
    setPage(1);
  };

  return (
    <>
      {/* HERO SECTION */}
      <section className="relative overflow-hidden bg-gradient-to-br from-apple-blue to-sky-600 text-white">
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <div className="absolute -top-20 -left-16 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute bottom-0 right-0 h-72 w-72 rounded-full bg-sky-300/20 blur-3xl" />
        </div>

        <div className="relative container mx-auto px-6 py-16 md:py-24 text-center">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
            {t('directoryPage.hero.title')}
          </h1>

          <p className="mt-4 text-lg text-sky-100 max-w-2xl mx-auto">
            {t('directoryPage.hero.subtitle')}
          </p>

          {/* Search card */}
          <form
            onSubmit={handleSearchSubmit}
            className="mt-9 max-w-4xl mx-auto bg-white dark:bg-apple-gray-900 p-3 sm:p-4 rounded-2xl shadow-apple-xl grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_auto_auto] gap-3 text-left"
          >
            <Input
              id="search"
              placeholder={t('directoryPage.search.businessPlaceholder')}
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              prefixIcon={<Search size={18} />}
            />

            <Input
              id="city"
              placeholder={t('directoryPage.search.cityPlaceholder')}
              value={cityInput}
              onChange={(e) => setCityInput(e.target.value)}
              prefixIcon={<MapPin size={18} />}
            />

            <Button type="submit" variant="primary" className="w-full sm:w-auto px-8" iconLeft={<Search size={16} />}>
              {t('directoryPage.search.searchButton', 'Search')}
            </Button>

            <Button type="button" variant="secondary" className="w-full sm:w-auto" onClick={handleClearFilters}>
              {t('directoryPage.search.clearButton', 'Clear')}
            </Button>
          </form>
        </div>
      </section>

      {/* LISTING SECTION */}
      <section className="py-12 md:py-16">
        <div className="container mx-auto px-6">
          {loading ? (
            <div className="flex justify-center h-40">
              <Spinner size="lg" />
            </div>
          ) : error ? (
            <p className="text-center text-red-500 py-12">{error}</p>
          ) : businesses.length === 0 ? (
            <div className="text-center py-16 max-w-md mx-auto">
              <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-apple-blue/10 text-apple-blue">
                <Aperture size={32} />
              </div>
              <h3 className="text-xl font-semibold text-apple-gray-900 dark:text-white">
                {t('directoryPage.states.emptyTitle')}
              </h3>
              <p className="mt-2 text-apple-gray-500 dark:text-apple-gray-400">
                {t('directoryPage.states.emptySubtitle')}
              </p>
              <Button type="button" variant="secondary" className="mt-6" onClick={handleClearFilters}>
                {t('directoryPage.search.clearButton', 'Clear')}
              </Button>
            </div>
          ) : (
            <>
              {isShowingLocalDirectory && (
                <div className="mb-4 rounded-lg border border-apple-gray-200 bg-apple-gray-50 p-4 text-sm text-apple-gray-700 dark:border-apple-gray-700 dark:bg-apple-gray-900 dark:text-apple-gray-200">
                  {`Showing local businesses in ${localCountryName}. Use search or city filters to expand beyond your country.`}
                </div>
              )}
              <div className="flex items-center justify-between gap-4 mb-6">
                <p className="text-sm text-apple-gray-500 dark:text-apple-gray-400">
                  Showing {businesses.length} of {pagination.total} businesses
                </p>
                <p className="text-sm text-apple-gray-500 dark:text-apple-gray-400">
                  Page {pagination.page} of {pagination.totalPages}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {businesses.map((business) => (
                  <BusinessCard key={business._id || business.slug} business={business} />
                ))}
              </div>

              <div className="mt-10 flex items-center justify-center gap-3">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                  disabled={!pagination.hasPrevPage || loading}
                  iconLeft={<ChevronLeft size={16} />}
                >
                  {t('directoryPage.pagination.previous', 'Previous')}
                </Button>

                <span className="text-sm text-apple-gray-600 dark:text-apple-gray-300">
                  {pagination.page} / {pagination.totalPages}
                </span>

                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setPage((prev) => prev + 1)}
                  disabled={!pagination.hasNextPage || loading}
                  iconRight={<ChevronRight size={16} />}
                >
                  {t('directoryPage.pagination.next', 'Next')}
                </Button>
              </div>
            </>
          )}
        </div>
      </section>
    </>
  );
};

export default DirectoryPage;
