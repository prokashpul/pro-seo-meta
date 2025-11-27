import React from 'react';
import { Layers, Sun, Moon } from 'lucide-react';

interface LoginProps {
  onLogin: () => void;
  isDarkMode: boolean;
  toggleTheme: () => void;
}

export const Login: React.FC<LoginProps> = ({ onLogin, isDarkMode, toggleTheme }) => {
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
          Sign in to generate SEO-optimized metadata for your stock photography assets using Google Gemini.
        </p>

        <button
          onClick={onLogin}
          className="w-full flex items-center justify-center gap-3 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-medium py-3 px-4 rounded-xl transition-all shadow-sm hover:shadow-md group relative overflow-hidden"
        >
          <svg className="w-5 h-5 relative z-10" viewBox="0 0 24 24">
            <path
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              fill="#4285F4"
            />
            <path
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              fill="#34A853"
            />
            <path
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              fill="#FBBC05"
            />
            <path
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              fill="#EA4335"
            />
          </svg>
          <span className="group-hover:text-slate-900 dark:group-hover:text-white transition-colors relative z-10">Sign in with Google</span>
        </button>

        <div className="mt-8 text-xs text-slate-400 dark:text-slate-500">
          By signing in, you agree to our Terms of Service and Privacy Policy.
        </div>
      </div>
      
      <div className="mt-8 text-slate-400 dark:text-slate-600 text-sm">
        &copy; 2024 StockMeta AI
      </div>
    </div>
  );
};