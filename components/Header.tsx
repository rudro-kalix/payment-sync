import React from 'react';
import { Activity, Radio } from 'lucide-react';

interface HeaderProps {
  isListening: boolean;
  toggleListening: () => void;
}

const Header: React.FC<HeaderProps> = ({ isListening, toggleListening }) => {
  return (
    <div className="sticky top-0 z-50 bg-slate-900/95 backdrop-blur border-b border-slate-800 p-4">
      <div className="flex justify-between items-center max-w-2xl mx-auto">
        <div className="flex items-center gap-3">
          <div className="bg-blue-600 p-2 rounded-lg">
            <Activity className="text-white w-6 h-6" />
          </div>
          <div>
            <h1 className="font-bold text-lg leading-tight">PaySync</h1>
            <p className="text-xs text-slate-400">Merchant Verifier</p>
          </div>
        </div>
        
        <button
          onClick={toggleListening}
          className={`flex items-center gap-2 px-4 py-2 rounded-full font-medium text-sm transition-all ${
            isListening 
              ? 'bg-green-500/10 text-green-400 border border-green-500/20 shadow-[0_0_15px_rgba(74,222,128,0.1)]' 
              : 'bg-slate-800 text-slate-400 border border-slate-700 hover:bg-slate-700'
          }`}
        >
          {isListening ? (
            <>
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
              </span>
              Listening
            </>
          ) : (
            <>
              <Radio className="w-4 h-4" />
              Stopped
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default Header;