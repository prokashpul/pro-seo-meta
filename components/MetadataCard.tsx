import React, { useState, useEffect, useRef } from 'react';
import { Copy, Check, TrendingUp, RefreshCw, X, AlertCircle, Cloud, Loader2, FileType, Sparkles } from 'lucide-react';
import { UploadedFile, StockMetadata, ProcessingStatus } from '../types';
import { getTrendingKeywords } from '../services/geminiService';

interface MetadataCardProps {
  item: UploadedFile;
  isSelected: boolean;
  onToggleSelect: (id: string) => void;
  onRemove: (id: string) => void;
  onUpdateMetadata: (id: string, metadata: StockMetadata) => void;
  onAddTrending: (id: string, trending: string[]) => void;
}

export const MetadataCard: React.FC<MetadataCardProps> = ({ 
  item, 
  isSelected,
  onToggleSelect,
  onRemove, 
  onUpdateMetadata, 
  onAddTrending 
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
             if (!prev) return incoming;
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
      const trends = await getTrendingKeywords(localMetadata.keywords);
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
    const newKeywords = [...localMetadata.keywords, trend];
    handleImmediateUpdate({ ...localMetadata, keywords: newKeywords });
  };

  const handleRemoveKeyword = (idx: number) => {
      if (!localMetadata) return;
      const newKw = localMetadata.keywords.filter((_, i) => i !== idx);
      handleImmediateUpdate({ ...localMetadata, keywords: newKw });
  }

  const isProcessing = item.status === ProcessingStatus.ANALYZING || item.status === ProcessingStatus.UPLOADING;

  // Limits
  const TITLE_MIN = 55;
  const TITLE_MAX = 150;
  const DESC_MAX = 180;
  const KEYWORD_MIN = 35;
  const KEYWORD_MAX = 49;

  // Use localMetadata for rendering if available, fallback to item.metadata (though logic ensures localMetadata is sync'd)
  const displayMetadata = localMetadata || item.metadata;

  return (
    <div 
      className={`rounded-xl overflow-hidden border shadow-xl flex flex-col md:flex-row mb-6 animate-in fade-in slide-in-from-bottom-4 duration-500 transition-all
        ${isSelected 
          ? 'border-indigo-500 ring-1 ring-indigo-500/50' 
          : 'border-slate-200 dark:border-slate-700'
        }
        bg-white dark:bg-slate-800
      `}
    >
      {/* Image Preview Side */}
      <div className="relative w-full md:w-1/3 min-h-[300px] flex items-center justify-center group bg-slate-100 dark:bg-slate-900">
        {item.previewUrl ? (
          <img 
            src={item.previewUrl} 
            alt="Preview" 
            className="w-full h-full object-cover absolute inset-0 opacity-80 group-hover:opacity-100 transition-opacity" 
          />
        ) : (
          <div className="flex flex-col items-center justify-center p-6 text-slate-500">
             <div className="w-12 h-12 rounded-full border-2 flex items-center justify-center mb-2 bg-slate-200 dark:bg-slate-800 border-slate-300 dark:border-slate-700">
               <FileType size={24} />
             </div>
             <p className="text-sm font-medium">No Preview</p>
          </div>
        )}
        
        {/* Selection Checkbox */}
        <div className="absolute top-2 left-2 z-20">
           <div 
             onClick={(e) => { e.stopPropagation(); onToggleSelect(item.id); }}
             className={`w-6 h-6 rounded border-2 cursor-pointer flex items-center justify-center transition-all shadow-lg ${
               isSelected 
                 ? 'bg-indigo-500 border-indigo-500' 
                 : 'bg-white/80 dark:bg-black/40 border-slate-400 dark:border-white/70 hover:scale-105'
             }`}
           >
             {isSelected && <Check size={14} className="text-white" />}
           </div>
        </div>

        {/* Vector Attached Badge */}
        {item.vectorFile && (
          <div className="absolute bottom-2 left-2 z-20">
             <span className="bg-indigo-600/90 text-white text-[10px] px-2 py-1 rounded shadow-lg border border-indigo-500/50 flex items-center gap-1">
               <FileType size={10} />
               Vector Attached ({item.vectorFile.name.split('.').pop()?.toUpperCase()})
             </span>
          </div>
        )}

        <div className="absolute top-2 right-2 z-20">
          <button 
            onClick={() => onRemove(item.id)}
            className="p-1.5 bg-white/50 dark:bg-black/50 hover:bg-red-500/80 hover:text-white rounded-full transition-colors backdrop-blur-sm text-slate-700 dark:text-white"
          >
            <X size={16} />
          </button>
        </div>
        
        {isProcessing && (
          <div className="absolute inset-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm flex flex-col items-center justify-center z-10">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-indigo-500 mb-3"></div>
            <p className="text-indigo-600 dark:text-indigo-400 font-medium animate-pulse">
              {item.status === ProcessingStatus.UPLOADING ? 'Reading...' : 'Analyzing with Gemini...'}
            </p>
          </div>
        )}

        {item.status === ProcessingStatus.ERROR && (
          <div className="absolute inset-0 bg-red-50/90 dark:bg-red-900/80 backdrop-blur-sm flex flex-col items-center justify-center z-10 p-4 text-center">
            <AlertCircle className="w-10 h-10 text-red-500 dark:text-red-200 mb-2" />
            <p className="text-red-600 dark:text-red-200 text-sm mb-2">{item.error || 'Analysis failed'}</p>
            {item.error?.includes("Missing Preview") && (
                <p className="text-xs text-red-500 dark:text-red-300 bg-white/50 dark:bg-black/20 px-2 py-1 rounded">
                    Please upload a matching JPG/PNG file
                </p>
            )}
          </div>
        )}
      </div>

      {/* Metadata Form Side */}
      <div className="w-full md:w-2/3 p-6 flex flex-col space-y-4 relative">
        {/* Save Status Indicator */}
        {displayMetadata && (
            <div className="absolute top-5 right-6 flex items-center gap-2 pointer-events-none z-10 h-5">
                {saveStatus === 'saving' && (
                    <span className="text-xs text-indigo-500 dark:text-indigo-400 flex items-center gap-1.5 animate-in fade-in duration-300">
                        <Loader2 size={12} className="animate-spin" /> Saving...
                    </span>
                )}
                {saveStatus === 'saved' && (
                    <span className="text-xs text-emerald-500 dark:text-emerald-400 flex items-center gap-1.5 animate-in fade-in zoom-in-95 duration-300">
                        <Cloud size={12} /> Saved
                    </span>
                )}
            </div>
        )}

        {displayMetadata ? (
          <>
            {/* Title */}
            <div className="mt-2">
              <div className="flex justify-between items-center mb-1">
                <div className="flex items-center gap-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Title</label>
                  <span className={`text-[10px] px-1.5 rounded border ${
                    displayMetadata.title.length < TITLE_MIN 
                      ? 'bg-amber-100 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-500/20' 
                      : 'bg-emerald-100 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20'
                  }`}>
                    {displayMetadata.title.length < TITLE_MIN ? `Min ${TITLE_MIN} chars` : 'Good length'}
                  </span>
                </div>
                <div className="flex items-center gap-3 pr-16"> {/* pr-16 for save indicator space */}
                  <span className={`text-xs ${displayMetadata.title.length > TITLE_MAX ? 'text-red-500' : 'text-slate-500'}`}>
                    {Math.max(0, TITLE_MAX - displayMetadata.title.length)} remaining
                  </span>
                  <button 
                    onClick={() => copyToClipboard(displayMetadata.title, 'title')}
                    className="text-indigo-500 dark:text-indigo-400 hover:text-indigo-600 dark:hover:text-indigo-300 text-xs flex items-center gap-1"
                  >
                    {copiedField === 'title' ? <Check size={12} /> : <Copy size={12} />}
                    {copiedField === 'title' ? 'Copied' : 'Copy'}
                  </button>
                </div>
              </div>
              <input
                type="text"
                value={displayMetadata.title}
                maxLength={TITLE_MAX}
                onChange={(e) => handleLocalChange('title', e.target.value)}
                onBlur={handleBlur}
                className={`w-full border rounded-lg px-3 py-2 text-sm focus:ring-1 focus:outline-none 
                  bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-200
                  ${displayMetadata.title.length < TITLE_MIN 
                    ? 'border-amber-500/30 focus:border-amber-500 focus:ring-amber-500' 
                    : 'border-slate-300 dark:border-slate-700 focus:ring-indigo-500'
                }`}
              />
            </div>

            {/* Description */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Description</label>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-slate-500">
                    {Math.max(0, DESC_MAX - displayMetadata.description.length)} remaining
                  </span>
                  <button 
                    onClick={() => copyToClipboard(displayMetadata.description, 'desc')}
                    className="text-indigo-500 dark:text-indigo-400 hover:text-indigo-600 dark:hover:text-indigo-300 text-xs flex items-center gap-1"
                  >
                    {copiedField === 'desc' ? <Check size={12} /> : <Copy size={12} />}
                    {copiedField === 'desc' ? 'Copied' : 'Copy'}
                  </button>
                </div>
              </div>
              <textarea
                value={displayMetadata.description}
                maxLength={DESC_MAX}
                onChange={(e) => handleLocalChange('description', e.target.value)}
                onBlur={handleBlur}
                rows={3}
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-slate-200 text-sm focus:ring-1 focus:ring-indigo-500 focus:outline-none resize-none"
              />
            </div>

            {/* Category */}
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider block mb-1 text-slate-500 dark:text-slate-400">Category</label>
              <div className="bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-slate-200 text-sm inline-block">
                {displayMetadata.category}
              </div>
            </div>

            {/* Keywords */}
            <div className="flex-1 flex flex-col min-h-0">
              <div className="flex justify-between items-center mb-2">
                <div className="flex items-center gap-2">
                   <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                     Keywords
                   </label>
                   <span className={`text-[10px] px-1.5 rounded border ${
                      displayMetadata.keywords.length < KEYWORD_MIN || displayMetadata.keywords.length > KEYWORD_MAX
                       ? 'bg-amber-100 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-500/20' 
                       : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-600'
                   }`}>
                     {displayMetadata.keywords.length} / {KEYWORD_MAX}
                   </span>
                   {(displayMetadata.keywords.length < KEYWORD_MIN) && (
                     <span className="text-[10px] text-amber-500">Min {KEYWORD_MIN} recommended</span>
                   )}
                </div>

                <div className="flex gap-3">
                  <button 
                    onClick={handleFetchTrends}
                    disabled={isSearchingTrends}
                    className="text-emerald-600 dark:text-emerald-400 hover:text-emerald-500 dark:hover:text-emerald-300 text-xs flex items-center gap-1 disabled:opacity-50"
                  >
                    {isSearchingTrends ? <RefreshCw className="animate-spin" size={12} /> : <TrendingUp size={12} />}
                    Find Trends
                  </button>
                  <button 
                    onClick={() => copyToClipboard(displayMetadata.keywords.join(', '), 'keywords')}
                    className="text-indigo-500 dark:text-indigo-400 hover:text-indigo-600 dark:hover:text-indigo-300 text-xs flex items-center gap-1"
                  >
                    {copiedField === 'keywords' ? <Check size={12} /> : <Copy size={12} />}
                    {copiedField === 'keywords' ? 'Copy All' : 'Copy All'}
                  </button>
                </div>
              </div>
              
              <div className={`rounded-lg p-3 overflow-y-auto max-h-[150px] border bg-slate-50 dark:bg-slate-900 ${
                 displayMetadata.keywords.length < KEYWORD_MIN ? 'border-amber-500/30' : 'border-slate-300 dark:border-slate-700'
              }`}>
                <div className="flex flex-wrap gap-2">
                  {displayMetadata.keywords.map((kw, idx) => (
                    <span key={idx} className="bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2 py-1 rounded text-xs border border-slate-200 dark:border-slate-700 hover:border-indigo-500/50 transition-colors cursor-default shadow-sm">
                      {kw}
                      <button 
                        onClick={() => handleRemoveKeyword(idx)}
                        className="ml-1.5 text-slate-400 hover:text-red-500"
                      >
                        &times;
                      </button>
                    </span>
                  ))}
                </div>
              </div>
              
              {/* Trending Suggestions */}
              {item.trendingContext && item.trendingContext.length > 0 && (
                <div className="mt-2 animate-in fade-in slide-in-from-top-2">
                  <p className="text-xs text-emerald-600 dark:text-emerald-400 mb-1 flex items-center gap-1">
                    <TrendingUp size={10} /> Trending Suggestions (Click to add)
                  </p>
                  <div className="flex flex-wrap gap-2">
                     {item.trendingContext.map((trend, idx) => (
                       !displayMetadata.keywords.includes(trend) && (
                        <button 
                          key={`trend-${idx}`}
                          onClick={() => handleAppendTrend(trend)}
                          disabled={displayMetadata.keywords.length >= KEYWORD_MAX}
                          className="bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 px-2 py-1 rounded text-xs transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          + {trend}
                        </button>
                       )
                     ))}
                  </div>
                </div>
              )}
            </div>
          </>
        ) : (
          /* Placeholder state before metadata exists */
          <div className="h-full flex flex-col items-center justify-center text-slate-500 dark:text-slate-600 space-y-3">
             <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-900 flex items-center justify-center">
                {item.status === ProcessingStatus.ERROR ? (
                   <AlertCircle className="text-red-500" size={32} />
                ) : item.status === ProcessingStatus.IDLE ? (
                   <Sparkles className="text-indigo-400" size={32} />
                ) : (
                   <span className="text-2xl font-bold text-slate-400 dark:text-slate-700">AI</span>
                )}
             </div>
             <p className="text-sm">
                {item.status === ProcessingStatus.ERROR 
                  ? "Analysis failed. See error details." 
                  : item.status === ProcessingStatus.IDLE
                    ? "Ready to generate."
                    : "Metadata will appear here after analysis."}
             </p>
          </div>
        )}
      </div>
    </div>
  );
};