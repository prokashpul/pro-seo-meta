

import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, Download, Trash2, ArrowLeft, Image as ImageIcon, Loader2, Plus, FileText, XCircle, Zap, ImagePlus, Wand2, Settings2, RefreshCw } from 'lucide-react';
import { generateImageFromText } from '../services/geminiService';
import { optimizeImage } from '../services/imageOptimizer';
import { ImageGenItem } from '../types';
import JSZip from 'jszip';

interface ImageGeneratorProps {
  apiKey?: string;
  onBack?: () => void;
}

type GenMode = 'GENERATE' | 'EDIT';

export const ImageGenerator: React.FC<ImageGeneratorProps> = ({ apiKey, onBack }) => {
  const [items, setItems] = useState<ImageGenItem[]>([]);
  const [promptInput, setPromptInput] = useState('');
  const [imageCount, setImageCount] = useState(1);
  const [mode, setMode] = useState<GenMode>('GENERATE');
  
  // Advanced Settings State
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [negativePrompt, setNegativePrompt] = useState('');
  const [guidanceScale, setGuidanceScale] = useState(7);
  const [seed, setSeed] = useState<string>('');

  // Edit Mode State
  const [editSourceImage, setEditSourceImage] = useState<{file: File, previewUrl: string} | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageUploadRef = useRef<HTMLInputElement>(null);
  const [isProcessingAll, setIsProcessingAll] = useState(false);
  const stopRequestedRef = useRef(false);

  // Hardcoded Flash 2.5 Model
  const MODEL_ID = 'gemini-2.5-flash-image';

  // Load Settings from LocalStorage
  useEffect(() => {
    const savedNeg = localStorage.getItem('imgGen_negativePrompt');
    const savedScale = localStorage.getItem('imgGen_guidanceScale');
    const savedSeed = localStorage.getItem('imgGen_seed');

    if (savedNeg) setNegativePrompt(savedNeg);
    if (savedScale) setGuidanceScale(Number(savedScale));
    if (savedSeed) setSeed(savedSeed);
  }, []);

  // Save Settings to LocalStorage
  useEffect(() => {
    localStorage.setItem('imgGen_negativePrompt', negativePrompt);
    localStorage.setItem('imgGen_guidanceScale', String(guidanceScale));
    localStorage.setItem('imgGen_seed', seed);
  }, [negativePrompt, guidanceScale, seed]);

  const handleSourceImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
          const file = e.target.files[0];
          setEditSourceImage({
              file,
              previewUrl: URL.createObjectURL(file)
          });
      }
  };

  const handleAddPrompt = async () => {
    if (!promptInput.trim()) return;
    
    let sourceImageData = undefined;

    if (mode === 'EDIT' && editSourceImage) {
        try {
            const { base64, mimeType } = await optimizeImage(editSourceImage.file);
            sourceImageData = {
                base64,
                mimeType,
                previewUrl: editSourceImage.previewUrl
            };
        } catch (e) {
            console.error("Failed to process source image", e);
            alert("Failed to process source image. Please try another file.");
            return;
        }
    } else if (mode === 'EDIT' && !editSourceImage) {
        alert("Please upload an image to edit.");
        return;
    }
    
    const newItems: ImageGenItem[] = [];
    const seedNum = seed ? parseInt(seed) : undefined;

    // Create multiple items based on imageCount
    for (let i = 0; i < imageCount; i++) {
        // If specific seed set, increment it for duplicates to avoid exact same image if user requested > 1
        // If random (undefined), keep it undefined
        const currentSeed = seedNum !== undefined ? seedNum + i : undefined;

        newItems.push({
            id: Math.random().toString(36).substring(7),
            prompt: promptInput.trim(),
            aspectRatio: '1:1', // Defaulting to 1:1
            status: 'idle',
            sourceImage: sourceImageData,
            advancedSettings: {
                negativePrompt: negativePrompt.trim(),
                guidanceScale,
                seed: currentSeed
            }
        });
    }
    
    setItems(prev => [...newItems, ...prev]); 
    setPromptInput('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleAddPrompt();
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (mode === 'EDIT' && !editSourceImage) {
        alert("Please upload a source image first to apply edits from CSV.");
        e.target.value = '';
        return;
    }

    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = event.target?.result as string;
      if (!text) return;

      const lines = text.split(/\r?\n/);
      const newItems: ImageGenItem[] = [];
      
      let sourceImageData: any = undefined;
      if (mode === 'EDIT' && editSourceImage) {
          const { base64, mimeType } = await optimizeImage(editSourceImage.file);
          sourceImageData = { base64, mimeType, previewUrl: editSourceImage.previewUrl };
      }

      const seedNum = seed ? parseInt(seed) : undefined;

      lines.forEach(line => {
        let prompt = line.trim();
        if (prompt.startsWith('"') && prompt.endsWith('"')) {
          prompt = prompt.substring(1, prompt.length - 1);
        }
        
        if (prompt && prompt.toLowerCase() !== 'prompt') {
            for (let i = 0; i < imageCount; i++) {
                const currentSeed = seedNum !== undefined ? seedNum + i : undefined;
                newItems.push({
                    id: Math.random().toString(36).substring(7),
                    prompt,
                    aspectRatio: '1:1',
                    status: 'idle',
                    sourceImage: sourceImageData,
                    advancedSettings: {
                        negativePrompt: negativePrompt.trim(),
                        guidanceScale,
                        seed: currentSeed
                    }
                });
            }
        }
      });
      
      setItems(prev => [...prev, ...newItems]);
      e.target.value = '';
    };
    reader.readAsText(file);
  };

  const handleRemove = (id: string) => {
    setItems(prev => prev.filter(i => i.id !== id));
  };

  const handleClearAll = () => {
    setItems([]);
  };

  const generateSingle = async (id: string) => {
    if (!apiKey) {
      alert("Please add your API Key in settings.");
      return;
    }

    setItems(prev => prev.map(i => i.id === id ? { ...i, status: 'generating', error: undefined } : i));

    try {
      const item = items.find(i => i.id === id);
      if (!item) return;

      const imageUrl = await generateImageFromText(
          item.prompt, 
          item.aspectRatio, 
          MODEL_ID, 
          apiKey,
          item.sourceImage,
          item.advancedSettings
      );

      setItems(prev => prev.map(i => i.id === id ? { ...i, status: 'completed', generatedImageUrl: imageUrl } : i));
    } catch (err: any) {
      setItems(prev => prev.map(i => i.id === id ? { ...i, status: 'error', error: err.message || 'Generation failed' } : i));
    }
  };

  const handleStop = () => {
      stopRequestedRef.current = true;
      setIsProcessingAll(false);
  };

  const handleGenerateAll = async () => {
    if (!apiKey) {
        alert("Please add your API Key in settings.");
        return;
    }
    
    setIsProcessingAll(true);
    stopRequestedRef.current = false;
    
    const pending = items.filter(i => i.status === 'idle' || i.status === 'error');
    
    const BATCH_SIZE = 1;
    for (let i = 0; i < pending.length; i += BATCH_SIZE) {
        if (stopRequestedRef.current) {
            break;
        }

        const batch = pending.slice(i, i + BATCH_SIZE);
        await Promise.all(batch.map(item => generateSingle(item.id)));
        
        if (i + BATCH_SIZE < pending.length && !stopRequestedRef.current) {
             await new Promise(resolve => setTimeout(resolve, 20000));
        }
    }

    setIsProcessingAll(false);
  };

  const downloadImage = (url: string, id: string) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = `generated_image_${id}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportZip = async () => {
    const completed = items.filter(i => i.status === 'completed' && i.generatedImageUrl);
    if (completed.length === 0) return;

    try {
      const zip = new JSZip();
      
      completed.forEach((item, index) => {
          if (item.generatedImageUrl) {
              const base64Data = item.generatedImageUrl.split(',')[1];
              const safePrompt = item.prompt.substring(0, 30).replace(/[^a-z0-9]/gi, '_');
              const suffix = item.sourceImage ? '_edit' : '';
              const filename = `${safePrompt}${suffix}_${index}.png`;
              zip.file(filename, base64Data, { base64: true });
          }
      });

      const content = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(content);
      const link = document.createElement('a');
      link.href = url;
      link.download = `generated_images_${new Date().toISOString().slice(0, 10)}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error("Zip export failed", e);
      alert("Failed to export ZIP file.");
    }
  };

  const pendingCount = items.filter(i => i.status === 'idle' || i.status === 'error').length;
  const completedCount = items.filter(i => i.status === 'completed').length;

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      {onBack && (
        <button 
          onClick={onBack}
          className="mb-6 inline-flex items-center gap-2 text-sm text-slate-400 hover:text-indigo-500 transition-colors font-medium"
        >
          <ArrowLeft size={16} /> Back to Home
        </button>
      )}

      <div className="text-center mb-10">
        <h2 className="text-3xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-emerald-500 to-teal-500">
          AI Image Lab
        </h2>
        <p className="max-w-2xl mx-auto text-slate-600 dark:text-slate-400 text-lg">
          Generate or Edit images using the fast <strong>Flash 2.5</strong> model.
        </p>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm mb-8">
        
        {/* Mode Toggle */}
        <div className="flex justify-center mb-6">
            <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
                <button
                    onClick={() => { setMode('GENERATE'); setEditSourceImage(null); }}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${
                        mode === 'GENERATE' 
                        ? 'bg-emerald-600 text-white shadow-sm' 
                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                    }`}
                >
                    <ImagePlus size={16} /> Generate (Text-to-Image)
                </button>
                <button
                    onClick={() => setMode('EDIT')}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${
                        mode === 'EDIT' 
                        ? 'bg-indigo-600 text-white shadow-sm' 
                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                    }`}
                >
                    <Wand2 size={16} /> Edit (Image-to-Image)
                </button>
            </div>
        </div>

        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
             {/* Source Image Uploader for Edit Mode */}
             {mode === 'EDIT' && (
                 <div className="mb-4">
                     <label className="block text-xs font-semibold uppercase tracking-wider mb-2 text-slate-500 dark:text-slate-400">
                        Reference Image (Required)
                     </label>
                     <input 
                        type="file"
                        ref={imageUploadRef}
                        accept="image/*"
                        className="hidden"
                        onChange={handleSourceImageSelect}
                     />
                     <div 
                        onClick={() => imageUploadRef.current?.click()}
                        className={`border-2 border-dashed rounded-lg p-4 flex items-center justify-center gap-4 cursor-pointer transition-colors ${
                            editSourceImage 
                            ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20' 
                            : 'border-slate-300 dark:border-slate-700 hover:border-indigo-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                        }`}
                     >
                        {editSourceImage ? (
                            <>
                                <img src={editSourceImage.previewUrl} alt="Source" className="h-16 w-16 object-cover rounded shadow-sm" />
                                <div className="text-left">
                                    <p className="text-sm font-medium text-slate-700 dark:text-slate-200 truncate max-w-[200px]">{editSourceImage.file.name}</p>
                                    <p className="text-xs text-indigo-500">Click to change</p>
                                </div>
                            </>
                        ) : (
                            <div className="flex flex-col items-center py-2 text-slate-400">
                                <ImageIcon size={24} className="mb-1" />
                                <p className="text-sm">Click to upload image</p>
                            </div>
                        )}
                     </div>
                 </div>
             )}

            <label className="block text-xs font-semibold uppercase tracking-wider mb-2 text-slate-500 dark:text-slate-400">
              {mode === 'EDIT' ? 'Edit Instructions' : 'Prompt'}
            </label>
            <textarea
              value={promptInput}
              onChange={(e) => setPromptInput(e.target.value)}
              onKeyDown={handleKeyDown}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-4 py-3 text-slate-900 dark:text-slate-200 focus:ring-2 focus:ring-emerald-500 focus:outline-none resize-none h-32 placeholder-slate-400"
              placeholder={mode === 'EDIT' ? "e.g., 'Add a retro filter', 'Make it snowing', 'Change background to beach'..." : "Describe the image you want to generate..."}
            />
            
            {/* Advanced Settings Toggle */}
             <div className="mt-4">
               <button 
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  className="flex items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400 hover:text-emerald-500 transition-colors"
               >
                  <Settings2 size={14} />
                  {showAdvanced ? 'Hide Advanced Settings' : 'Show Advanced Settings'}
               </button>
               
               {showAdvanced && (
                 <div className="mt-3 p-4 bg-slate-50 dark:bg-slate-950 rounded-lg border border-slate-200 dark:border-slate-800 animate-in fade-in slide-in-from-top-2">
                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-semibold uppercase tracking-wider mb-2 text-slate-500 dark:text-slate-400">
                                Negative Prompt (Exclude)
                            </label>
                            <input 
                                value={negativePrompt}
                                onChange={(e) => setNegativePrompt(e.target.value)}
                                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-md px-3 py-2 text-sm text-slate-800 dark:text-slate-200 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                                placeholder="blurry, bad quality, low resolution, watermark..."
                            />
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-semibold uppercase tracking-wider mb-2 text-slate-500 dark:text-slate-400 flex justify-between">
                                    <span>Guidance Scale</span>
                                    <span className="text-emerald-500">{guidanceScale}</span>
                                </label>
                                <input 
                                    type="range"
                                    min="1"
                                    max="20"
                                    step="0.5"
                                    value={guidanceScale}
                                    onChange={(e) => setGuidanceScale(parseFloat(e.target.value))}
                                    className="w-full accent-emerald-500"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold uppercase tracking-wider mb-2 text-slate-500 dark:text-slate-400 flex items-center justify-between">
                                    Seed
                                    <button 
                                        onClick={() => setSeed(String(Math.floor(Math.random() * 10000000)))}
                                        className="text-[10px] text-emerald-500 hover:underline flex items-center gap-1"
                                        title="Randomize"
                                    >
                                        <RefreshCw size={10} /> Random
                                    </button>
                                </label>
                                <input 
                                    type="number"
                                    value={seed}
                                    onChange={(e) => setSeed(e.target.value)}
                                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-md px-3 py-2 text-sm text-slate-800 dark:text-slate-200 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                                    placeholder="Random if empty"
                                />
                            </div>
                        </div>
                    </div>
                 </div>
               )}
             </div>

          </div>
          
          <div className="md:w-64 flex flex-col gap-4">
            
            {/* Aspect Ratio System Removed */}

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider mb-2 text-slate-500 dark:text-slate-400">
                Number of Images
              </label>
              <div className="flex gap-1 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-1">
                 {[1, 2, 3, 4].map(num => (
                    <button
                        key={num}
                        onClick={() => setImageCount(num)}
                        className={`flex-1 py-1.5 text-sm font-medium rounded transition-colors ${
                            imageCount === num 
                            ? 'bg-white dark:bg-slate-800 text-emerald-600 shadow-sm' 
                            : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
                        }`}
                    >
                        {num}
                    </button>
                 ))}
              </div>
            </div>

            <div>
               <label className="block text-xs font-semibold uppercase tracking-wider mb-2 text-slate-500 dark:text-slate-400">
                 Model
               </label>
               <div className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2.5 text-slate-500 dark:text-slate-400 text-sm cursor-not-allowed flex items-center gap-2">
                 <Zap size={14} className="text-emerald-500" />
                 Flash 2.5 (Fast)
               </div>
            </div>
            
            <button
              onClick={handleAddPrompt}
              disabled={!promptInput.trim() || (mode === 'EDIT' && !editSourceImage)}
              className="flex-1 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg font-medium flex items-center justify-center gap-2 transition-colors"
            >
              <Plus size={18} />
              Add to Queue
            </button>
          </div>
        </div>
        
        <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
           <div className="flex items-center gap-2">
             <input 
                type="file" 
                ref={fileInputRef}
                accept=".csv"
                className="hidden"
                onChange={handleFileUpload}
             />
             <button 
               onClick={() => fileInputRef.current?.click()}
               className="text-sm text-slate-500 dark:text-slate-400 hover:text-emerald-500 flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors border border-slate-200 dark:border-slate-700"
             >
                <FileText size={16} />
                Upload CSV
             </button>
             <span className="text-xs text-slate-400">Bulk upload prompts {mode === 'EDIT' && '(Applied to Reference Image)'}</span>
           </div>
           
           <div className="text-xs text-slate-400">
             {items.length} images queued
           </div>
        </div>
      </div>

      {items.length > 0 && (
         <div className="flex flex-wrap gap-3 mb-6 sticky top-20 z-40 bg-white/90 dark:bg-slate-900/90 backdrop-blur p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm justify-between items-center">
             <div className="flex items-center gap-3">
                {pendingCount > 0 && (
                  !isProcessingAll ? (
                   <button
                     onClick={handleGenerateAll}
                     className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-colors shadow-sm shadow-indigo-500/20"
                   >
                     <Sparkles size={16} />
                     Generate All ({pendingCount})
                   </button>
                  ) : (
                   <button
                     onClick={handleStop}
                     className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg text-sm font-medium transition-colors shadow-sm"
                   >
                     <XCircle size={16} />
                     Stop Generation
                   </button>
                  )
                )}
                {isProcessingAll && (
                    <span className="text-xs text-indigo-500 font-medium animate-pulse flex items-center gap-1">
                        <Loader2 size={12} className="animate-spin" /> Processing... (Waiting to avoid rate limits)
                    </span>
                )}
             </div>
             
             <div className="flex items-center gap-3">
               <button
                  onClick={handleExportZip}
                  disabled={completedCount === 0}
                  className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-200 dark:disabled:bg-slate-800 disabled:text-slate-400 dark:disabled:text-slate-600 disabled:cursor-not-allowed text-white rounded-lg text-sm font-medium transition-colors shadow-sm"
                >
                  <Download size={16} />
                  Download ZIP
                </button>
                
                <button
                  onClick={handleClearAll}
                  disabled={isProcessingAll}
                  className="flex items-center gap-2 px-4 py-2 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/40 text-red-600 dark:text-red-400 rounded-lg text-sm font-medium transition-colors border border-red-200 dark:border-red-800/50 disabled:opacity-50"
                >
                  <Trash2 size={16} />
                  Clear All
                </button>
             </div>
         </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {items.map(item => (
          <div key={item.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm flex flex-col">
             
             <div className="relative bg-slate-100 dark:bg-slate-950 flex items-center justify-center group aspect-square">
                
                {item.generatedImageUrl ? (
                    <>
                       <img src={item.generatedImageUrl} alt="Generated" className="w-full h-full object-cover" />
                       <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100 gap-2">
                           <button 
                             onClick={() => downloadImage(item.generatedImageUrl!, item.id)}
                             className="p-2 bg-white text-slate-900 rounded-lg hover:scale-110 transition-transform"
                             title="Download"
                           >
                             <Download size={20} />
                           </button>
                       </div>
                    </>
                ) : (
                    <div className="flex flex-col items-center justify-center text-slate-400 p-4 text-center">
                        {item.status === 'generating' ? (
                            <>
                               <Loader2 size={32} className="animate-spin mb-2 text-indigo-500" />
                               <span className="text-xs text-indigo-500 font-medium">
                                   Generating...<br/>
                                   <span className="opacity-75 text-[10px]">Flash 2.5</span>
                               </span>
                            </>
                        ) : item.status === 'error' ? (
                            <>
                               <Trash2 size={32} className="mb-2 text-red-400" />
                               <span className="text-xs text-red-400">Failed</span>
                            </>
                        ) : (
                            <>
                               <ImageIcon size={32} className="mb-2 opacity-30" />
                               <span className="text-xs opacity-50">Pending</span>
                            </>
                        )}
                    </div>
                )}

                {/* Badge for Edit Mode items */}
                {item.sourceImage && (
                    <div className="absolute top-2 left-2 px-1.5 py-0.5 bg-indigo-500/90 text-white text-[10px] font-bold rounded shadow-sm z-10 pointer-events-none">
                        EDIT
                    </div>
                )}
                
                <button 
                    onClick={() => handleRemove(item.id)}
                    className="absolute top-2 right-2 p-1.5 bg-black/40 hover:bg-red-500 text-white rounded-lg transition-colors opacity-0 group-hover:opacity-100 z-10"
                >
                   <Trash2 size={14} />
                </button>
             </div>

             <div className="p-4 flex flex-col flex-1">
                <div className="flex gap-2 mb-3 flex-1">
                    {item.sourceImage && (
                        <img 
                           src={item.sourceImage.previewUrl} 
                           alt="Source" 
                           className="w-10 h-10 object-cover rounded border border-slate-200 dark:border-slate-700 flex-shrink-0"
                           title="Reference Image"
                        />
                    )}
                    <p className="text-sm text-slate-700 dark:text-slate-300 line-clamp-3">
                        {item.prompt}
                    </p>
                </div>
                
                {/* Advanced Settings Badge */}
                {item.advancedSettings && (item.advancedSettings.negativePrompt || item.advancedSettings.seed) && (
                    <div className="mb-2 flex flex-wrap gap-1">
                        {item.advancedSettings.seed && (
                            <span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-500 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                                Seed: {item.advancedSettings.seed}
                            </span>
                        )}
                        {item.advancedSettings.negativePrompt && (
                            <span className="text-[10px] bg-red-50 dark:bg-red-900/10 text-red-500 px-1.5 py-0.5 rounded border border-red-100 dark:border-red-900/20 max-w-full truncate">
                                No: {item.advancedSettings.negativePrompt}
                            </span>
                        )}
                    </div>
                )}
                
                <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mt-auto pt-3 border-t border-slate-100 dark:border-slate-800">
                   
                   {item.status === 'error' && (
                       <span className="text-red-500 truncate max-w-[120px]" title={item.error}>
                           {item.error}
                       </span>
                   )}
                   
                   {item.status === 'idle' && (
                       <button
                         onClick={() => generateSingle(item.id)}
                         className="text-indigo-600 dark:text-indigo-400 hover:underline"
                       >
                          Generate
                       </button>
                   )}
                   
                   {item.status === 'completed' && (
                       <span className="text-emerald-500 flex items-center gap-1">
                          Done
                       </span>
                   )}
                </div>
             </div>

          </div>
        ))}
      </div>
      
      {items.length === 0 && (
         <div className="text-center py-20 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-900/50">
             <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                 <Sparkles className="h-8 w-8 text-slate-400" />
             </div>
             <p className="text-slate-600 dark:text-slate-400 font-medium">Your generation queue is empty</p>
             <p className="text-slate-400 dark:text-slate-500 text-sm mt-1">Add a prompt above or upload a CSV to get started</p>
         </div>
      )}

    </div>
  );
};
