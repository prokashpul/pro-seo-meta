
import React, { useState, useEffect } from 'react';
import { X, Key, Save, ShieldCheck, Info, Zap, Cpu, Eye, ExternalLink, Settings, RefreshCw, CheckCircle, AlertCircle } from 'lucide-react';

interface ApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (provider: 'GEMINI' | 'GROQ' | 'MISTRAL', key: string) => void;
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
  const [geminiSystemConnected, setGeminiSystemConnected] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      setGroqKey(currentGroqKey || '');
      setMistralKey(currentMistralKey || '');
      checkGeminiSystemState();
    }
  }, [isOpen, currentGroqKey, currentMistralKey]);

  const checkGeminiSystemState = async () => {
    const aistudio = (window as any).aistudio;
    if (aistudio?.hasSelectedApiKey) {
        try {
          const hasKey = await aistudio.hasSelectedApiKey();
          setGeminiSystemConnected(hasKey);
        } catch (e) {
          setGeminiSystemConnected(false);
        }
    }
  };

  const handleSelectGeminiSystemKey = async () => {
      const aistudio = (window as any).aistudio;
      if (aistudio?.openSelectKey) {
          await aistudio.openSelectKey();
          // Assuming selection was successful as per guidelines to mitigate race condition
          setGeminiSystemConnected(true);
      }
  };

  const handleSave = () => {
    onSave('GROQ', groqKey);
    onSave('MISTRAL', mistralKey);
    onClose();
  };

  const isGeminiConnected = geminiSystemConnected;
  const isGroqConnected = groqKey.length > 0;
  const isMistralConnected = mistralKey.length > 0;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-white dark:bg-slate-900 z-10">
          <div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Key className="text-indigo-500" size={24} />
              API Provider Hub
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Configure your AI intelligence engines.</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors">
            <X size={24} />
          </button>
        </div>

        <div className="flex p-1 bg-slate-50 dark:bg-slate-950/50 border-b border-slate-100 dark:border-slate-800">
            <button 
              onClick={() => setActiveTab('GEMINI')} 
              className={`flex-1 py-3 text-[10px] font-bold uppercase tracking-widest flex flex-col items-center justify-center gap-1 transition-all ${activeTab === 'GEMINI' ? 'text-indigo-600 dark:text-indigo-400 bg-white dark:bg-slate-900 shadow-sm' : 'text-slate-400'}`}
            >
                <div className="flex items-center gap-1.5">
                    <Zap size={14} /> Gemini {isGeminiConnected && <CheckCircle size={10} className="text-emerald-500" />}
                </div>
            </button>
            <button 
              onClick={() => setActiveTab('GROQ')} 
              className={`flex-1 py-3 text-[10px] font-bold uppercase tracking-widest flex flex-col items-center justify-center gap-1 transition-all ${activeTab === 'GROQ' ? 'text-emerald-600 dark:text-emerald-400 bg-white dark:bg-slate-900 shadow-sm' : 'text-slate-400'}`}
            >
                <div className="flex items-center gap-1.5">
                    <Cpu size={14} /> Groq {isGroqConnected && <CheckCircle size={10} className="text-emerald-500" />}
                </div>
            </button>
            <button 
              onClick={() => setActiveTab('MISTRAL')} 
              className={`flex-1 py-3 text-[10px] font-bold uppercase tracking-widest flex flex-col items-center justify-center gap-1 transition-all ${activeTab === 'MISTRAL' ? 'text-orange-600 dark:text-orange-400 bg-white dark:bg-slate-900 shadow-sm' : 'text-slate-400'}`}
            >
                <div className="flex items-center gap-1.5">
                    <Eye size={14} /> Mistral {isMistralConnected && <CheckCircle size={10} className="text-emerald-500" />}
                </div>
            </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
          {activeTab === 'GEMINI' ? (
              <div className="space-y-6">
                {/* Standard Project Selection */}
                <div className={`p-5 rounded-xl border flex flex-col items-center text-center gap-4 transition-all ${geminiSystemConnected ? 'bg-emerald-50 dark:bg-emerald-900/10 border-emerald-100 dark:border-emerald-800' : 'bg-indigo-50 dark:bg-indigo-900/10 border-indigo-100 dark:border-indigo-800'}`}>
                    <div className={`p-3 rounded-full shadow-inner ${geminiSystemConnected ? 'bg-emerald-500 text-white' : 'bg-indigo-500 text-white'}`}>
                        {geminiSystemConnected ? <ShieldCheck size={28} /> : <Settings size={28} />}
                    </div>
                    <div>
                        <h4 className="font-bold text-sm text-slate-800 dark:text-slate-100">{geminiSystemConnected ? 'System Connected' : 'Managed Project Access'}</h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mt-1">Linking a paid Google Cloud project enables unlimited Gemini 3 and high-quality image tools.</p>
                    </div>
                    <button onClick={handleSelectGeminiSystemKey} className={`w-full py-2.5 px-4 rounded-lg font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-sm ${geminiSystemConnected ? 'bg-emerald-600 hover:bg-emerald-500 text-white' : 'bg-indigo-600 hover:bg-indigo-500 text-white'}`}>
                        {geminiSystemConnected ? <RefreshCw size={16} /> : <Key size={16} />}
                        {geminiSystemConnected ? 'Switch System Key' : 'Connect System Key'}
                    </button>
                    <div className="flex flex-col gap-2 p-3 bg-blue-50/50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30 rounded-lg w-full">
                        <div className="flex items-start gap-2">
                            <Info size={14} className="text-blue-500 shrink-0 mt-0.5" />
                            <p className="text-[10px] text-blue-700 dark:text-blue-300 leading-normal text-left">
                                Users must select an API key from a paid GCP project. Check billing documentation for details.
                            </p>
                        </div>
                        <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noopener noreferrer" className="text-[10px] text-indigo-500 hover:text-indigo-400 font-bold flex items-center gap-1 self-end">
                            Billing Documentation <ExternalLink size={10} />
                        </a>
                    </div>
                </div>
              </div>
          ) : activeTab === 'GROQ' ? (
              <div className="space-y-6">
                <div className="bg-emerald-50 dark:bg-emerald-900/10 p-4 rounded-xl border border-emerald-100 dark:border-emerald-800 flex gap-4">
                    <Zap className="text-emerald-500 shrink-0" size={20} />
                    <p className="text-xs text-emerald-700 dark:text-emerald-300">Groq powers ultra-fast multimodal inference using <strong>llama-4-scout</strong> for near-instant results.</p>
                </div>
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <label className="text-xs font-bold uppercase tracking-wider text-emerald-500">Groq API Key</label>
                        {isGroqConnected && <span className="text-[10px] font-bold text-emerald-500 uppercase flex items-center gap-1"><CheckCircle size={10} /> Connected</span>}
                    </div>
                    <div className="relative">
                        <input type="password" value={groqKey} onChange={(e) => setGroqKey(e.target.value)} placeholder="Paste Groq API Key..." className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg pl-10 pr-4 py-3 text-sm font-mono text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none" />
                        <Key className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    </div>
                </div>
              </div>
          ) : (
            <div className="space-y-6">
                <div className="bg-orange-50 dark:bg-orange-900/10 p-4 rounded-xl border border-orange-100 dark:border-orange-800 flex gap-4">
                    <Eye className="text-orange-500 shrink-0" size={20} />
                    <p className="text-xs text-orange-700 dark:text-orange-300">Mistral Pixtral 12B offers high-fidelity visual reasoning, perfect for complex composition analysis.</p>
                </div>
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <label className="text-xs font-bold uppercase tracking-wider text-orange-500">Mistral API Key</label>
                        {isMistralConnected && <span className="text-[10px] font-bold text-emerald-500 uppercase flex items-center gap-1"><CheckCircle size={10} /> Connected</span>}
                    </div>
                    <div className="relative">
                        <input type="password" value={mistralKey} onChange={(e) => setMistralKey(e.target.value)} placeholder="Paste Mistral API Key..." className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg pl-10 pr-4 py-3 text-sm font-mono text-slate-900 dark:text-white focus:ring-2 focus:ring-orange-500 outline-none" />
                        <Key className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    </div>
                </div>
              </div>
          )}
        </div>

        <div className="p-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex gap-3">
           <button onClick={onClose} className="flex-1 py-3 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800 font-bold text-sm transition-all">Cancel</button>
           <button onClick={handleSave} className="flex-1 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/20">
             <Save size={16} /> Save Configuration
           </button>
        </div>
      </div>
    </div>
  );
};
