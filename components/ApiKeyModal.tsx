import React, { useState, useEffect } from 'react';
import { X, Key, Check, Save, ShieldCheck, Plus, Trash2, AlertCircle, Info, Zap, Cpu, Eye } from 'lucide-react';

interface ApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (provider: 'GROQ' | 'MISTRAL', key: string) => void;
  currentGeminiKey: string; // Ignored now
  currentGroqKey: string;
  currentMistralKey: string;
}

export const ApiKeyModal: React.FC<ApiKeyModalProps> = ({ 
  isOpen, 
  onClose, 
  onSave, 
  currentGroqKey,
  currentMistralKey
}) => {
  const [activeTab, setActiveTab] = useState<'GEMINI' | 'GROQ' | 'MISTRAL'>('GEMINI');
  const [groqKey, setGroqKey] = useState('');
  const [mistralKey, setMistralKey] = useState('');

  useEffect(() => {
    if (isOpen) {
      setGroqKey(currentGroqKey || '');
      setMistralKey(currentMistralKey || '');
    }
  }, [isOpen, currentGroqKey, currentMistralKey]);

  const handleSave = () => {
    onSave('GROQ', groqKey);
    onSave('MISTRAL', mistralKey);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[85vh]">
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-white dark:bg-slate-900 z-10">
          <div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Key className="text-indigo-500" size={24} />
              Provider Settings
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Configure your AI processing engines.</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors">
            <X size={24} />
          </button>
        </div>

        <div className="flex p-1 bg-slate-50 dark:bg-slate-950/50 border-b border-slate-100 dark:border-slate-800">
            <button onClick={() => setActiveTab('GEMINI')} className={`flex-1 py-3 text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${activeTab === 'GEMINI' ? 'text-indigo-600 dark:text-indigo-400 bg-white dark:bg-slate-900 shadow-sm' : 'text-slate-400'}`}>
                <Zap size={14} /> Gemini
            </button>
            <button onClick={() => setActiveTab('GROQ')} className={`flex-1 py-3 text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${activeTab === 'GROQ' ? 'text-emerald-600 dark:text-emerald-400 bg-white dark:bg-slate-900 shadow-sm' : 'text-slate-400'}`}>
                <Cpu size={14} /> Groq
            </button>
            <button onClick={() => setActiveTab('MISTRAL')} className={`flex-1 py-3 text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${activeTab === 'MISTRAL' ? 'text-orange-600 dark:text-orange-400 bg-white dark:bg-slate-900 shadow-sm' : 'text-slate-400'}`}>
                <Eye size={14} /> Mistral
            </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 min-h-0">
          {activeTab === 'GEMINI' ? (
              <div className="space-y-6">
                <div className="bg-indigo-50 dark:bg-indigo-900/10 p-6 rounded-xl border border-indigo-100 dark:border-indigo-900/30 flex flex-col items-center text-center gap-4">
                    <div className="p-3 bg-indigo-500 text-white rounded-full">
                        <ShieldCheck size={32} />
                    </div>
                    <div>
                        <h4 className="font-bold text-indigo-900 dark:text-indigo-100 mb-1">System Managed Key</h4>
                        <p className="text-xs text-indigo-700 dark:text-indigo-400 leading-relaxed">Gemini 3 models are authenticated via the secure system environment key. No manual configuration required.</p>
                    </div>
                </div>
              </div>
          ) : activeTab === 'GROQ' ? (
              <div className="space-y-6">
                <div className="bg-emerald-50 dark:bg-emerald-900/10 p-4 rounded-xl border border-emerald-100 dark:border-emerald-900/30 flex gap-4">
                    <Info className="text-emerald-500 shrink-0" size={20} />
                    <p className="text-xs text-emerald-700 dark:text-orange-300 leading-relaxed">Groq provides ultra-fast inference using <strong>llama-4-scout-17b</strong>.</p>
                </div>
                <div className="space-y-3">
                    <label className="text-xs font-bold uppercase tracking-wider text-emerald-500">Groq API Key</label>
                    <input type="password" value={groqKey} onChange={(e) => setGroqKey(e.target.value)} placeholder="Paste Groq API Key..." className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-4 py-3 text-sm font-mono text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none" />
                    <div className="mt-2 text-[10px] text-slate-400 flex items-center justify-between">
                         <span>Keys stored locally.</span>
                         <a href="https://console.groq.com/keys" target="_blank" className="text-emerald-500 hover:underline">Get Key</a>
                    </div>
                </div>
              </div>
          ) : (
            <div className="space-y-6">
                <div className="bg-orange-50 dark:bg-orange-900/10 p-4 rounded-xl border border-orange-100 dark:border-orange-900/30 flex gap-4">
                    <Info className="text-orange-500 shrink-0" size={20} />
                    <p className="text-xs text-orange-700 dark:text-orange-300 leading-relaxed">Mistral Pixtral 12B is a precision vision model.</p>
                </div>
                <div className="space-y-3">
                    <label className="text-xs font-bold uppercase tracking-wider text-orange-500">Mistral API Key</label>
                    <input type="password" value={mistralKey} onChange={(e) => setMistralKey(e.target.value)} placeholder="Paste Mistral API Key..." className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-4 py-3 text-sm font-mono text-slate-900 dark:text-white focus:ring-2 focus:ring-orange-500 outline-none" />
                    <div className="mt-2 text-[10px] text-slate-400 flex items-center justify-between">
                         <span>Keys stored locally.</span>
                         <a href="https://console.mistral.ai/api-keys/" target="_blank" className="text-orange-500 hover:underline">Get Key</a>
                    </div>
                </div>
              </div>
          )}
        </div>

        <div className="p-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex gap-3">
           <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800 font-bold text-sm transition-colors">Cancel</button>
           <button onClick={handleSave} className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm transition-colors flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20"><Save size={16} />Save Config</button>
        </div>
      </div>
    </div>
  );
};