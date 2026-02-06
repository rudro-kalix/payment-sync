import React from 'react';
import { Transaction, PaymentProvider } from '../types';
import { CheckCircle, AlertCircle, RefreshCw, Copy, Trash2 } from 'lucide-react';

interface Props {
  transaction: Transaction;
  onRetry: (t: Transaction) => void;
  onDelete: (id: string) => void;
}

const TransactionCard: React.FC<Props> = ({ transaction, onRetry, onDelete }) => {
  const getProviderColor = (p: PaymentProvider) => {
    switch (p) {
      case PaymentProvider.BKASH: return 'text-pink-500 bg-pink-500/10 border-pink-500/20';
      case PaymentProvider.NAGAD: return 'text-orange-500 bg-orange-500/10 border-orange-500/20';
      case PaymentProvider.ROCKET: return 'text-purple-500 bg-purple-500/10 border-purple-500/20';
      default: return 'text-slate-400 bg-slate-800 border-slate-700';
    }
  };

  return (
    <div className="bg-slate-800/50 rounded-xl border border-slate-700 p-4 mb-3 shadow-sm relative group overflow-hidden">
      
      {/* Provider Badge */}
      <div className="flex justify-between items-start mb-3">
        <span className={`px-2 py-1 rounded text-xs font-bold border ${getProviderColor(transaction.provider)}`}>
          {transaction.provider}
        </span>
        <span className="text-xs text-slate-500 font-mono">
          {new Date(transaction.timestamp).toLocaleTimeString()}
        </span>
      </div>

      {/* Main Content */}
      <div className="flex justify-between items-end mb-3">
        <div>
          <p className="text-slate-400 text-xs uppercase tracking-wider mb-1">TrxID</p>
          <div className="flex items-center gap-2">
            <span className="text-xl font-mono font-bold text-white tracking-wide">
              {transaction.trxId || "MISSING"}
            </span>
            {transaction.trxId && (
              <button className="text-slate-600 hover:text-slate-300 transition-colors">
                <Copy className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>
        <div className="text-right">
           <p className="text-slate-400 text-xs uppercase tracking-wider mb-1">Amount</p>
           <p className="text-xl font-bold text-emerald-400">
             {transaction.amount ? `Tk ${transaction.amount}` : "--"}
           </p>
        </div>
      </div>

      {/* Sender Info */}
      <div className="mb-4">
         <p className="text-sm text-slate-400">
           Sender: <span className="text-slate-200">{transaction.sender || "Unknown"}</span>
         </p>
      </div>

      {/* Raw SMS Toggle/Preview */}
      <details className="mb-4 text-xs text-slate-500 bg-slate-900/50 p-2 rounded border border-slate-700/50">
        <summary className="cursor-pointer hover:text-slate-300 select-none">Raw SMS Message</summary>
        <p className="mt-2 font-mono break-all opacity-80">{transaction.rawSms}</p>
      </details>

      {/* Footer Actions / Status */}
      <div className="flex items-center justify-between pt-3 border-t border-slate-700/50">
        <div className="flex items-center gap-2">
          {transaction.status === 'synced' && (
            <span className="flex items-center gap-1.5 text-xs text-green-400 font-medium">
              <CheckCircle className="w-4 h-4" />
              Synced to Firebase
            </span>
          )}
          {transaction.status === 'failed' && (
             <span className="flex items-center gap-1.5 text-xs text-red-400 font-medium">
              <AlertCircle className="w-4 h-4" />
              Sync Failed
            </span>
          )}
           {transaction.status === 'manual_review' && (
             <span className="flex items-center gap-1.5 text-xs text-yellow-400 font-medium">
              <AlertCircle className="w-4 h-4" />
              Parse Failed
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
           {/* Retry Sync Button */}
          {transaction.status === 'failed' && (
            <button 
              onClick={() => onRetry(transaction)}
              className="p-2 hover:bg-slate-700 rounded-full text-slate-400 hover:text-white transition-colors"
              title="Retry Upload"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          )}

           <button 
              onClick={() => onDelete(transaction.id)}
              className="p-2 hover:bg-red-900/30 rounded-full text-slate-500 hover:text-red-400 transition-colors"
              title="Delete"
            >
              <Trash2 className="w-4 h-4" />
            </button>
        </div>
      </div>
    </div>
  );
};

export default TransactionCard;