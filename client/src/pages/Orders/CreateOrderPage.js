// client/src/pages/Orders/CreateOrderPage.js
import React from 'react';
import { useTranslation } from 'react-i18next';
import CreateOrderForm from '../../components/Orders/CreateOrderForm'; // Path might need adjustment
import Card from '../../components/UI/Card';
import { Link } // Keep Link if you have a back button here
    from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

const CreateOrderPage = () => {
    const { t } = useTranslation();
    
    return (
        <div className="space-y-6">
             <div className="flex items-center justify-between mb-6"> {/* Added mb-6 */}
                <div className="flex items-center space-x-2">
                     <Link to="/" className="text-apple-gray-500 hover:text-apple-blue p-1.5 rounded-full hover:bg-apple-gray-100 dark:hover:bg-apple-gray-800">
                        <ArrowLeft size={20} />
                    </Link>
                    <h1 className="text-2xl sm:text-3xl font-semibold text-apple-gray-800 dark:text-apple-gray-100">
                        {t('createOrder.title')}
                    </h1>
                </div>
            </div>
            <Card contentClassName="p-4 sm:p-6 md:p-8"> {/* Added more padding to card content */}
                <CreateOrderForm /> {/* isEditMode is false by default */}
            </Card>
        </div>
    );
};

export default CreateOrderPage;