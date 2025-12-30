import React, { useState, useRef } from 'react';
import { Sparkles, Copy, Check, Loader2, Image as ImageIcon, Trash2, ArrowLeft, Download, Type, RefreshCw, ChevronDown, XCircle, Zap, Cpu, Eye } from 'lucide-react';
import { FileUploader } from './FileUploader';
import { optimizeImage } from '../services/imageOptimizer';
import { generateImagePrompt, expandTextToPrompts } from '../services/geminiService';

interface PromptItem {
  id: string;
  file: File;
  previewUrl: string;
  prompt: string;
  status: 'idle' | 'loading' | 'completed' | 'error';
  error?: string;
}

interface TextExpansionItem {
  id: string;
  originalText: string;
  imageType: string;
  generatedPrompts: string[];
  status: 'idle' | 'loading' | 'completed' | 'error';
  error?: string;
}

interface PromptGeneratorProps {
  onBack?: () => void;
}

type Mode = 'REVERSE' | 'EXPAND';
type Provider = 'GEMINI' | 'GROQ' | 'MISTRAL';

const IMAGE_TYPES = [
  "Photography", "Cinematic", "3D Render", "Digital Art", 
  "Oil Painting", "Anime", "Realistic", "Cyberpunk", "Vintage",
  "Minimalist Vector", "Icon Logo"
];

