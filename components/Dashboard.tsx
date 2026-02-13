import React, { useEffect, useState, useCallback } from 'react';
import { collection, query, getDocs, limit, orderBy, Timestamp } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { db, auth } from '../firebaseConfig';
import { Transaction } from '../types';
import { Button } from './Button';
import { getAppName, formatCurrency, formatDate } from '../utils/helpers';
import { TransactionModal } from './TransactionModal';
import { doc, updateDoc } from 'firebase/firestore';

const Dashboard: React.FC = () => {
  const [notifications, setNotifications] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  
  // Modal state
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Manual Fetch Function to save Quota
  const fetchTransactions = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // 1. We use server-side sorting to get the ACTUAL latest 20 items.
      // NOTE: This requires a Firestore Index (transactions: time DESC).
      // If the index is missing, the catch block will provide the link to create it.
      const q = query(
        collection(db, 'transactions'),
        orderBy('time', 'desc'),
        limit(20) // Reduced from 50 to 20 to save reads
      );
      
      const snapshot = await getDocs(q);
      
      if (snapshot.empty) {
        setNotifications([]);
      } else {
        const docs = snapshot.docs.map(doc => ({
          ...doc.data(),
          id: doc.id
        })) as Transaction[];
        setNotifications(docs);
      }
      setLastUpdated(new Date());
    } catch (err: any) {
      console.error("Firestore Error:", err);
      if (err.code === 'failed-precondition') {
        setError("Missing Index. Open browser console to click the generated link to create 'time' index.");
      } else if (err.code === 'permission-denied') {
        setError("Permission denied. Check Firestore Rules.");
      } else {
        setError(`Error: ${err.message}`);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load only
  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const handleSignOut = () => {
    signOut(auth).catch(err => console.error("Sign out error", err));
  };

  const handleMarkUsed = async (id: string, currentStatus: boolean) => {
    try {
      const txRef = doc(db, 'transactions', id);
      await updateDoc(txRef, {
        used: !currentStatus
      });
      
      // Optimistic update locally to avoid re-fetching (saving reads)
      setNotifications(prev => prev.map(t => 
        t.id === id ? { ...t, used: !currentStatus } : t
      ));
      
      setIsModalOpen(false);
    } catch (err) {
      console.error("Error updating status:", err);
      alert("Failed to update status");
    }
  };

  const openModal = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedTransaction(null);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 font-sans transition-colors duration-200">
      {/* Navigation Bar */}
      <nav className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <span className="text-xl font-bold text-gray-800 dark:text-white tracking-tight">PayMonitor</span>
            </div>
            <div className="flex items-center gap-4">
               {lastUpdated && (
                <span className="text-xs text-gray-500 dark:text-gray-400 hidden sm:block">
                  Updated: {lastUpdated.toLocaleTimeString()}
                </span>
              )}
              <Button onClick={handleSignOut} variant="secondary" size="sm">
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-6">
           <div>
             <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Recent Transactions</h2>
             <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
               Latest 20 items (Manual Refresh)
             </p>
           </div>
           <Button onClick={fetchTransactions} isLoading={loading}>
             Refresh List
           </Button>
        </div>

        {/* Error State */}
        {error && (
          <div className="rounded-md bg-red-50 dark:bg-red-900/20 p-4 mb-6 border border-red-200 dark:border-red-800">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                   <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800 dark:text-red-200">Data Fetch Error</h3>
                <div className="mt-2 text-sm text-red-700 dark:text-red-300">
                  <p>{error}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Content */}
        {loading && notifications.length === 0 ? (
           <div className="flex flex-col justify-center items-center py-20">
             <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mb-4"></div>
             <p className="text-gray-500 dark:text-gray-400">Loading data...</p>
           </div>
        ) : notifications.length === 0 && !loading ? (
          <div className="text-center py-16 bg-white dark:bg-gray-800 shadow rounded-lg border border-gray-200 dark:border-gray-700">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No transactions found</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Try refreshing or checking your database connection.
            </p>
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 shadow overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700/50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider w-32">
                    App
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Notification Content
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider w-32">
                    Amount
                  </th>
                   <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider w-48">
                    Time
                  </th>
                  <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider w-24">
                    Status
                  </th>
                  <th scope="col" className="relative px-6 py-3">
                    <span className="sr-only">View</span>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {notifications.map((notification) => {
                   const appName = getAppName(notification.packageName);
                   return (
                    <tr key={notification.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                          ${appName === 'bKash' ? 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200' :
                            appName === 'Nagad' ? 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200' :
                            appName === 'Rocket' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200' :
                            'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'}`}>
                          {appName}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-300">
                        <div className="font-medium text-gray-900 dark:text-white truncate max-w-md">{notification.title}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-md mt-0.5">{notification.text}</div>
                        <div className="text-xs text-gray-400 dark:text-gray-500 font-mono mt-1">
                          {notification.transactionId || notification.docId || 'No ID'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900 dark:text-white">
                        {notification.amount ? formatCurrency(notification.amount) : <span className="text-gray-400 font-normal">N/A</span>}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-500 dark:text-gray-400 tabular-nums">
                         {notification.time ? formatDate(notification.time) : 'No Date'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                         <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                           notification.used 
                             ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' 
                             : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
                         }`}>
                           {notification.used ? 'Used' : 'Unused'}
                         </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <Button variant="ghost" size="sm" onClick={() => openModal(notification)}>
                          View
                        </Button>
                      </td>
                    </tr>
                   );
                })}
              </tbody>
            </table>
            </div>
          </div>
        )}
      </div>

      <TransactionModal 
        transaction={selectedTransaction}
        isOpen={isModalOpen}
        onClose={closeModal}
        onMarkUsed={handleMarkUsed}
      />
    </div>
  );
};

export default Dashboard;