import React, { useState } from 'react';
import { Copy, Check, TrendingUp, RefreshCw, X, AlertCircle } from 'lucide-react';
import { UploadedFile, StockMetadata, ProcessingStatus } from '../types';
import { getTrendingKeywords } from '../services/geminiService';

interface MetadataCardProps {
  item: UploadedFile;
  onRemove: (id: string) => void;
  onUpdateMetadata: (id: string, metadata: StockMetadata) => void;
  onAddTrending: (id: string, trending: string[]) => void;
}

export const MetadataCard: React.FC<MetadataCardProps> = ({ item, onRemove, onUpdateMetadata, onAddTrending }) => {
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [isSearchingTrends, setIsSearchingTrends] = useState(false);

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleFetchTrends = async () => {
    if (!item.metadata?.keywords) return;
    
    setIsSearchingTrends(true);
    try {
      const trends = await getTrendingKeywords(item.metadata.keywords);
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
    if (!item.metadata) return;
    const newKeywords = [...item.metadata.keywords, trend];
    onUpdateMetadata(item.id, { ...item.metadata, keywords: newKeywords });
  };

  const isProcessing = item.status === ProcessingStatus.ANALYZING || item.status === ProcessingStatus.UPLOADING;

  return (
    <div className="bg-slate-800 rounded-xl overflow-hidden border border-slate-700 shadow-xl flex flex-col md:flex-row mb-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Image Preview Side */}
      <div className="relative w-full md:w-1/3 bg-slate-900 min-h-[300px] flex items-center justify-center group">
        <img 
          src={item.previewUrl} 
          alt="Preview" 
          className="w-full h-full object-cover absolute inset-0 opacity-80 group-hover:opacity-100 transition-opacity" 
        />
        <div className="absolute top-2 right-2">
          <button 
            onClick={() => onRemove(item.id)}
            className="p-1.5 bg-black/50 hover:bg-red-500/80 text-white rounded-full transition-colors backdrop-blur-sm"
          >
            <X size={16} />
          </button>
        </div>
        
        {isProcessing && (
          <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm flex flex-col items-center justify-center z-10">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-indigo-500 mb-3"></div>
            <p className="text-indigo-400 font-medium animate-pulse">
              {item.status === ProcessingStatus.UPLOADING ? 'Reading...' : 'Analyzing with Gemini...'}
            </p>
          </div>
        )}

        {item.status === ProcessingStatus.ERROR && (
          <div className="absolute inset-0 bg-red-900/80 backdrop-blur-sm flex flex-col items-center justify-center z-10 p-4 text-center">
            <AlertCircle className="w-10 h-10 text-red-200 mb-2" />
            <p className="text-red-200 text-sm">{item.error || 'Analysis failed'}</p>
          </div>
        )}
      </div>

      {/* Metadata Form Side */}
      <div className="w-full md:w-2/3 p-6 flex flex-col space-y-4">
        {item.metadata ? (
          <>
            {/* Title */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Title ({item.metadata.title.length}/70)</label>
                <button 
                  onClick={() => copyToClipboard(item.metadata!.title, 'title')}
                  className="text-indigo-400 hover:text-indigo-300 text-xs flex items-center gap-1"
                >
                  {copiedField === 'title' ? <Check size={12} /> : <Copy size={12} />}
                  {copiedField === 'title' ? 'Copied' : 'Copy'}
                </button>
              </div>
              <input
                type="text"
                value={item.metadata.title}
                onChange={(e) => onUpdateMetadata(item.id, { ...item.metadata!, title: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 text-sm focus:ring-1 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            {/* Description */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Description ({item.metadata.description.length}/200)</label>
                <button 
                  onClick={() => copyToClipboard(item.metadata!.description, 'desc')}
                  className="text-indigo-400 hover:text-indigo-300 text-xs flex items-center gap-1"
                >
                  {copiedField === 'desc' ? <Check size={12} /> : <Copy size={12} />}
                  {copiedField === 'desc' ? 'Copied' : 'Copy'}
                </button>
              </div>
              <textarea
                value={item.metadata.description}
                onChange={(e) => onUpdateMetadata(item.id, { ...item.metadata!, description: e.target.value })}
                rows={3}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 text-sm focus:ring-1 focus:ring-indigo-500 focus:outline-none resize-none"
              />
            </div>

            {/* Category */}
            <div>
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">Category</label>
              <div className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 text-sm inline-block">
                {item.metadata.category}
              </div>
            </div>

            {/* Keywords */}
            <div className="flex-1 flex flex-col min-h-0">
              <div className="flex justify-between items-center mb-2">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Keywords ({item.metadata.keywords.length})
                </label>
                <div className="flex gap-3">
                  <button 
                    onClick={handleFetchTrends}
                    disabled={isSearchingTrends}
                    className="text-emerald-400 hover:text-emerald-300 text-xs flex items-center gap-1 disabled:opacity-50"
                  >
                    {isSearchingTrends ? <RefreshCw className="animate-spin" size={12} /> : <TrendingUp size={12} />}
                    Find Trends
                  </button>
                  <button 
                    onClick={() => copyToClipboard(item.metadata!.keywords.join(', '), 'keywords')}
                    className="text-indigo-400 hover:text-indigo-300 text-xs flex items-center gap-1"
                  >
                    {copiedField === 'keywords' ? <Check size={12} /> : <Copy size={12} />}
                    {copiedField === 'keywords' ? 'Copy All' : 'Copy All'}
                  </button>
                </div>
              </div>
              
              <div className="bg-slate-900 border border-slate-700 rounded-lg p-3 overflow-y-auto max-h-[150px]">
                <div className="flex flex-wrap gap-2">
                  {item.metadata.keywords.map((kw, idx) => (
                    <span key={idx} className="bg-slate-800 text-slate-300 px-2 py-1 rounded text-xs border border-slate-700 hover:border-indigo-500/50 transition-colors cursor-default">
                      {kw}
                      <button 
                        onClick={() => {
                          const newKw = item.metadata!.keywords.filter((_, i) => i !== idx);
                          onUpdateMetadata(item.id, { ...item.metadata!, keywords: newKw });
                        }}
                        className="ml-1.5 text-slate-500 hover:text-red-400"
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
                  <p className="text-xs text-emerald-400 mb-1 flex items-center gap-1">
                    <TrendingUp size={10} /> Trending Suggestions (Click to add)
                  </p>
                  <div className="flex flex-wrap gap-2">
                     {item.trendingContext.map((trend, idx) => (
                       !item.metadata?.keywords.includes(trend) && (
                        <button 
                          key={`trend-${idx}`}
                          onClick={() => handleAppendTrend(trend)}
                          className="bg-emerald-900/30 text-emerald-200 border border-emerald-800 hover:bg-emerald-900/50 px-2 py-1 rounded text-xs transition-colors"
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
          <div className="h-full flex flex-col items-center justify-center text-slate-600 space-y-3">
             <div className="w-16 h-16 rounded-full bg-slate-900 flex items-center justify-center">
                <span className="text-2xl font-bold text-slate-700">AI</span>
             </div>
             <p className="text-sm">Metadata will appear here after analysis.</p>
          </div>
        )}
      </div>
    </div>
  );
};
