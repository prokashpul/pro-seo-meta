
import React, { useState, useEffect } from 'react';
import { X, Key, Save, ShieldCheck, Info, Zap, Cpu, Eye, ExternalLink, Settings, RefreshCw, CheckCircle, AlertCircle, Copy } from 'lucide-react';

interface ApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (provider: 'GEMINI' | 'GROQ' | 'MISTRAL', key: string) => void;
  currentGeminiKey: string;
  currentGroqKey: string;
  currentMistralKey: string;
}

export const ApiKeyModal: React.FC<ApiKeyModalProps> = ({ 
  isOpen, 
  onClose, 
  onSave, 
  currentGeminiKey,
  currentGroqKey,
  currentMistralKey
}) => {
  const [activeTab, setActiveTab] = useState<'GEMINI' | 'GROQ' | 'MISTRAL'>('GEMINI');
  const [geminiKey, setGeminiKey] = useState('');
  const [groqKey, setGroqKey] = useState('');
  const [mistralKey, setMistralKey] = useState('');
  const [geminiSystemConnected, setGeminiSystemConnected] = useState<boolean>(false);
  const [isTesting, setIsTesting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setGeminiKey(currentGeminiKey || '');
      setGroqKey(currentGroqKey || '');
      setMistralKey(currentMistralKey || '');
      checkGeminiSystemState();
    }
  }, [isOpen, currentGeminiKey, currentGroqKey, currentMistralKey]);

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
          // Mitigate race condition as per guidelines
          setGeminiSystemConnected(true);
      }
  };

  const handleSave = () => {
    onSave('GEMINI', geminiKey);
    onSave('GROQ', groqKey);
    onSave('MISTRAL', mistralKey);
    onClose();
  };

  const isGeminiActive = geminiSystemConnected || geminiKey.length > 0;
  const isGroqActive = groqKey.length > 0;
  const isMistralActive = mistralKey.length > 0;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/50">
          <div>
            <h3 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Key className="text-indigo-500" size={24} />
              API Settings
            </h3>
            <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1 opacity-70">Intelligence Providers</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors">
            <X size={24} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex p-2 bg-slate-100 dark:bg-slate-950/50 border-b border-slate-100 dark:border-slate-800">
            <button 
              onClick={() => setActiveTab('GEMINI')} 
              className={`flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-[0.15em] flex items-center justify-center gap-2 transition-all ${activeTab === 'GEMINI' ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-slate-400'}`}
            >
                <Zap size={14} /> Gemini {isGeminiActive && <CheckCircle size={10} className="text-emerald-500" />}
            </button>
            <button 
              onClick={() => setActiveTab('GROQ')} 
              className={`flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-[0.15em] flex items-center justify-center gap-2 transition-all ${activeTab === 'GROQ' ? 'bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-sm' : 'text-slate-400'}`}
            >
                <Cpu size={14} /> Groq {isGroqActive && <CheckCircle size={10} className="text-emerald-500" />}
            </button>
            <button 
              onClick={() => setActiveTab('MISTRAL')} 
              className={`flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-[0.15em] flex items-center justify-center gap-2 transition-all ${activeTab === 'MISTRAL' ? 'bg-white dark:bg-slate-800 text-orange-600 dark:text-orange-400 shadow-sm' : 'text-slate-400'}`}
            >
                <Eye size={14} /> Mistral {isMistralActive && <CheckCircle size={10} className="text-emerald-500" />}
            </button>
        </div>

        <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
          {activeTab === 'GEMINI' ? (
              <div className="space-y-8">
                {/* System Selection Section */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Platform Integration</h4>
                    <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded ${geminiSystemConnected ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>
                        {geminiSystemConnected ? 'Active System Key' : 'Not Linked'}
                    </span>
                  </div>
                  
                  <div className={`p-6 rounded-2xl border flex flex-col items-center text-center gap-5 transition-all ${geminiSystemConnected ? 'bg-emerald-500/5 border-emerald-500/20 shadow-lg shadow-emerald-500/5' : 'bg-indigo-500/5 border-indigo-500/20'}`}>
                      <div className={`p-4 rounded-full ${geminiSystemConnected ? 'bg-emerald-500/10 text-emerald-500' : 'bg-indigo-500/10 text-indigo-500'}`}>
                          {geminiSystemConnected ? <ShieldCheck size={32} /> : <Zap size={32} />}
                      </div>
                      <div className="space-y-2">
                          <h5 className="font-black text-slate-900 dark:text-slate-100">AI Studio System Key</h5>
                          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-medium">Recommended for high-speed generation and high-fidelity image tools.</p>
                      </div>
                      <button onClick={handleSelectGeminiSystemKey} className="w-full py-3.5 px-6 rounded-xl font-black text-xs uppercase tracking-widest bg-indigo-600 hover:bg-indigo-500 text-white transition-all shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-3">
                          <Key size={16} /> {geminiSystemConnected ? 'Change System Key' : 'Connect via AI Studio'}
                      </button>
                      <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noopener noreferrer" className="text-[10px] font-bold text-indigo-500 hover:text-indigo-400 flex items-center gap-2">
                          Billing Requirements Documentation <ExternalLink size={12} />
                      </a>
                  </div>
                </div>

                <div className="relative">
                    <div className="absolute inset-0 flex items-center" aria-hidden="true">
                        <div className="w-full border-t border-slate-100 dark:border-slate-800"></div>
                    </div>
                    <div className="relative flex justify-center">
                        <span className="bg-white dark:bg-slate-900 px-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">OR</span>
                    </div>
                </div>

                {/* Manual Entry Section */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Manual API Entry</h4>
                    <span className="text-[10px] text-slate-400 font-bold italic">Standard Gemini Access</span>
                  </div>
                  <div className="relative group">
                    <input 
                      type="password" 
                      value={geminiKey} 
                      onChange={(e) => setGeminiKey(e.target.value)} 
                      placeholder="Paste Gemini API Key..." 
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl pl-12 pr-4 py-4 text-sm font-mono text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all" 
                    />
                    <Key className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={20} />
                  </div>
                  <p className="text-[10px] text-slate-400 font-medium italic pl-1">
                    Manual keys are used if a system key is not active. Keys are stored locally in your browser's encrypted cache.
                  </p>
                </div>
              </div>
          ) : activeTab === 'GROQ' ? (
              <div className="space-y-6">
                <div className="bg-emerald-500/5 dark:bg-emerald-900/10 p-5 rounded-2xl border border-emerald-500/20 flex gap-4">
                    <Zap className="text-emerald-500 shrink-0" size={24} />
                    <p className="text-xs text-emerald-700 dark:text-emerald-300 font-medium leading-relaxed">Groq enables near-instant multimodal analysis using <strong>Llama-4-Scout</strong>. Ideal for rapid high-volume keyword generation.</p>
                </div>
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <label className="text-xs font-black uppercase tracking-widest text-emerald-500">Groq Secret Key</label>
                        {isGroqActive && <span className="text-[10px] font-black text-emerald-500 uppercase flex items-center gap-2"><CheckCircle size={12} /> Connected</span>}
                    </div>
                    <div className="relative group">
                        <input type="password" value={groqKey} onChange={(e) => setGroqKey(e.target.value)} placeholder="Paste Groq API Key..." className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl pl-12 pr-4 py-4 text-sm font-mono text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all" />
                        <Key className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-500 transition-colors" size={20} />
                    </div>
                </div>
              </div>
          ) : (
            <div className="space-y-6">
                <div className="bg-orange-500/5 dark:bg-orange-900/10 p-5 rounded-2xl border border-orange-500/20 flex gap-4">
                    <Eye className="text-orange-500 shrink-0" size={24} />
                    <p className="text-xs text-orange-700 dark:text-orange-300 font-medium leading-relaxed">Mistral Pixtral 12B specializes in detailed visual composition reasoning and stylistic attribute tagging.</p>
                </div>
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <label className="text-xs font-black uppercase tracking-widest text-orange-500">Mistral Secret Key</label>
                        {isMistralActive && <span className="text-[10px] font-black text-emerald-500 uppercase flex items-center gap-2"><CheckCircle size={12} /> Connected</span>}
                    </div>
                    <div className="relative group">
                        <input type="password" value={mistralKey} onChange={(e) => setMistralKey(e.target.value)} placeholder="Paste Mistral API Key..." className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl pl-12 pr-4 py-4 text-sm font-mono text-slate-900 dark:text-white focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none transition-all" />
                        <Key className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-orange-500 transition-colors" size={20} />
                    </div>
                </div>
              </div>
          )}
        </div>

        <div className="p-8 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex gap-4">
           <button onClick={onClose} className="flex-1 py-4 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800 font-black text-xs uppercase tracking-[0.2em] transition-all">Cancel</button>
           <button onClick={handleSave} className="flex-1 py-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3 shadow-xl shadow-indigo-600/20">
             <Save size={18} /> Save Settings
           </button>
        </div>
      </div>
    </div>
  );
};
