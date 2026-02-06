import React, { useState, useEffect, useCallback } from 'react';
import { Transaction, PaymentProvider } from './types';
import { MOCK_SMS_MESSAGES } from './constants';
import { parseSms } from './services/smsParser';
import { syncTransactionToFirebase } from './services/firebaseService';
import { startSmsListener, stopSmsListener } from './services/capacitorSmsListener';
import Header from './components/Header';
import TransactionCard from './components/TransactionCard';
import { Plus, Smartphone, Search } from 'lucide-react';

const App = () => {
  const [isListening, setIsListening] = useState<boolean>(false);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [activeTab, setActiveTab] = useState<'all' | 'failed' | 'synced'>('all');

  // Core Logic: Process an incoming SMS string
  const handleIncomingSms = useCallback(async (smsText: string) => {
    // 1. Parse locally
    const parsed = parseSms(smsText);
    
    // 2. Create Transaction Object
    const newTransaction: Transaction = {
      id: crypto.randomUUID(),
      rawSms: smsText,
      ...parsed,
      timestamp: Date.now(),
      status: parsed.trxId ? 'pending' : 'manual_review',
    };

    // 3. Update State
    setTransactions(prev => [newTransaction, ...prev]);

    // 4. Trigger Sync if parsed successfully
    if (parsed.trxId) {
      try {
        await syncTransactionToFirebase(newTransaction);
        setTransactions(prev => prev.map(t => 
          t.id === newTransaction.id ? { ...t, status: 'synced' } : t
        ));
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        setTransactions(prev => prev.map(t => 
          t.id === newTransaction.id ? { ...t, status: 'failed', syncError: errorMessage } : t
        ));
      }
    }
  }, []);

  // Effect: Manage Capacitor SMS Listener
  useEffect(() => {
    // Clean up function to ensure we don't have dangling listeners
    if (isListening) {
      startSmsListener(handleIncomingSms);
    } else {
      stopSmsListener();
    }
    return () => {
      stopSmsListener();
    };
  }, [isListening, handleIncomingSms]);

  // Handler: Manual Retry
  const handleRetry = async (t: Transaction) => {
    setTransactions(prev => prev.map(tr => tr.id === t.id ? { ...tr, status: 'pending' } : tr));
    try {
      await syncTransactionToFirebase(t);
      setTransactions(prev => prev.map(tr => 
        tr.id === t.id ? { ...tr, status: 'synced' } : tr
      ));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      setTransactions(prev => prev.map(tr => 
        tr.id === t.id ? { ...tr, status: 'failed', syncError: errorMessage } : tr
      ));
    }
  };

  const handleDelete = (id: string) => {
    setTransactions(prev => prev.filter(t => t.id !== id));
  };

  // Simulation for Demo
  const simulateSms = () => {
    const randomMsg = MOCK_SMS_MESSAGES[Math.floor(Math.random() * MOCK_SMS_MESSAGES.length)];
    handleIncomingSms(randomMsg);
  };

  const filteredTransactions = transactions.filter(t => {
    if (activeTab === 'failed') return t.status === 'failed' || t.status === 'manual_review';
    if (activeTab === 'synced') return t.status === 'synced';
    return true;
  });

  return (
    <div className="min-h-screen bg-slate-900 pb-20">
      <Header isListening={isListening} toggleListening={() => setIsListening(!isListening)} />

      <main className="max-w-2xl mx-auto p-4">
        
        {/* Simulation Bar (Dev Only) */}
        <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-3 mb-6 flex items-center justify-between">
          <div className="flex items-center gap-2 text-blue-300 text-sm">
            <Smartphone className="w-4 h-4" />
            <span>Developer Mode: Simulate Incoming SMS</span>
          </div>
          <button 
            onClick={simulateSms}
            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-md transition-colors"
          >
            Simulate
          </button>
        </div>

        {/* Filters */}
        <div className="flex gap-2 mb-4 overflow-x-auto no-scrollbar">
          {(['all', 'failed', 'synced'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium capitalize transition-colors ${
                activeTab === tab 
                  ? 'bg-slate-100 text-slate-900' 
                  : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* List */}
        <div className="space-y-4">
          {filteredTransactions.length === 0 ? (
            <div className="text-center py-20 opacity-50">
              <div className="inline-flex bg-slate-800 p-4 rounded-full mb-4">
                <Search className="w-8 h-8 text-slate-500" />
              </div>
              <p className="text-slate-400">No transactions found</p>
              <p className="text-xs text-slate-500 mt-2">Waiting for SMS...</p>
            </div>
          ) : (
            filteredTransactions.map(t => (
              <TransactionCard 
                key={t.id} 
                transaction={t} 
                onRetry={handleRetry}
                onDelete={handleDelete}
              />
            ))
          )}
        </div>
      </main>

      {/* Floating Action Button for Manual Entry (Future Feature) */}
      <button className="fixed bottom-6 right-6 w-14 h-14 bg-blue-600 hover:bg-blue-500 rounded-full shadow-lg shadow-blue-600/30 flex items-center justify-center text-white transition-transform hover:scale-105 active:scale-95">
        <Plus className="w-6 h-6" />
      </button>
    </div>
  );
};

export default App;