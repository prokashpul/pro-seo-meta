import React, { useState } from 'react';
import { UploadCloud, Sparkles, Copy, Check, Loader2, Image as ImageIcon, Trash2, ArrowLeft, Download } from 'lucide-react';
import { FileUploader } from './FileUploader';
import { optimizeImage } from '../services/imageOptimizer';
import { generateImagePrompt } from '../services/geminiService';

interface PromptItem {
  id: string;
  file: File;
  previewUrl: string;
  prompt: string;
  status: 'idle' | 'loading' | 'completed' | 'error';
  error?: string;
}

interface PromptGeneratorProps {
  apiKey?: string;
  onBack?: () => void;
}

export const PromptGenerator: React.FC<PromptGeneratorProps> = ({ apiKey, onBack }) => {
  const [items, setItems] = useState<PromptItem[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);

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
    items.forEach(item => URL.revokeObjectURL(item.previewUrl));
    setItems([]);
  };

  const handleExportCSV = () => {
    const completedItems = items.filter(i => i.status === 'completed' && i.prompt);
    if (completedItems.length === 0) return;

    // CSV Construction using Blob to handle special characters and newlines correctly
    const headers = ['Filename', 'Prompt'];
    const rows = completedItems.map(item => [
      `"${item.file.name.replace(/"/g, '""')}"`, // Escape quotes
      `"${item.prompt.replace(/"/g, '""')}"`     // Escape quotes in prompt
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(r => r.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `prompts_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleGenerate = async (id: string) => {
    if (!apiKey) {
      alert("Please add your API Key in the settings first.");
      return;
    }

    setItems(prev => prev.map(i => i.id === id ? { ...i, status: 'loading', error: undefined } : i));

    try {
      const item = items.find(i => i.id === id);
      if (!item) return;

      const { base64, mimeType } = await optimizeImage(item.file);
      const prompt = await generateImagePrompt(base64, mimeType, apiKey);

      setItems(prev => prev.map(i => i.id === id ? { ...i, status: 'completed', prompt } : i));
    } catch (err: any) {
      setItems(prev => prev.map(i => i.id === id ? { ...i, status: 'error', error: err.message } : i));
    }
  };

  const handleGenerateAll = () => {
    if (!apiKey) {
      alert("Please add your API Key in the settings first.");
      return;
    }
    
    // Find all items that need generation
    const pendingItems = items.filter(i => i.status === 'idle' || i.status === 'error');
    
    // Trigger generation for each
    pendingItems.forEach(item => {
        handleGenerate(item.id);
    });
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const pendingCount = items.filter(i => i.status === 'idle' || i.status === 'error').length;

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      {onBack && (
        <button 
          onClick={onBack}
          className="mb-6 inline-flex items-center gap-2 text-sm text-slate-400 hover:text-indigo-500 transition-colors font-medium"
        >
          <ArrowLeft size={16} /> Back to Home
        </button>
      )}

      <div className="text-center mb-10">
        <h2 className="text-3xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-pink-500 to-orange-500">
          Reverse Image Prompts
        </h2>
        <p className="max-w-2xl mx-auto text-slate-600 dark:text-slate-400 text-lg">
          Upload an image to generate a short, realistic AI prompt that describes it. Perfect for Midjourney, Stable Diffusion, or Dall-E.
        </p>
      </div>

      <div className="mb-10">
        <FileUploader onFilesSelected={handleFilesSelected} />
      </div>

      {items.length > 0 && (
        <div className="flex flex-wrap md:flex-nowrap justify-between items-center gap-3 mb-6 sticky top-20 z-40 bg-white/90 dark:bg-slate-900/90 backdrop-blur p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div>
            {pendingCount > 0 && (
              <button
                onClick={handleGenerateAll}
                className="flex items-center gap-2 px-4 py-2 bg-pink-600 hover:bg-pink-500 text-white rounded-lg text-sm font-medium transition-colors shadow-sm shadow-pink-500/20"
              >
                <Sparkles size={16} />
                Generate All ({pendingCount})
              </button>
            )}
          </div>

          <div className="flex items-center gap-3 ml-auto">
            <button
              onClick={handleExportCSV}
              disabled={!items.some(i => i.status === 'completed')}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-200 dark:disabled:bg-slate-800 disabled:text-slate-400 dark:disabled:text-slate-600 disabled:cursor-not-allowed text-white rounded-lg text-sm font-medium transition-colors shadow-sm"
            >
              <Download size={16} />
              Export CSV
            </button>
            
            <button
              onClick={handleClearAll}
              className="flex items-center gap-2 px-4 py-2 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/40 text-red-600 dark:text-red-400 rounded-lg text-sm font-medium transition-colors border border-red-200 dark:border-red-800/50"
            >
              <Trash2 size={16} />
              Clear All
            </button>
          </div>
        </div>
      )}

      <div className="space-y-6">
        {items.map(item => (
          <div 
            key={item.id}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm flex flex-col md:flex-row"
          >
            {/* Image Section */}
            <div className="md:w-1/4 h-64 md:h-auto bg-slate-100 dark:bg-slate-950 relative group">
              <img src={item.previewUrl} alt="Preview" className="w-full h-full object-cover" />
              <button 
                onClick={() => handleRemove(item.id)}
                className="absolute top-2 right-2 p-2 bg-black/50 hover:bg-red-500 text-white rounded-lg transition-colors opacity-0 group-hover:opacity-100"
              >
                <Trash2 size={16} />
              </button>
            </div>

            {/* Content Section */}
            <div className="md:w-3/4 p-6 flex flex-col">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-2">
                  <ImageIcon size={18} className="text-pink-500" />
                  <span className="font-semibold text-slate-700 dark:text-slate-200">Generated Prompt</span>
                </div>
                {item.status === 'completed' && (
                  <button 
                    onClick={() => handleCopy(item.prompt, item.id)}
                    className="text-slate-400 hover:text-indigo-500 transition-colors"
                  >
                    {copiedId === item.id ? <Check size={18} className="text-emerald-500" /> : <Copy size={18} />}
                  </button>
                )}
              </div>

              <div className="flex-1 relative">
                {item.status === 'idle' && (
                  <div className="absolute inset-0 flex items-center justify-center text-slate-400 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-lg bg-slate-50 dark:bg-slate-900/50">
                    <p className="text-sm">Ready to generate</p>
                  </div>
                )}
                
                {item.status === 'loading' && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-indigo-500 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm z-10 rounded-lg">
                    <Loader2 size={32} className="animate-spin mb-2" />
                    <p className="text-sm font-medium">Analyzing image...</p>
                  </div>
                )}

                {item.status === 'error' && (
                   <div className="absolute inset-0 flex items-center justify-center text-red-500 bg-red-50 dark:bg-red-900/10 rounded-lg p-4 text-center">
                     <p className="text-sm">{item.error || "Generation failed"}</p>
                   </div>
                )}

                <textarea
                  readOnly
                  value={item.prompt}
                  className="w-full h-full min-h-[120px] p-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-pink-500/50 text-slate-700 dark:text-slate-300 leading-relaxed"
                  placeholder="The generated prompt will appear here..."
                />
              </div>

              <div className="mt-4 flex justify-end">
                <button
                  onClick={() => handleGenerate(item.id)}
                  disabled={item.status === 'loading'}
                  className="bg-pink-600 hover:bg-pink-500 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors shadow-lg shadow-pink-500/20"
                >
                  {item.status === 'completed' ? <Sparkles size={16} /> : <Sparkles size={16} />}
                  {item.status === 'completed' ? 'Regenerate' : 'Generate Prompt'}
                </button>
              </div>
            </div>
          </div>
        ))}

        {items.length === 0 && (
          <div className="text-center py-12 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
             <Sparkles className="mx-auto h-12 w-12 text-slate-300 dark:text-slate-700 mb-3" />
             <p className="text-slate-500 dark:text-slate-500">Upload images to get started</p>
          </div>
        )}
      </div>
    </div>
  );
};