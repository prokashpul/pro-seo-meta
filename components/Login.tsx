import React from 'react';
import { Layers, Sun, Moon, Loader2, Key } from 'lucide-react';

interface LoginProps {
  onLogin: () => void;
  isLoggingIn: boolean;
  isDarkMode: boolean;
  toggleTheme: () => void;
}

export const Login: React.FC<LoginProps> = ({ onLogin, isLoggingIn, isDarkMode, toggleTheme }) => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-[#0f172a] transition-colors p-4 relative">
      
      {/* Theme Toggle (Absolute top right) */}
      <div className="absolute top-4 right-4">
        <button
          onClick={toggleTheme}
          className={`p-2 rounded-full transition-colors ${
            isDarkMode 
              ? 'bg-slate-800 text-yellow-400 hover:bg-slate-700' 
              : 'bg-white text-slate-600 hover:bg-slate-100 shadow-sm'
          }`}
          title="Toggle Dark Mode"
        >
          {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
        </button>
      </div>

      <div className="max-w-md w-full bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 p-8 text-center animate-in fade-in zoom-in-95 duration-300">
        <div className="flex justify-center mb-6">
          <div className="bg-gradient-to-tr from-indigo-500 to-purple-500 p-3 rounded-xl shadow-lg">
            <Layers className="text-white w-8 h-8" />
          </div>
        </div>
        
        <h1 className="text-2xl font-bold mb-2 text-slate-900 dark:text-white">Welcome to StockMeta AI</h1>
        <p className="text-slate-500 dark:text-slate-400 mb-8">
          Enter your API Key to start generating SEO-optimized metadata for your stock photography assets.
        </p>

        <button
          onClick={onLogin}
          disabled={isLoggingIn}
          className={`w-full flex items-center justify-center gap-3 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-medium py-3 px-4 rounded-xl transition-all shadow-sm group relative overflow-hidden ${
            isLoggingIn ? 'opacity-80 cursor-not-allowed' : 'hover:bg-slate-50 dark:hover:bg-slate-700 hover:shadow-md'
          }`}
        >
          {isLoggingIn ? (
            <Loader2 className="w-5 h-5 animate-spin text-indigo-500" />
          ) : (
            <Key className="w-5 h-5 text-indigo-500 relative z-10" />
          )}
          <span className="group-hover:text-slate-900 dark:group-hover:text-white transition-colors relative z-10">
            {isLoggingIn ? 'Processing...' : 'Add Gemini API Key'}
          </span>
        </button>
      </div>
      
      <div className="mt-8 text-slate-400 dark:text-slate-600 text-sm">
        &copy; 2025 - 2030 StockMeta AI
      </div>
    </div>
  );
};