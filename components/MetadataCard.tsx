import React, { useState, useEffect, useRef } from 'react';
import { Copy, Check, TrendingUp, RefreshCw, X, AlertCircle, Cloud, Loader2, FileType, Sparkles, Trash2, FilterX } from 'lucide-react';
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

  // Sync from props (Handle external updates like Bulk Edit)
  useEffect(() => {
    if (!item.metadata) return;

    // Initialize if first time or if we had no metadata before
    if (!lastSavedRef.current) {
        setLocalMetadata(item.metadata);
        lastSavedRef.current = item.metadata;
        return;
    }

    // Check for external changes by comparing prop with our last saved/known state
    const currentRef = lastSavedRef.current;
    const incoming = item.metadata;
    
    // Detect changes in specific fields
    const titleChanged = incoming.title !== currentRef.title;
    const descChanged = incoming.description !== currentRef.description;
    const catChanged = incoming.category !== currentRef.category;
    const kwChanged = JSON.stringify(incoming.keywords) !== JSON.stringify(currentRef.keywords);

    // If there are external changes, update the local state to match
    if (titleChanged || descChanged || catChanged || kwChanged) {
         setLocalMetadata(prev => {
             // If we have no local state yet, just take incoming
             if (!prev) return incoming;
             // Merge incoming changes
             return {
                 ...prev,
                 title: titleChanged ? incoming.title : prev.title,
                 description: descChanged ? incoming.description : prev.description,
                 keywords: kwChanged ? incoming.keywords : prev.keywords,
                 category: catChanged ? incoming.category : prev.category
             };
         });
         lastSavedRef.current = incoming;
         setSaveStatus('saved');
    }
  }, [item.metadata]);

  // Hide "Saved" message after a delay
  useEffect(() => {
    if (saveStatus === 'saved') {
      const timeout = setTimeout(() => {
        setSaveStatus('idle');
      }, 2000);
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
    
    // Auto-save after 3 seconds
    timerRef.current = setTimeout(() => {
        saveNow(newData);
    }, 3000);
  };

  const handleBlur = () => {
    // Save immediately on blur to prevent stale data on actions like "Export"
    if (saveStatus === 'saving' && localMetadata) {
        saveNow(localMetadata);
    }
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
      if (trends.length > 0) {
        onAddTrending(item.id, trends);
      }
    } catch (e) {
      console.error("Failed to fetch trends", e);
    } finally {
      setIsSearchingTrends(false);
    }
  };

  const handleAppendTrend = (trend: string) => {
    if (!localMetadata) return;
    // Avoid duplicates
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
    // Set preserves insertion order of the first occurrence
    const uniqueKeywords = [...new Set(localMetadata.keywords)];
    if (uniqueKeywords.length !== localMetadata.keywords.length) {
        handleImmediateUpdate({ ...localMetadata, keywords: uniqueKeywords });
    }
  };

  const isProcessing = item.status === ProcessingStatus.ANALYZING || item.status === ProcessingStatus.UPLOADING;

  // Limits
  const TITLE_MIN = 55;
  const TITLE_MAX = 150;
  const DESC_MIN = 70; // Optimization rule
  const DESC_MAX = 200; // Optimization rule
  const KEYWORD_MIN = 35;
  const KEYWORD_MAX = 49;

  // Use localMetadata for rendering if available, fallback to item.metadata
  const displayMetadata = localMetadata || item.metadata;
  
  // Check for duplicates
  const hasDuplicates = displayMetadata ? new Set(displayMetadata.keywords).size !== displayMetadata.keywords.length : false;

  return (
    <div 
      className={`rounded-xl overflow-hidden border shadow-xl flex flex-col md:flex-row mb-6 animate-in fade-in slide-in-from-bottom-4 transition-colors ${
        isSelected 
          ? 'border-indigo-500 ring-2 ring-indigo-500/20' 
          : 'border-slate-200 dark:border-slate-800'
      } bg-white dark:bg-slate-900`}
    >
      {/* Image / Preview Section */}
      <div className="md:w-1/3 bg-slate-100 dark:bg-slate-950 relative group">
        
        {/* Selection Overlay */}
        <div 
          className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors z-10 cursor-pointer"
          onClick={() => onToggleSelect(item.id)}
        />
        
        {/* Checkbox */}
        <div className="absolute top-3 left-3 z-20">
          <div 
            className={`w-6 h-6 rounded border shadow-sm flex items-center justify-center transition-all cursor-pointer ${
              isSelected 
                ? 'bg-indigo-500 border-indigo-500' 
                : 'bg-white/80 dark:bg-slate-800/80 border-slate-300 dark:border-slate-600 hover:border-indigo-400'
            }`}
            onClick={(e) => {
              e.stopPropagation();
              onToggleSelect(item.id);
            }}
          >
            {isSelected && <Check size={14} className="text-white" />}
          </div>
        </div>

        {/* Vector Badge */}
        {item.vectorFile && (
           <div className="absolute top-3 right-3 z-20 bg-emerald-500/90 text-white text-[10px] font-bold px-2 py-1 rounded shadow-sm flex items-center gap-1 backdrop-blur-sm">
             <FileType size={10} />
             VECTOR
           </div>
        )}

        {item.previewUrl ? (
          <img 
            src={item.previewUrl} 
            alt="Preview" 
            className="w-full h-64 md:h-full object-cover"
          />
        ) : (
          <div className="w-full h-64 md:h-full flex flex-col items-center justify-center text-slate-400">
             <AlertCircle size={48} className="mb-2 opacity-50" />
             <p className="text-sm font-medium">No Preview</p>
             <p className="text-xs">JPG/PNG required for analysis</p>
          </div>
        )}
        
        {/* Status Overlays */}
        {isProcessing && (
          <div className="absolute inset-0 bg-white/80 dark:bg-slate-900/80 flex flex-col items-center justify-center backdrop-blur-sm z-30">
            <Loader2 className="w-10 h-10 text-indigo-500 animate-spin mb-3" />
            <p className="text-indigo-600 dark:text-indigo-400 font-medium animate-pulse">Analyzing Image...</p>
          </div>
        )}

        {item.status === ProcessingStatus.ERROR && (
           <div className="absolute inset-0 bg-red-50/90 dark:bg-red-900/90 flex flex-col items-center justify-center backdrop-blur-sm z-30 px-6 text-center">
             <AlertCircle className="w-10 h-10 text-red-500 dark:text-red-300 mb-3" />
             <p className="text-red-600 dark:text-red-200 font-medium text-sm">{item.error || "Generation Failed"}</p>
           </div>
        )}

        {/* IDLE State */}
        {item.status === ProcessingStatus.IDLE && (
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center text-white/90 backdrop-blur-[1px] z-10 pointer-events-none">
                <div className="bg-black/50 px-4 py-2 rounded-lg backdrop-blur-md flex items-center gap-2">
                    <Sparkles size={16} className="text-yellow-400" />
                    <span className="font-medium text-sm">Ready to generate</span>
                </div>
            </div>
        )}
      </div>

      {/* Metadata Form Section */}
      <div className="md:w-2/3 p-6 flex flex-col relative">
        
        {/* Save Status Indicator */}
        <div className={`absolute top-4 right-6 text-xs font-medium flex items-center gap-1 transition-opacity duration-500 ${saveStatus === 'idle' ? 'opacity-0' : 'opacity-100'}`}>
            {saveStatus === 'saving' && <span className="text-indigo-500 flex items-center gap-1"><Loader2 size={10} className="animate-spin" /> Saving...</span>}
            {saveStatus === 'saved' && <span className="text-emerald-500 flex items-center gap-1"><Check size={10} /> Saved</span>}
            {saveStatus === 'modified' && <span className="text-amber-500">Unsaved</span>}
        </div>

        {displayMetadata ? (
          <div className="space-y-5">
            {/* Title */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Title</label>
                <div className="flex items-center gap-2">
                   <span className={`text-[10px] ${
                       displayMetadata.title.length < TITLE_MIN || displayMetadata.title.length > TITLE_MAX 
                       ? 'text-red-500 font-bold' 
                       : 'text-emerald-500'
                   }`}>
                       {displayMetadata.title.length} / {TITLE_MAX} chars (Min {TITLE_MIN})
                   </span>
                   <button onClick={() => copyToClipboard(displayMetadata.title, 'title')} className="text-slate-400 hover:text-indigo-500 dark:hover:text-indigo-400 transition-colors">
                     {copiedField === 'title' ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                   </button>
                </div>
              </div>
              <input
                type="text"
                value={displayMetadata.title}
                onChange={(e) => handleLocalChange('title', e.target.value)}
                onBlur={handleBlur}
                className={`w-full p-2.5 text-sm font-medium rounded-lg border focus:ring-1 focus:ring-indigo-500 focus:outline-none transition-colors dark:bg-slate-800 dark:text-white ${
                    displayMetadata.title.length < TITLE_MIN || displayMetadata.title.length > TITLE_MAX
                    ? 'border-red-300 dark:border-red-800 focus:border-red-500 bg-red-50 dark:bg-red-900/10'
                    : 'border-slate-200 dark:border-slate-700 bg-slate-50'
                }`}
              />
            </div>

            {/* Description */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Description</label>
                 <div className="flex items-center gap-2">
                   <span className={`text-[10px] ${
                       displayMetadata.description.length < DESC_MIN || displayMetadata.description.length > DESC_MAX
                       ? 'text-red-500 font-bold'
                       : 'text-emerald-500'
                   }`}>
                       {displayMetadata.description.length} / {DESC_MAX} chars (Min {DESC_MIN})
                   </span>
                   <button onClick={() => copyToClipboard(displayMetadata.description, 'description')} className="text-slate-400 hover:text-indigo-500 dark:hover:text-indigo-400 transition-colors">
                     {copiedField === 'description' ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                   </button>
                 </div>
              </div>
              <textarea
                value={displayMetadata.description}
                onChange={(e) => handleLocalChange('description', e.target.value)}
                onBlur={handleBlur}
                rows={3}
                className={`w-full p-2.5 text-sm text-slate-700 dark:text-slate-300 rounded-lg border focus:ring-1 focus:ring-indigo-500 focus:outline-none resize-none ${
                    displayMetadata.description.length < DESC_MIN || displayMetadata.description.length > DESC_MAX
                    ? 'border-red-300 dark:border-red-800 focus:border-red-500 bg-red-50 dark:bg-red-900/10'
                    : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800'
                }`}
              />
            </div>

            {/* Keywords */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-2">
                    Keywords
                    <span className={`px-1.5 py-0.5 rounded text-[10px] ${
                        displayMetadata.keywords.length < KEYWORD_MIN || displayMetadata.keywords.length > KEYWORD_MAX
                        ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'
                        : 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400'
                    }`}>
                        {displayMetadata.keywords.length} count
                    </span>
                    <span className="text-[10px] text-slate-400 font-normal normal-case">(Target: {KEYWORD_MIN}-{KEYWORD_MAX})</span>
                </label>
                <div className="flex gap-2">
                  <button 
                     onClick={handleFetchTrends}
                     disabled={isSearchingTrends}
                     className="flex items-center gap-1 text-[10px] bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 px-2 py-1 rounded hover:bg-purple-200 dark:hover:bg-purple-900/50 transition-colors disabled:opacity-50"
                     title="Find trending keywords via Google Search"
                  >
                    {isSearchingTrends ? <Loader2 size={10} className="animate-spin" /> : <TrendingUp size={10} />}
                    Find Trends
                  </button>

                  {/* Dedupe Button */}
                  {hasDuplicates && (
                    <button 
                        onClick={handleRemoveDuplicates}
                        className="flex items-center gap-1 text-[10px] bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 px-2 py-1 rounded hover:bg-orange-200 dark:hover:bg-orange-900/50 transition-colors"
                        title="Remove duplicate keywords"
                    >
                        <FilterX size={10} />
                        Dedupe
                    </button>
                  )}

                  <button onClick={() => copyToClipboard(displayMetadata.keywords.join(', '), 'keywords')} className="text-slate-400 hover:text-indigo-500 dark:hover:text-indigo-400 transition-colors">
                    {copiedField === 'keywords' ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                  </button>
                </div>
              </div>
              
              {/* Trending Suggestions */}
              {item.trendingContext && item.trendingContext.length > 0 && (
                  <div className="mb-3 p-3 bg-purple-50 dark:bg-purple-900/10 border border-purple-100 dark:border-purple-800/30 rounded-lg animate-in fade-in">
                      <div className="flex items-center gap-2 mb-2 text-purple-700 dark:text-purple-300 text-xs font-medium">
                          <TrendingUp size={12} />
                          <span>Trending Suggestions</span>
                          <span className="text-purple-400 dark:text-purple-500 text-[10px] font-normal ml-auto">Click to add</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                          {item.trendingContext.map((trend, i) => (
                             !displayMetadata.keywords.includes(trend) && (
                                <button
                                    key={i}
                                    onClick={() => handleAppendTrend(trend)}
                                    className="text-[10px] px-2 py-0.5 bg-white dark:bg-slate-800 border border-purple-200 dark:border-purple-800 text-purple-600 dark:text-purple-300 rounded-full hover:bg-purple-100 dark:hover:bg-purple-900/30 hover:border-purple-300 transition-colors"
                                >
                                    + {trend}
                                </button>
                             )
                          ))}
                          {item.trendingContext.every(t => displayMetadata.keywords.includes(t)) && (
                              <span className="text-[10px] text-purple-400 dark:text-purple-500 italic">All added</span>
                          )}
                      </div>
                  </div>
              )}

              <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto pr-1 custom-scrollbar">
                {displayMetadata.keywords.map((keyword, idx) => (
                  <span 
                    key={idx} 
                    className="inline-flex items-center px-2 py-1 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs border border-slate-200 dark:border-slate-700 group hover:border-indigo-300 dark:hover:border-indigo-700 transition-colors"
                  >
                    {keyword}
                    <button 
                      onClick={() => handleRemoveKeyword(idx)}
                      className="ml-1.5 text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X size={10} />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          </div>
        ) : (
           // Placeholder / Loading State Content
           <div className="flex-1 flex flex-col items-center justify-center text-slate-400 dark:text-slate-600">
              <Cloud size={48} className="mb-3 opacity-20" />
              <p className="text-sm">Metadata will appear here</p>
           </div>
        )}
        
        {/* Footer Actions (Bottom Right) */}
        <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center">
             <div className="flex items-center gap-2">
                 <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Category:</span>
                 <select 
                    value={displayMetadata ? displayMetadata.category : ''}
                    disabled={!displayMetadata}
                    onChange={(e) => handleLocalChange('category', e.target.value)}
                    onBlur={handleBlur}
                    className="text-xs font-medium text-slate-700 dark:text-slate-300 bg-transparent border-none focus:ring-0 cursor-pointer hover:text-indigo-600 dark:hover:text-indigo-400 disabled:opacity-50 disabled:cursor-not-allowed"
                 >
                     <option value={displayMetadata ? displayMetadata.category : ''}>{displayMetadata ? displayMetadata.category : 'None'}</option>
                     <option value="Business">Business</option>
                     <option value="Technology">Technology</option>
                     <option value="Nature">Nature</option>
                     <option value="People">People</option>
                     <option value="Lifestyle">Lifestyle</option>
                     <option value="Architecture">Architecture</option>
                     <option value="Food & Drink">Food & Drink</option>
                     <option value="Travel">Travel</option>
                 </select>
            </div>

            <div className="flex items-center gap-2">
                 <button 
                    onClick={() => onRegenerate(item.id)}
                    disabled={isProcessing}
                    className={`p-2 rounded-lg transition-colors ${
                        isProcessing 
                        ? 'text-slate-300 dark:text-slate-600 cursor-not-allowed'
                        : 'text-slate-400 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/20'
                    }`}
                    title="Regenerate Metadata"
                 >
                    <RefreshCw size={16} className={isProcessing ? "animate-spin" : ""} />
                 </button>
                 
                 <button 
                    onClick={() => onRemove(item.id)}
                    className="p-2 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                    title="Remove File"
                 >
                    <Trash2 size={16} />
                 </button>
            </div>
        </div>
      </div>
    </div>
  );
}