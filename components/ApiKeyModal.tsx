import React, { useState, useEffect } from 'react';
import { X, Key, Check, Eye, EyeOff, Save, Layers, ShieldCheck } from 'lucide-react';

interface ApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (key: string) => void;
  currentKey: string;
}

export const ApiKeyModal: React.FC<ApiKeyModalProps> = ({ isOpen, onClose, onSave, currentKey }) => {
  const [inputValue, setInputValue] = useState('');
  const [showKey, setShowKey] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setInputValue(currentKey);
    }
  }, [isOpen, currentKey]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(inputValue.trim());
    onClose();
  };

  const keyCount = inputValue.split('\n').filter(k => k.trim().length > 0).length;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="p-8">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
              <Key className="text-indigo-500" size={28} />
              API Key Pool
            </h3>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-white">
              <X size={24} />
            </button>
          </div>

          <p className="text-slate-500 dark:text-slate-400 mb-6 text-base leading-relaxed">
            Enter your Google Gemini API Keys. You can add multiple keys (one per line) to create a <strong>Key Pool</strong>. 
            The system will rotate through them to distribute load and avoid rate limits.
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <div className="flex justify-between items-center mb-2">
                 <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                   API Keys (One per line)
                 </label>
                 <span className={`text-xs font-bold px-2 py-0.5 rounded ${keyCount > 0 ? 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400' : 'bg-slate-100 text-slate-500 dark:bg-slate-800'}`}>
                    {keyCount} Active {keyCount === 1 ? 'Key' : 'Keys'}
                 </span>
              </div>
              
              <div className="relative">
                <textarea
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  className="w-full h-32 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-4 py-3 text-slate-900 dark:text-slate-200 text-sm font-mono focus:ring-1 focus:ring-indigo-500 focus:outline-none resize-none placeholder-slate-400"
                  placeholder={`AIzaSy...\nAIzaSy...\nAIzaSy...`}
                  spellCheck={false}
                />
                <button
                  type="button"
                  onClick={() => setShowKey(!showKey)}
                  className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 bg-slate-50 dark:bg-slate-800 p-1 rounded-md"
                  title={showKey ? "Hide Keys" : "Show Keys"}
                >
                  {showKey ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
                {/* Visual mask for password feel if needed, though usually API keys are visible in settings */}
                {!showKey && inputValue && (
                   <div className="absolute inset-0 m-[1px] rounded-xl bg-slate-50 dark:bg-slate-800 z-10 pointer-events-none flex p-4 text-slate-400 font-mono text-sm overflow-hidden select-none">
                      {Array(keyCount).fill('•••••••••••••••••••••••••••••••••••••••').map((line, i) => (
                          <div key={i} className="w-full truncate mb-1">{line}</div>
                      ))}
                   </div>
                )}
              </div>
              <div className="mt-3 text-sm text-slate-400 dark:text-slate-500 flex items-center gap-2">
                <ShieldCheck size={14} /> Keys are stored locally in your browser.
                <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-indigo-500 hover:underline ml-auto">Get Free Keys</a>
              </div>
            </div>

            <div className="flex gap-4 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-3 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-bold text-base transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!inputValue}
                className="flex-1 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-base transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save size={18} />
                Save Pool
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};