export const PromptGenerator: React.FC<PromptGeneratorProps> = ({ onBack }) => {
  const [mode, setMode] = useState<Mode>('REVERSE');
  const [provider, setProvider] = useState<Provider>('GEMINI');
  
  // Reverse Image Mode State
  const [items, setItems] = useState<PromptItem[]>([]);
  const [isGeneratingAll, setIsGeneratingAll] = useState(false);
  const stopGenerationRef = useRef(false);
  
  // Text Expansion Mode State
  const [inputText, setInputText] = useState('');
  const [variationCount, setVariationCount] = useState(3);
  const [selectedImageType, setSelectedImageType] = useState('Photography');
  const [expansionItems, setExpansionItems] = useState<TextExpansionItem[]>([]);
  
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Get keys from localStorage for non-Gemini providers
  const getApiKey = (p: Provider) => {
    if (p === 'GROQ') return localStorage.getItem('groq_api_key') || '';
    if (p === 'MISTRAL') return localStorage.getItem('mistral_api_key') || '';
    return '';
  };

  // --- REVERSE IMAGE LOGIC ---
  const handleFilesSelected = (files: File[]) => {
    const newItems = files.map(file => ({
      id: Math.random().toString(36).substring(7),
      file,
      previewUrl: URL.createObjectURL(file),
      prompt: '',
      status: 'idle' as const
    }));
    setItems(prev => [...prev, ...newItems]);
  };

  const handleRemove = (id: string) => {
    setItems(prev => {
      const item = prev.find(i => i.id === id);
      if (item) URL.revokeObjectURL(item.previewUrl);
      return prev.filter(i => i.id !== id);
    });
  };

  const handleClearAll = () => {
    if (isGeneratingAll) {
        stopGenerationRef.current = true;
        setIsGeneratingAll(false);
    }
    items.forEach(item => URL.revokeObjectURL(item.previewUrl));
    setItems([]);
  };

  const handleGenerate = async (id: string) => {
    const activeKey = getApiKey(provider);
    if ((provider === 'GROQ' || provider === 'MISTRAL') && !activeKey) {
        alert(`${provider} API key is missing. Please add it in the settings modal on the main workspace.`);
        return;
    }

    setItems(prev => prev.map(i => i.id === id ? { ...i, status: 'loading', error: undefined } : i));
    try {
      const item = items.find(i => i.id === id);
      if (!item) return;

      const { base64, mimeType } = await optimizeImage(item.file);
      const prompt = await generateImagePrompt(
        base64, 
        mimeType, 
        item.file.type.startsWith('image/') ? "Photography" : "Vector",
        provider,
        activeKey
      );

      setItems(prev => prev.map(i => i.id === id ? { ...i, status: 'completed', prompt } : i));
    } catch (err: any) {
      setItems(prev => prev.map(i => i.id === id ? { ...i, status: 'error', error: err.message } : i));
    }
  };

  const handleGenerateAll = async () => {
    if (isGeneratingAll) return;
    const pendingItems = items.filter(i => i.status === 'idle' || i.status === 'error');
    if (pendingItems.length === 0) return;

    setIsGeneratingAll(true);
    stopGenerationRef.current = false;

    for (const item of pendingItems) {
        if (stopGenerationRef.current) break;
        await handleGenerate(item.id);
        
        if (!stopGenerationRef.current && pendingItems.indexOf(item) !== pendingItems.length - 1) {
             await new Promise(resolve => setTimeout(resolve, provider === 'GEMINI' ? 3000 : 1000));
        }
    }
    setIsGeneratingAll(false);
  };

  const handleExpandText = async () => {
      if (!inputText.trim()) return;
      const activeKey = getApiKey(provider);
      if ((provider === 'GROQ' || provider === 'MISTRAL') && !activeKey) {
          alert(`${provider} API key is missing. Please add it in the settings modal on the main workspace.`);
          return;
      }

      const newItem: TextExpansionItem = {
          id: Math.random().toString(36).substring(7),
          originalText: inputText,
          imageType: selectedImageType,
          generatedPrompts: [],
          status: 'loading'
      };

      setExpansionItems(prev => [newItem, ...prev]);
      setInputText('');

      try {
          const prompts = await expandTextToPrompts(newItem.originalText, variationCount, newItem.imageType, provider, activeKey);
          setExpansionItems(prev => prev.map(i => i.id === newItem.id ? { ...i, status: 'completed', generatedPrompts: prompts } : i));
      } catch (err: any) {
          setExpansionItems(prev => prev.map(i => i.id === newItem.id ? { ...i, status: 'error', error: err.message } : i));
      }
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const totalItems = items.length;
  const completedItems = items.filter(i => i.status === 'completed').length;
  const progressPercentage = totalItems > 0 ? (completedItems / totalItems) * 100 : 0;

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      {onBack && (
        <button onClick={onBack} className="mb-6 inline-flex items-center gap-2 text-base text-slate-400 hover:text-indigo-500 transition-colors font-medium">
          <ArrowLeft size={18} /> Back to Metadata
        </button>
      )}

      <div className="text-center mb-10">
        <h2 className="text-4xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-pink-500 to-indigo-500">
          AI Prompt Studio
        </h2>
        <p className="max-w-3xl mx-auto text-slate-600 dark:text-slate-400 text-xl">
          Generate high-quality prompts for Midjourney, Stable Diffusion, or Dall-E.
        </p>
      </div>

      <div className="flex flex-col items-center gap-6 mb-10">
          {/* Main Mode Toggle */}
          <div className="flex bg-slate-100 dark:bg-slate-800 p-1.5 rounded-xl shadow-inner">
              <button
                  onClick={() => setMode('REVERSE')}
                  className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-base font-bold transition-all ${
                      mode === 'REVERSE' ? 'bg-white dark:bg-slate-700 text-pink-600 dark:text-pink-400 shadow-sm' : 'text-slate-500 dark:text-slate-400'
                  }`}
              >
                  <ImageIcon size={18} /> Image to Prompt
              </button>
              <button
                  onClick={() => setMode('EXPAND')}
                  className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-base font-bold transition-all ${
                      mode === 'EXPAND' ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-slate-500 dark:text-slate-400'
                  }`}
              >
                  <Type size={18} /> Text to Prompt
              </button>
          </div>

          {/* Provider Toggle (New) */}
          <div className="flex bg-slate-100 dark:bg-slate-800/50 p-1 rounded-lg border border-slate-200 dark:border-slate-800">
              <button
                  onClick={() => setProvider('GEMINI')}
                  className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-sm font-bold transition-all ${
                      provider === 'GEMINI' ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-slate-500 dark:text-slate-400'
                  }`}
              >
                  <Zap size={14} /> Gemini
              </button>
              <button
                  onClick={() => setProvider('GROQ')}
                  className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-sm font-bold transition-all ${
                      provider === 'GROQ' ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-sm' : 'text-slate-500 dark:text-slate-400'
                  }`}
              >
                  <Cpu size={14} /> Groq
              </button>
              <button
                  onClick={() => setProvider('MISTRAL')}
                  className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-sm font-bold transition-all ${
                      provider === 'MISTRAL' ? 'bg-white dark:bg-slate-700 text-orange-600 dark:text-orange-400 shadow-sm' : 'text-slate-500 dark:text-slate-400'
                  }`}
              >
                  <Eye size={14} /> Mistral
              </button>
          </div>
      </div>

      {mode === 'REVERSE' ? (
        <div>
           <div className="mb-12">
                <FileUploader onFilesSelected={handleFilesSelected} disabled={isGeneratingAll} />
           </div>

            {items.length > 0 && (
                <div className="flex flex-wrap md:flex-nowrap justify-between items-center gap-4 mb-8 sticky top-24 z-40 bg-white/90 dark:bg-slate-900/90 backdrop-blur p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden">
                {isGeneratingAll && (
                    <div className="absolute bottom-0 left-0 w-full h-1 bg-slate-200 dark:bg-slate-700">
                        <div className="h-full bg-pink-500 transition-all duration-300 ease-out" style={{ width: `${progressPercentage}%` }} />
                    </div>
                )}
                <div className="flex items-center gap-3">
                    {items.filter(i => i.status === 'idle' || i.status === 'error').length > 0 && (
                      !isGeneratingAll ? (
                        <button onClick={handleGenerateAll} className="flex items-center gap-2 px-5 py-2.5 bg-pink-600 hover:bg-pink-500 text-white rounded-lg text-sm font-bold transition-colors shadow-lg shadow-pink-500/20">
                            <Sparkles size={18} /> Generate All ({items.filter(i => i.status === 'idle' || i.status === 'error').length})
                        </button>
                      ) : (
                        <button onClick={() => { stopGenerationRef.current = true; setIsGeneratingAll(false); }} className="flex items-center gap-2 px-5 py-2.5 bg-red-600 hover:bg-red-500 text-white rounded-lg text-sm font-bold transition-colors">
                            <XCircle size={18} /> Stop
                        </button>
                      )
                    )}
                </div>
                <div className="flex items-center gap-3 ml-auto">
                    <button onClick={handleClearAll} disabled={isGeneratingAll} className="flex items-center gap-2 px-5 py-2.5 bg-slate-100 dark:bg-white/5 hover:bg-red-50 text-slate-600 dark:text-slate-300 hover:text-red-500 rounded-lg text-sm font-bold transition-colors border border-transparent hover:border-red-200 dark:hover:border-red-800/50">
                        <Trash2 size={18} /> Clear
                    </button>
                </div>
                </div>
            )}

            <div className="space-y-8">
                {items.map(item => (
                <div key={item.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm flex flex-col md:flex-row animate-in fade-in slide-in-from-bottom-2">
                    <div className="md:w-1/4 h-80 md:h-auto bg-slate-100 dark:bg-slate-950 relative group">
                        <img src={item.previewUrl} alt="Preview" className="w-full h-full object-cover" />
                        <button onClick={() => handleRemove(item.id)} className="absolute top-3 right-3 p-2.5 bg-black/50 hover:bg-red-500 text-white rounded-lg transition-colors opacity-0 group-hover:opacity-100">
                            <Trash2 size={18} />
                        </button>
                    </div>
                    <div className="md:w-3/4 p-8 flex flex-col">
                        <div className="flex justify-between items-start mb-6">
                            <div className="flex items-center gap-2">
                            <ImageIcon size={22} className="text-pink-500" />
                            <span className="font-bold text-lg text-slate-700 dark:text-slate-200">Generated Prompt</span>
                            </div>
                            {item.status === 'completed' && (
                            <button onClick={() => handleCopy(item.prompt, item.id)} className="text-slate-400 hover:text-indigo-500 p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                                {copiedId === item.id ? <Check size={20} className="text-emerald-500" /> : <Copy size={20} />}
                            </button>
                            )}
                        </div>
                        <div className="flex-1 relative min-h-[140px]">
                            {item.status === 'loading' && (
                            <div className="absolute inset-0 flex flex-col items-center justify-center text-indigo-500 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm z-10 rounded-lg">
                                <Loader2 size={40} className="animate-spin mb-3" />
                                <p className="text-base font-bold">Analyzing image...</p>
                                <p className="text-xs opacity-70 mt-1">Using {provider}</p>
                            </div>
                            )}
                            {item.status === 'error' && (
                                <div className="absolute inset-0 flex flex-col items-center justify-center text-red-500 bg-red-50/50 dark:bg-red-900/10 backdrop-blur-sm z-10 rounded-lg p-6 text-center">
                                    <XCircle size={32} className="mb-2" />
                                    <p className="text-sm font-medium">{item.error || 'Failed to generate prompt'}</p>
                                </div>
                            )}
                            <textarea readOnly value={item.prompt} className="w-full h-full min-h-[140px] p-5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl resize-none focus:outline-none text-slate-700 dark:text-slate-300 leading-relaxed text-base" placeholder="Prompt will appear here..." />
                        </div>
                        <div className="mt-6 flex justify-end">
                            <button onClick={() => handleGenerate(item.id)} disabled={item.status === 'loading'} className="bg-pink-600 hover:bg-pink-500 disabled:opacity-50 text-white px-6 py-2.5 rounded-lg font-bold flex items-center gap-2 transition-colors shadow-lg shadow-pink-500/20">
                            {item.status === 'completed' ? <RefreshCw size={18} /> : <Sparkles size={18} />}
                            {item.status === 'completed' ? 'Regenerate' : 'Generate'}
                            </button>
                        </div>
                    </div>
                </div>
                ))}
            </div>
        </div>
      ) : (
        <div className="max-w-5xl mx-auto">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 shadow-sm mb-10">
                <div className="flex flex-col md:flex-row gap-8">
                    <div className="flex-1">
                        <label className="block text-xs font-bold uppercase tracking-wider mb-2 text-slate-500 dark:text-slate-400">Concept / Short Description</label>
                        <textarea value={inputText} onChange={(e) => setInputText(e.target.value)} placeholder="e.g. A futuristic cyberpunk city in rain..." className="w-full h-48 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-5 py-4 text-slate-900 dark:text-slate-200 focus:ring-2 focus:ring-indigo-500 focus:outline-none resize-none text-base" />
                    </div>
                    <div className="md:w-80 flex flex-col gap-6">
                         <div>
                            <label className="block text-xs font-bold uppercase tracking-wider mb-2 text-slate-500 dark:text-slate-400">Variations</label>
                            <div className="relative">
                                <select value={variationCount} onChange={(e) => setVariationCount(Number(e.target.value))} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-slate-900 dark:text-slate-200 focus:ring-2 focus:ring-indigo-500 focus:outline-none appearance-none cursor-pointer text-base font-medium">
                                    {[1, 3, 5, 10].map(num => <option key={num} value={num}>{num} Variations</option>)}
                                </select>
                                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400" size={20} />
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wider mb-2 text-slate-500 dark:text-slate-400">Image Style</label>
                            <div className="relative">
                                <select value={selectedImageType} onChange={(e) => setSelectedImageType(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-slate-900 dark:text-slate-200 focus:ring-2 focus:ring-indigo-500 focus:outline-none appearance-none cursor-pointer text-base font-medium">
                                    {IMAGE_TYPES.map(type => <option key={type} value={type}>{type}</option>)}
                                </select>
                                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400" size={20} />
                            </div>
                        </div>
                        <button onClick={handleExpandText} disabled={!inputText.trim()} className="flex-1 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-colors shadow-lg shadow-indigo-500/20 py-3 mt-auto text-base">
                            <Sparkles size={20} /> Expand with {provider}
                        </button>
                    </div>
                </div>
            </div>

            <div className="space-y-8">
                {expansionItems.map(item => (
                    <div key={item.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm animate-in zoom-in-95 duration-300">
                        <div className="bg-slate-50 dark:bg-slate-950 px-8 py-5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
                            <h3 className="text-base font-bold text-slate-900 dark:text-white truncate max-w-lg">"{item.originalText}"</h3>
                            <button onClick={() => setExpansionItems(prev => prev.filter(i => i.id !== item.id))} className="text-slate-400 hover:text-red-500"><Trash2 size={18} /></button>
                        </div>
                        <div className="p-8">
                            {item.status === 'loading' && <div className="flex items-center justify-center py-10 text-indigo-500 gap-3"><Loader2 size={32} className="animate-spin" /><span className="font-bold text-lg">Expanding...</span></div>}
                            {item.status === 'completed' && (
                                <div className="grid grid-cols-1 gap-4">
                                    {item.generatedPrompts.map((prompt, idx) => (
                                        <div key={idx} className="group relative bg-slate-50 dark:bg-slate-950 p-5 rounded-xl border border-slate-100 dark:border-slate-800 hover:border-indigo-300 transition-colors">
                                            <p className="text-base text-slate-700 dark:text-slate-300 pr-10 leading-relaxed">{prompt}</p>
                                            <button onClick={() => handleCopy(prompt, `${item.id}-${idx}`)} className="absolute top-4 right-4 text-slate-400 hover:text-indigo-500 opacity-0 group-hover:opacity-100 transition-all p-2 bg-white dark:bg-slate-800 rounded-lg shadow-sm">
                                                {copiedId === `${item.id}-${idx}` ? <Check size={20} className="text-emerald-500" /> : <Copy size={20} />}
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                            {item.status === 'error' && (
                                <div className="flex flex-col items-center justify-center py-10 text-red-500">
                                    <XCircle size={32} className="mb-2" />
                                    <p className="text-sm font-medium">{item.error || 'Expansion failed'}</p>
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
      )}
    </div>
  );
};