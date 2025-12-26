import React, { useState, useEffect, useRef } from 'react';
import { Copy, Check, TrendingUp, RefreshCw, X, AlertCircle, Cloud, Loader2, FileType, Sparkles, Trash2, FilterX, Maximize2, MoreHorizontal, PenLine, GripVertical } from 'lucide-react';
import { UploadedFile, StockMetadata, ProcessingStatus } from '../types';
import { getTrendingKeywords } from '../services/geminiService';

interface MetadataCardProps {
  item: UploadedFile;
  isSelected: boolean;
  onToggleSelect: (id: string) => void;
  onRemove: (id: string) => void;
  onRegenerate: (id: string) => void;
  onUpdateMetadata: (id: string, metadata: StockMetadata) => void;
  onAddTrending: (id: string, trending: string[]) => void;
  apiKey?: string;
}

export const MetadataCard: React.FC<MetadataCardProps> = ({ 
  item, 
  isSelected,
  onToggleSelect,
  onRemove, 
  onRegenerate,
  onUpdateMetadata, 
  onAddTrending,
  apiKey
}) => {
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [isSearchingTrends, setIsSearchingTrends] = useState(false);

  // Auto-save State
  const [localMetadata, setLocalMetadata] = useState<StockMetadata | undefined>(item.metadata);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'modified' | 'idle'>('idle');
  const lastSavedRef = useRef<StockMetadata | undefined>(item.metadata);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!item.metadata) return;
    const isDifferent = JSON.stringify(item.metadata) !== JSON.stringify(lastSavedRef.current);
    if (isDifferent) {
        setLocalMetadata(item.metadata);
        lastSavedRef.current = item.metadata;
    } else if (!localMetadata) {
        setLocalMetadata(item.metadata);
        lastSavedRef.current = item.metadata;
    }
  }, [item.metadata]);

  useEffect(() => {
    if (saveStatus === 'saved') {
      const timeout = setTimeout(() => setSaveStatus('idle'), 2000);
      return () => clearTimeout(timeout);
    }
  }, [saveStatus]);

  const saveNow = (data: StockMetadata) => {
    if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
    }
    onUpdateMetadata(item.id, data);
    lastSavedRef.current = data;
    setSaveStatus('saved');
  };

  const handleLocalChange = (field: keyof StockMetadata, value: any) => {
    if (!localMetadata) return;
    const newData = { ...localMetadata, [field]: value };
    setLocalMetadata(newData);
    setSaveStatus('saving');
    
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => saveNow(newData), 2000);
  };

  const handleBlur = () => {
    if (saveStatus === 'saving' && localMetadata) saveNow(localMetadata);
  };

  const handleImmediateUpdate = (newData: StockMetadata) => {
      setLocalMetadata(newData);
      saveNow(newData);
  };

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleFetchTrends = async () => {
    if (!localMetadata?.keywords) return;
    setIsSearchingTrends(true);
    try {
      const trends = await getTrendingKeywords(localMetadata.keywords, apiKey);
      if (trends.length > 0) onAddTrending(item.id, trends);
    } catch (e) {
      console.error("Failed to fetch trends", e);
    } finally {
      setIsSearchingTrends(false);
    }
  };

  const handleAppendTrend = (trend: string) => {
    if (!localMetadata) return;
    if (localMetadata.keywords.includes(trend)) return;
    const newKeywords = [...localMetadata.keywords, trend];
    handleImmediateUpdate({ ...localMetadata, keywords: newKeywords });
  };

  const handleRemoveKeyword = (idx: number) => {
      if (!localMetadata) return;
      const newKw = localMetadata.keywords.filter((_, i) => i !== idx);
      handleImmediateUpdate({ ...localMetadata, keywords: newKw });
  }

  const handleRemoveDuplicates = () => {
    if (!localMetadata) return;
    const uniqueKeywords = [...new Set(localMetadata.keywords)];
    if (uniqueKeywords.length !== localMetadata.keywords.length) {
        handleImmediateUpdate({ ...localMetadata, keywords: uniqueKeywords });
    }
  };

  const isProcessing = item.status === ProcessingStatus.ANALYZING || item.status === ProcessingStatus.UPLOADING;
  const displayMetadata = localMetadata || item.metadata;

  return (
    <div 
      className={`group relative rounded-2xl overflow-hidden transition-all duration-300 border
        ${isSelected 
          ? 'ring-2 ring-indigo-500 border-indigo-500 shadow-xl shadow-indigo-500/10 z-10' 
          : 'border-white/60 dark:border-gray-800 shadow-sm hover:shadow-xl hover:shadow-slate-200/50 dark:hover:shadow-black/20 hover:border-indigo-100 dark:hover:border-gray-700'
        } bg-white/90 backdrop-blur-sm dark:bg-[#0f1218]`}
    >
      <div className="flex flex-col md:flex-row h-full">
        
        {/* --- LEFT: Image Section (Clean) --- */}
        <div 
            className="md:w-[400px] relative bg-slate-50 dark:bg-black/40 group/image cursor-pointer border-r border-slate-100 dark:border-gray-800 flex items-center justify-center p-6"
            onClick={() => onToggleSelect(item.id)}
        >
          {item.previewUrl ? (
             <div className="relative w-full h-full flex items-center justify-center">
                 <img 
                    src={item.previewUrl} 
                    alt="Preview" 
                    className="max-w-full max-h-[300px] object-contain rounded-lg shadow-sm transition-transform duration-500 group-hover/image:scale-[1.02]"
                />
             </div>
          ) : (
            <div className="flex flex-col items-center justify-center text-slate-400">
               <AlertCircle size={48} className="mb-2 opacity-30" />
               <p className="text-base font-medium">No Preview</p>
            </div>
          )}

          {/* Selection Overlay */}
          <div className="absolute top-4 left-4 z-20">
             <div className={`
                w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200
                ${isSelected 
                    ? 'bg-indigo-600 text-white shadow-md scale-100' 
                    : 'bg-white/90 text-slate-300 border border-slate-200 shadow-sm hover:border-indigo-400 hover:text-indigo-400'}
             `}>
                {isSelected ? <Check size={20} strokeWidth={3} /> : <div className="w-4 h-4 rounded-full bg-transparent" />}
             </div>
          </div>

          {/* Format Badge */}
          {item.vectorFile && (
            <div className="absolute top-4 right-4 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-xs font-bold px-3 py-1.5 rounded border border-emerald-200 dark:border-emerald-800 flex items-center gap-1.5">
                <FileType size={14} /> EPS
            </div>
          )}

          {/* Loading Overlay */}
          {isProcessing && (
            <div className="absolute inset-0 bg-white/90 dark:bg-black/80 backdrop-blur-[2px] z-30 flex flex-col items-center justify-center">
              <Loader2 size={40} className="text-indigo-600 animate-spin mb-4" />
              <p className="text-sm font-bold text-indigo-900 dark:text-indigo-400 uppercase tracking-widest">Analyzing...</p>
            </div>
          )}

          {item.status === ProcessingStatus.ERROR && (
             <div className="absolute inset-0 bg-red-50/95 dark:bg-red-900/90 z-30 flex flex-col items-center justify-center p-8 text-center">
               <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
               <p className="text-red-800 dark:text-red-200 font-medium text-base leading-relaxed mb-6">{item.error || "Analysis Failed"}</p>
               <button 
                  onClick={(e) => { e.stopPropagation(); onRegenerate(item.id); }}
                  className="px-5 py-2.5 bg-white border border-red-200 text-red-600 rounded-lg text-sm font-bold hover:bg-red-50 transition-colors"
               >
                   Try Again
               </button>
             </div>
          )}
        </div>

        {/* --- RIGHT: Metadata Editor (Minimal) --- */}
        <div className="flex-1 flex flex-col min-w-0">
          
          {/* Header Bar */}
          <div className="flex items-center justify-between px-8 py-4 border-b border-slate-100 dark:border-gray-800 bg-white/50 dark:bg-[#0f1218]">
             <div className="flex items-center gap-4">
                <span className={`flex items-center gap-1.5 text-xs uppercase tracking-wider font-bold transition-all ${
                    saveStatus === 'saved' ? 'text-emerald-600' : saveStatus === 'saving' ? 'text-amber-500' : 'text-slate-300'
                }`}>
                   {saveStatus === 'saving' ? <RefreshCw size={12} className="animate-spin" /> : saveStatus === 'saved' ? <Check size={12} /> : null}
                   {saveStatus === 'saving' ? 'Saving...' : saveStatus === 'saved' ? 'Saved' : 'Auto-Save'}
                </span>
             </div>
             
             {displayMetadata && (
                <div className="flex items-center gap-3">
                    <span className="text-sm font-bold text-slate-400 uppercase">Category</span>
                    <select 
                        value={displayMetadata.category}
                        onChange={(e) => handleLocalChange('category', e.target.value)}
                        onBlur={handleBlur}
                        className="bg-slate-50 dark:bg-gray-800 border-none text-sm font-bold text-slate-700 dark:text-gray-300 rounded px-3 py-1.5 focus:ring-1 focus:ring-indigo-500 cursor-pointer"
                    >
                        <option value={displayMetadata.category}>{displayMetadata.category}</option>
                        <option value="Business">Business</option>
                        <option value="Technology">Technology</option>
                        <option value="Nature">Nature</option>
                        <option value="People">People</option>
                        <option value="Lifestyle">Lifestyle</option>
                        <option value="Abstract">Abstract</option>
                        <option value="Food & Drink">Food & Drink</option>
                    </select>
                </div>
             )}
          </div>

          <div className="p-8 flex-1 overflow-y-auto custom-scrollbar">
            {displayMetadata ? (
              <div className="space-y-8">
                
                {/* Title */}
                <div className="group/field relative">
                   <div className="flex justify-between items-center mb-3">
                      <div className="flex items-center gap-2">
                          <label className="text-xs font-bold text-slate-400 uppercase tracking-widest group-focus-within/field:text-indigo-600 transition-colors">
                            Title
                          </label>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              displayMetadata.title.length > 70
                              ? 'bg-red-50 text-red-600' 
                              : 'bg-emerald-50 text-emerald-600'
                          }`}>
                              {displayMetadata.title.length} / 70 chars
                          </span>
                      </div>
                      <button onClick={() => copyToClipboard(displayMetadata.title, 'title')} className="opacity-0 group-hover/field:opacity-100 text-slate-400 hover:text-indigo-600 transition-all p-1">
                          {copiedField === 'title' ? <Check size={16} className="text-emerald-500" /> : <Copy size={16} />}
                      </button>
                   </div>
                   <textarea
                      rows={2}
                      value={displayMetadata.title}
                      onChange={(e) => handleLocalChange('title', e.target.value)}
                      onBlur={handleBlur}
                      className="w-full bg-transparent text-xl font-semibold text-slate-800 dark:text-gray-100 border-b border-transparent hover:border-slate-200 dark:hover:border-gray-700 focus:border-indigo-500 p-1 -ml-1 focus:ring-0 resize-none placeholder-slate-300 leading-tight transition-all"
                      placeholder="Enter title..."
                   />
                </div>

                {/* Description */}
                <div className="group/field relative">
                   <div className="flex justify-between items-center mb-3">
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-widest group-focus-within/field:text-indigo-600 transition-colors">
                         Description
                      </label>
                      <button onClick={() => copyToClipboard(displayMetadata.description, 'description')} className="opacity-0 group-hover/field:opacity-100 text-slate-400 hover:text-indigo-600 transition-all p-1">
                          {copiedField === 'description' ? <Check size={16} className="text-emerald-500" /> : <Copy size={16} />}
                      </button>
                   </div>
                   <textarea
                      rows={3}
                      value={displayMetadata.description}
                      onChange={(e) => handleLocalChange('description', e.target.value)}
                      onBlur={handleBlur}
                      className="w-full bg-slate-50 dark:bg-gray-800/50 rounded-lg border border-transparent hover:border-slate-200 dark:hover:border-gray-700 focus:border-indigo-500 focus:bg-white dark:focus:bg-gray-900 p-4 text-base text-slate-700 dark:text-gray-300 focus:ring-0 resize-none transition-all leading-relaxed"
                      placeholder="Enter description..."
                   />
                </div>

                {/* Keywords */}
                <div className="space-y-4">
                   <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-gray-800">
                      <div className="flex items-center gap-3">
                          <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Keywords</label>
                          <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                              displayMetadata.keywords.length < 15 || displayMetadata.keywords.length > 35 
                              ? 'bg-amber-50 text-amber-600' 
                              : 'bg-slate-100 text-slate-500'
                          }`}>
                              {displayMetadata.keywords.length} / 35
                          </span>
                      </div>
                      
                      <div className="flex gap-1">
                          <button onClick={handleRemoveDuplicates} className="p-2 text-slate-400 hover:text-orange-500 rounded hover:bg-orange-50 transition-colors" title="Remove Duplicates">
                              <FilterX size={16} />
                          </button>
                          <button onClick={handleFetchTrends} disabled={isSearchingTrends} className="p-2 text-slate-400 hover:text-purple-500 rounded hover:bg-purple-50 transition-colors disabled:opacity-50" title="Find Trends">
                              {isSearchingTrends ? <Loader2 size={16} className="animate-spin" /> : <TrendingUp size={16} />}
                          </button>
                          <button onClick={() => copyToClipboard(displayMetadata.keywords.join(', '), 'keywords')} className="p-2 text-slate-400 hover:text-indigo-500 rounded hover:bg-indigo-50 transition-colors">
                              {copiedField === 'keywords' ? <Check size={16} className="text-emerald-500" /> : <Copy size={16} />}
                          </button>
                      </div>
                   </div>

                   {/* Trending Suggestions */}
                   {item.trendingContext && item.trendingContext.length > 0 && (
                      <div className="bg-gradient-to-r from-purple-50 to-white dark:from-purple-900/10 dark:to-transparent rounded-lg p-4 border border-purple-100 dark:border-purple-800/30">
                          <div className="flex items-center gap-2 mb-2">
                             <TrendingUp size={14} className="text-purple-500" />
                             <span className="text-sm font-bold text-purple-700 dark:text-purple-300">Trending Opportunities</span>
                          </div>
                          <div className="flex flex-wrap gap-2">
                              {item.trendingContext.map((trend, i) => (
                                !displayMetadata.keywords.includes(trend) && (
                                    <button key={i} onClick={() => handleAppendTrend(trend)} className="text-xs px-2.5 py-1 bg-white dark:bg-gray-800 text-purple-600 dark:text-purple-300 border border-purple-100 dark:border-purple-800/50 rounded hover:bg-purple-500 hover:text-white hover:border-purple-500 transition-all">
                                        + {trend}
                                    </button>
                                )
                              ))}
                          </div>
                      </div>
                   )}

                   <div className="flex flex-wrap gap-2.5">
                      {displayMetadata.keywords.map((keyword, idx) => (
                         <div key={idx} className="group/chip relative inline-flex">
                             <span className="px-3 py-1.5 text-sm font-medium bg-slate-100 dark:bg-gray-800 text-slate-700 dark:text-gray-300 border border-slate-200 dark:border-gray-700 rounded-md transition-colors hover:border-indigo-300 dark:hover:border-indigo-700 cursor-default">
                                {keyword}
                             </span>
                             <button 
                                onClick={() => handleRemoveKeyword(idx)}
                                className="absolute -top-2 -right-2 bg-white dark:bg-gray-700 text-slate-400 hover:text-red-500 border border-slate-200 dark:border-gray-600 rounded-full w-5 h-5 flex items-center justify-center opacity-0 group-hover/chip:opacity-100 transition-all shadow-sm z-10"
                             >
                                <X size={12} />
                             </button>
                         </div>
                      ))}
                      <button className="px-4 py-1.5 text-sm font-medium bg-white dark:bg-gray-800 border border-dashed border-slate-300 dark:border-gray-700 text-slate-400 rounded-md hover:border-indigo-400 hover:text-indigo-500 transition-colors">
                          + Add
                      </button>
                   </div>
                </div>

              </div>
            ) : (
                <div className="h-full flex flex-col items-center justify-center text-slate-300 dark:text-gray-700 py-16">
                   <Cloud size={40} className="mb-4 opacity-50" />
                   <p className="text-base font-medium">Metadata not generated</p>
                   <button 
                     onClick={() => onRegenerate(item.id)}
                     disabled={isProcessing}
                     className="mt-6 px-5 py-2.5 bg-indigo-50 dark:bg-gray-800 text-indigo-600 dark:text-indigo-400 text-sm font-bold rounded-lg hover:bg-indigo-100 dark:hover:bg-gray-700 transition-colors"
                   >
                       Generate Now
                   </button>
                </div>
            )}
          </div>
          
          {/* Footer Actions */}
          <div className="px-8 py-5 border-t border-slate-100 dark:border-gray-800 flex justify-end gap-3 bg-slate-50/50 dark:bg-white/[0.02]">
             <button 
                onClick={() => onRegenerate(item.id)}
                disabled={isProcessing}
                className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-slate-500 hover:text-indigo-600 hover:bg-white border border-transparent hover:border-slate-200 rounded-lg transition-all disabled:opacity-50"
             >
                <RefreshCw size={14} className={isProcessing ? "animate-spin" : ""} /> Regenerate
             </button>
             <button 
                onClick={() => onRemove(item.id)}
                className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-slate-500 hover:text-red-600 hover:bg-white border border-transparent hover:border-red-100 rounded-lg transition-all"
             >
                <Trash2 size={14} /> Remove
             </button>
          </div>
        </div>
      </div>
    </div>
  );
}