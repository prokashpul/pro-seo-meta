import React from 'react';
import { Sun, Moon, Loader2, Key, Layers, ArrowRight, ShieldCheck } from 'lucide-react';

interface LoginProps {
  onLogin: () => void;
  isLoggingIn: boolean;
  isDarkMode: boolean;
  toggleTheme: () => void;
}

export const Login: React.FC<LoginProps> = ({ onLogin, isLoggingIn, isDarkMode, toggleTheme }) => {
  return (
    <div className={`min-h-screen flex items-center justify-center relative overflow-hidden transition-colors duration-1000 ${isDarkMode ? 'bg-[#000000]' : 'bg-[#f8fafc]'}`}>
      
      {/* Advanced Animated Mesh Gradients */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
          <div className={`absolute top-[-10%] left-[-10%] w-[80vw] h-[80vw] rounded-full blur-[120px] opacity-40 animate-pulse duration-[10s] ${isDarkMode ? 'bg-indigo-900' : 'bg-indigo-200/50'}`} />
          <div className={`absolute bottom-[-10%] right-[-10%] w-[60vw] h-[60vw] rounded-full blur-[140px] opacity-30 animate-pulse delay-1000 duration-[12s] ${isDarkMode ? 'bg-fuchsia-900' : 'bg-pink-200/50'}`} />
          <div className={`absolute top-[30%] left-[40%] w-[40vw] h-[40vw] rounded-full blur-[100px] opacity-20 animate-pulse delay-500 duration-[15s] mix-blend-overlay ${isDarkMode ? 'bg-cyan-800' : 'bg-cyan-200'}`} />
      </div>

      {/* Theme Toggle */}
      <div className="absolute top-6 right-6 z-30">
        <button
          onClick={toggleTheme}
          className={`p-3 rounded-full transition-all duration-300 hover:rotate-12 hover:scale-110 shadow-lg ${
            isDarkMode 
              ? 'bg-white/5 text-yellow-300 border border-white/10 backdrop-blur-md hover:bg-white/10' 
              : 'bg-white/80 text-slate-600 border border-white/40 shadow-slate-200/50 backdrop-blur-md hover:bg-white'
          }`}
        >
          {isDarkMode ? <Sun size={24} /> : <Moon size={24} />}
        </button>
      </div>

      {/* Glass Card */}
      <div className="relative z-10 w-full max-w-lg p-8 perspective-[1000px]">
        <div className={`
            relative backdrop-blur-2xl rounded-[2.5rem] border p-14 text-center 
            transform transition-all duration-500 hover:scale-[1.01] hover:shadow-2xl
            animate-in fade-in slide-in-from-bottom-8 duration-700
            ${isDarkMode 
              ? 'bg-[#111827]/60 border-white/10 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.5)]' 
              : 'bg-white/70 border-white/60 shadow-[0_20px_60px_-15px_rgba(99,102,241,0.15)] shadow-indigo-100/50'
            }
        `}>
          
          {/* Logo Icon */}
          <div className="flex justify-center mb-10 relative">
            <div className={`absolute inset-0 bg-indigo-500 blur-2xl opacity-20 rounded-full animate-pulse`} />
            <div className={`relative p-6 rounded-3xl shadow-xl bg-gradient-to-tr from-indigo-500 to-violet-600 text-white transform rotate-3`}>
              <Layers className="w-12 h-12" />
            </div>
          </div>
          
          <h1 className={`text-5xl font-extrabold mb-4 tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
            StockMeta<span className="text-indigo-500 font-light">AI</span>
          </h1>
          <p className={`text-lg mb-14 font-medium max-w-[320px] mx-auto leading-relaxed ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
            Automate your stock contributor workflow with next-gen computer vision.
          </p>

          <button
            onClick={onLogin}
            disabled={isLoggingIn}
            className="group w-full relative overflow-hidden rounded-2xl p-[1px] focus:outline-none focus:ring-4 focus:ring-indigo-500/20 transition-all active:scale-[0.98]"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 opacity-80 group-hover:opacity-100 transition-opacity animate-gradient-x" />
            <div className={`
                relative h-full w-full rounded-2xl px-8 py-5 flex items-center justify-center gap-3 transition-colors
                ${isDarkMode ? 'bg-[#0f172a] group-hover:bg-transparent' : 'bg-white group-hover:bg-transparent'}
            `}>
               {isLoggingIn ? (
                    <Loader2 className={`w-6 h-6 animate-spin ${isDarkMode ? 'text-white' : 'text-indigo-600 group-hover:text-white'}`} />
                ) : (
                    <Key className={`w-6 h-6 ${isDarkMode ? 'text-white' : 'text-indigo-600 group-hover:text-white'}`} />
                )}
                <span className={`text-lg font-bold tracking-wide ${isDarkMode ? 'text-white' : 'text-slate-800 group-hover:text-white'}`}>
                    {isLoggingIn ? 'Authenticating...' : 'Enter Workspace'}
                </span>
                {!isLoggingIn && <ArrowRight className={`w-5 h-5 transition-transform group-hover:translate-x-1 ${isDarkMode ? 'text-white' : 'text-slate-400 group-hover:text-white'}`} />}
            </div>
          </button>
          
          <div className="mt-12 pt-8 border-t border-slate-200/50 dark:border-white/5">
              <div className="flex items-center justify-center gap-2 text-xs uppercase tracking-widest font-bold text-slate-400 dark:text-slate-500">
                  <ShieldCheck size={14} /> Client-Side Processing
              </div>
          </div>
        </div>
      </div>
    </div>
  );
};