import React, { useState, useEffect } from 'react';
import { X, Key, Check, Save, ShieldCheck, Plus, Trash2, AlertCircle, Info } from 'lucide-react';

interface ApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (key: string) => void;
  currentKey: string;
}

export const ApiKeyModal: React.FC<ApiKeyModalProps> = ({ isOpen, onClose, onSave, currentKey }) => {
  const [keys, setKeys] = useState<string[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      // Parse existing keys from the storage string
      const existing = currentKey
        ? currentKey.split(/[\n,]+/).map(k => k.trim()).filter(k => k.length > 0)
        : [];
      setKeys(existing);
      setInputValue('');
      setError(null);
    }
  }, [isOpen, currentKey]);

  const handleAddKey = () => {
    const raw = inputValue.trim();
    if (!raw) return;

    // Handle bulk paste (newlines or commas)
    const newCandidates = raw.split(/[\n,]+/).map(k => k.trim()).filter(k => k.length > 0);
    
    // Filter out duplicates that are already in the list
    const uniqueToAdd = newCandidates.filter(k => !keys.includes(k));
    
    if (uniqueToAdd.length === 0 && newCandidates.length > 0) {
        setError("Key already exists in your pool.");
        return;
    }

    setKeys(prev => [...prev, ...uniqueToAdd]);
    setInputValue('');
    setError(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddKey();
    }
  };

  const handleRemoveKey = (index: number) => {
    setKeys(prev => prev.filter((_, i) => i !== index));
  };

  const handleSave = () => {
    // Join with newlines for storage
    onSave(keys.join('\n'));
    onClose();
  };

  const maskKey = (k: string) => {
      if (k.length < 12) return "••••••••";
      return `${k.substring(0, 6)}...${k.substring(k.length - 4)}`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[85vh]">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-white dark:bg-slate-900 z-10">
          <div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Key className="text-indigo-500" size={24} />
              API Key Pool
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Add multiple keys to distribute load & avoid rate limits.
            </p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors">
            <X size={24} />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 min-h-0">
          
          {/* List of Keys */}
          <div className="space-y-3 mb-6">
            <div className="flex justify-between items-center">
               <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                 Active Keys ({keys.length})
               </label>
               {keys.length > 0 && (
                 <span className="text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-medium bg-emerald-50 dark:bg-emerald-900/20 px-2 py-0.5 rounded-full">
                   <Check size={10} /> Active
                 </span>
               )}
            </div>

            <div className="space-y-2">
              {keys.length > 0 ? (
                keys.map((k, i) => (
                  <div key={i} className="group flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-700 transition-all">
                    <div className="flex items-center gap-3 overflow-hidden">
                      <div className={`w-2 h-2 rounded-full shrink-0 ${i === 0 ? 'bg-indigo-500 animate-pulse' : 'bg-slate-300 dark:bg-slate-600'}`} />
                      <code className="font-mono text-sm text-slate-600 dark:text-slate-300 truncate">
                        {maskKey(k)}
                      </code>
                    </div>
                    <button 
                      onClick={() => handleRemoveKey(i)} 
                      className="text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 p-1.5 rounded-lg transition-colors"
                      title="Remove Key"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))
              ) : (
                <div className="text-center py-10 text-slate-400 dark:text-slate-500 bg-slate-50 dark:bg-slate-800/30 rounded-xl border border-dashed border-slate-200 dark:border-slate-700">
                  <Key size={32} className="mx-auto mb-3 opacity-20" />
                  <p className="text-sm font-medium">No API Keys added yet.</p>
                  <p className="text-xs opacity-70 mt-1">Add a key below to get started.</p>
                </div>
              )}
            </div>
          </div>

          {/* Add Section */}
          <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
             <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2 block">
               Add New Key
             </label>
             <div className="flex gap-2">
               <input 
                  value={inputValue}
                  onChange={(e) => {
                    setInputValue(e.target.value);
                    if(error) setError(null);
                  }}
                  onKeyDown={handleKeyDown}
                  placeholder="Paste AIzaSy..."
                  className="flex-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-4 py-2.5 text-sm font-mono text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-shadow"
               />
               <button 
                  onClick={handleAddKey}
                  disabled={!inputValue.trim()}
                  className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2.5 rounded-lg font-bold text-sm flex items-center gap-2 transition-all shadow-sm shadow-indigo-500/20 active:scale-95"
               >
                  <Plus size={18} />
                  Add
               </button>
             </div>
             {error && (
               <div className="mt-2 text-red-500 text-xs flex items-center gap-1.5 animate-in slide-in-from-top-1">
                  <AlertCircle size={12} /> {error}
               </div>
             )}
             <div className="mt-3 text-[10px] text-slate-400 dark:text-slate-500 flex items-center justify-between">
                <span className="flex items-center gap-1.5"><ShieldCheck size={12}/> Keys stored locally in browser.</span>
                <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-indigo-500 hover:underline flex items-center gap-1">
                   Get Free Key <Info size={10} />
                </a>
             </div>
          </div>

        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex gap-3">
           <button
             onClick={onClose}
             className="flex-1 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800 font-bold text-sm transition-colors"
           >
             Cancel
           </button>
           <button
             onClick={handleSave}
             className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm transition-colors flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20"
           >
             <Save size={16} />
             Save Pool ({keys.length})
           </button>
        </div>

      </div>
    </div>
  );
};
