// client/src/pages/Messaging/InboxPage.js
import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { fetchInboundMessagesApi } from '../../services/api';
import Card from '../../components/UI/Card';
import Button from '../../components/UI/Button';
import Spinner from '../../components/UI/Spinner';
import { Inbox, MessageSquare, AlertTriangle, RefreshCw } from 'lucide-react';
import { format, formatDistanceToNowStrict } from 'date-fns';

const MessageItem = ({ message }) => (
    <li className="p-4 border-b border-apple-gray-200 dark:border-apple-gray-700 last:border-b-0 hover:bg-apple-gray-50 dark:hover:bg-apple-gray-800/50 transition-colors">
        <div className="flex justify-between items-start">
            <div className="flex-1">
                <div className="flex items-center space-x-2">
                    <span className="font-semibold text-apple-gray-800 dark:text-apple-gray-100">
                        {/* If customer is linked, show name, else show formatted phone */}
                        {message.customerId?.name || message.from.replace('whatsapp:', '')}
                    </span>
                    {message.customerId && <span className="text-xs text-apple-gray-400 dark:text-apple-gray-500">({message.from.replace('whatsapp:', '')})</span>}
                </div>
                <p className="mt-1 text-sm text-apple-gray-700 dark:text-apple-gray-300 whitespace-pre-wrap">{message.body}</p>
            </div>
            <div className="text-right ml-4 flex-shrink-0">
                <p className="text-xs text-apple-gray-500 dark:text-apple-gray-400" title={format(new Date(message.createdAt), 'MMM d, yyyy, h:mm a')}>
                    {formatDistanceToNowStrict(new Date(message.createdAt), { addSuffix: true })}
                </p>
                {/* You can add a 'Reply' button here in the future */}
                {/* <Button variant="ghost" size="sm" className="mt-1">Reply</Button> */}
            </div>
        </div>
    </li>
);


const InboxPage = () => {
    const [messages, setMessages] = useState([]);
    const [pagination, setPagination] = useState({ page: 1, pages: 1, totalMessages: 0 });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const loadMessages = useCallback(async (page = 1) => {
        setLoading(true);
        setError('');
        try {
            const { data } = await fetchInboundMessagesApi(page);
            setMessages(data.messages || []);
            setPagination({
                page: data.page,
                pages: data.pages,
                totalMessages: data.totalMessages,
            });
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to fetch messages.');
            console.error("Fetch Inbox Error:", err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadMessages(1); // Load first page on mount
    }, [loadMessages]);

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex items-center space-x-3">
                    <Inbox size={28} className="text-apple-blue" />
                    <h1 className="text-2xl sm:text-3xl font-semibold">Customer Messages</h1>
                </div>
                <Button variant="secondary" onClick={() => loadMessages(pagination.page)} isLoading={loading} iconLeft={<RefreshCw size={16} />}>
                    Refresh
                </Button>
            </div>

            {error && (
                <div className="p-3 my-4 text-sm bg-red-100 text-apple-red rounded-apple flex items-center">
                    <AlertTriangle size={18} className="mr-2"/>{error}
                </div>
            )}

            <Card contentClassName="p-0">
                {loading && messages.length === 0 ? (
                    <div className="flex justify-center items-center h-64"><Spinner size="lg" /></div>
                ) : messages.length === 0 ? (
                    <div className="p-8 text-center text-apple-gray-500 dark:text-apple-gray-400">
                        <MessageSquare size={48} className="mx-auto mb-4" />
                        <h3 className="font-semibold text-lg">Your inbox is empty.</h3>
                        <p className="text-sm mt-1">When customers message your business number, their messages will appear here.</p>
                    </div>
                ) : (
                    <ul>
                        {messages.map(message => (
                            <MessageItem key={message._id} message={message} />
                        ))}
                    </ul>
                )}
                 {/* Pagination Controls */}
                {pagination.pages > 1 && (
                    <div className="p-4 border-t border-apple-gray-200 dark:border-apple-gray-700 flex justify-between items-center text-sm">
                        <span>Page {pagination.page} of {pagination.pages} ({pagination.totalMessages} total)</span>
                        <div className="space-x-2">
                            <Button onClick={() => loadMessages(pagination.page - 1)} disabled={pagination.page <= 1 || loading} variant="secondary" size="sm">Previous</Button>
                            <Button onClick={() => loadMessages(pagination.page + 1)} disabled={pagination.page >= pagination.pages || loading} variant="secondary" size="sm">Next</Button>
                        </div>
                    </div>
                )}
            </Card>
        </div>
    );
};

export default InboxPage;