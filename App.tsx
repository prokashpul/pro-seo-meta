
import React, { useState, useCallback, useEffect, useRef } from 'react';
import { UploadedFile, ProcessingStatus, ModelMode, StockMetadata, GenerationSettings } from './types';
import { generateImageMetadata } from './services/geminiService';
import { optimizeImage } from './services/imageOptimizer';
import { FileUploader } from './components/FileUploader';
import { MetadataCard } from './components/MetadataCard';
import { BulkKeywordModal, BulkActionType, BulkTargetField } from './components/BulkKeywordModal';
import { ApiKeyModal } from './components/ApiKeyModal';
import { About } from './components/About';
import { SettingsPanel } from './components/SettingsPanel';
import { PromptGenerator } from './components/PromptGenerator';
import { EventCalendar } from './components/EventCalendar';
import { 
  Trash2, Download, CheckSquare, Edit3, Loader2, Sparkles, Sun, Moon, Key, 
  Info, Home, Layers, XCircle, Wand2, Calendar, CheckCircle, 
  Twitter, Github, Globe, ExternalLink, FileText 
} from 'lucide-react';
import JSZip from 'jszip';

function App() {
  const [geminiKey, setGeminiKey] = useState<string>('');
  const [groqKey, setGroqKey] = useState<string>('');
  const [mistralKey, setMistralKey] = useState<string>('');
  const [geminiSystemConnected, setGeminiSystemConnected] = useState<boolean>(false);
  const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState(false);
  
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [modelMode, setModelMode] = useState<ModelMode>(ModelMode.FAST);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [renameOnExport, setRenameOnExport] = useState(true);
  
  // Batch Processing State
  const [isBatchProcessing, setIsBatchProcessing] = useState(false);
  const stopBatchRef = useRef(false);
  
  // Filter State
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  const [generationSettings, setGenerationSettings] = useState<GenerationSettings>({
    silhouette: false,
    whiteBackground: false,
    transparentBackground: false,
    singleWordKeywords: false,
    customPromptEnabled: false,
    customPromptText: '',
    prohibitedWordsEnabled: false,
    prohibitedWordsText: '',
    titleWordCountMin: 5,
    titleWordCountMax: 15, 
    descriptionWordCountMin: 15,
    descriptionWordCountMax: 45,
    keywordCountMin: 15,
    keywordCountMax: 35
  });
  
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const savedTheme = localStorage.getItem('stockmeta_theme');
    if (savedTheme) return savedTheme === 'dark';
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) return true;
    return false;
  });
  
  const [view, setView] = useState<'generator' | 'prompts' | 'calendar' | 'about'>('generator');

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('stockmeta_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('stockmeta_theme', 'light');
    }
  }, [isDarkMode]);

  // LOAD SAVED KEYS
  useEffect(() => {
    setGeminiKey(localStorage.getItem('gemini_api_key') || '');
    setGroqKey(localStorage.getItem('groq_api_key') || '');
    setMistralKey(localStorage.getItem('mistral_api_key') || '');
    checkSystemKey();
  }, []);

  const checkSystemKey = async () => {
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

  const handleSaveApiKey = (provider: 'GEMINI' | 'GROQ' | 'MISTRAL', key: string) => {
      if (provider === 'GEMINI') {
          setGeminiKey(key);
          localStorage.setItem('gemini_api_key', key);
      } else if (provider === 'GROQ') {
          setGroqKey(key);
          localStorage.setItem('groq_api_key', key);
      } else if (provider === 'MISTRAL') {
          setMistralKey(key);
          localStorage.setItem('mistral_api_key', key);
      }
      checkSystemKey();
  };

  const processFile = async (fileObj: UploadedFile) => {
    if (!fileObj.file.type.startsWith('image/')) {
        setFiles(prev => prev.map(f => f.id === fileObj.id ? { ...f, status: ProcessingStatus.ERROR, error: "Missing Preview Image" } : f));
        return;
    }

    try {
      setFiles(prev => prev.map(f => f.id === fileObj.id ? { ...f, status: ProcessingStatus.ANALYZING } : f));
      const { base64, mimeType } = await optimizeImage(fileObj.file);
      
      let externalKey = "";
      if (modelMode === ModelMode.GROQ_VISION) externalKey = groqKey;
      else if (modelMode === ModelMode.MISTRAL_PIXTRAL) externalKey = mistralKey;
      else externalKey = geminiKey; // Fallback to manual gemini key for Gemini modes if provided

      const metadata = await generateImageMetadata(
          base64,
          mimeType,
          modelMode,
          externalKey,
          generationSettings
      );
      
      setFiles(prev => prev.map(f => f.id === fileObj.id ? { ...f, status: ProcessingStatus.COMPLETED, metadata } : f));
    } catch (error) {
      const errorMsg = (error as Error).message;
      setFiles(prev => prev.map(f => f.id === fileObj.id ? { ...f, status: ProcessingStatus.ERROR, error: errorMsg } : f));
    }
  };

  const handleFilesSelected = useCallback((incomingFiles: File[]) => {
    const incomingMap = new Map<string, { image?: File, vector?: File }>();
    const getBasename = (name: string) => name.substring(0, name.lastIndexOf('.'));
    const isVector = (file: File) => /\.(eps|ai)$/i.test(file.name);
    const isImage = (file: File) => /\.(jpg|jpeg|png|webp)$/i.test(file.name);

    incomingFiles.forEach(f => {
        const base = getBasename(f.name);
        if (!incomingMap.has(base)) incomingMap.set(base, {});
        if (isVector(f)) incomingMap.get(base)!.vector = f;
        else if (isImage(f)) incomingMap.get(base)!.image = f;
    });

    setFiles(prev => {
        const newFileList = [...prev];
        incomingMap.forEach((group, basename) => {
            const existingIndex = newFileList.findIndex(f => getBasename(f.file.name) === basename);
            if (existingIndex >= 0) {
                const existing = newFileList[existingIndex];
                if (group.vector && !existing.vectorFile) newFileList[existingIndex] = { ...existing, vectorFile: group.vector };
            } else {
                if (group.image) {
                     newFileList.push({
                         id: Math.random().toString(36).substring(7),
                         file: group.image,
                         previewUrl: URL.createObjectURL(group.image),
                         status: ProcessingStatus.IDLE,
                         vectorFile: group.vector
                     });
                }
            }
        });
        return newFileList;
    });
  }, []);

  const handleGenerateAll = async () => {
    const toProcess = filteredFiles.filter(f => f.status === ProcessingStatus.IDLE || f.status === ProcessingStatus.ERROR);
    if (toProcess.length === 0) return;

    setIsBatchProcessing(true);
    stopBatchRef.current = false;

    for (const f of toProcess) {
        if (stopBatchRef.current) break;
        await processFile(f);
        if (!stopBatchRef.current) {
            const delay = (modelMode === ModelMode.GROQ_VISION || modelMode === ModelMode.MISTRAL_PIXTRAL) ? 3000 : 1000;
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }

    setIsBatchProcessing(false);
  };
  
  const handleStopBatch = () => { stopBatchRef.current = true; setIsBatchProcessing(false); };
  
  const handleRegenerate = (id: string) => {
    const file = files.find(f => f.id === id);
    if (file) processFile(file);
  };

  const handleRemoveFile = (id: string) => {
    setFiles(prev => {
      const f = prev.find(f => f.id === id);
      if (f && f.previewUrl) URL.revokeObjectURL(f.previewUrl);
      return prev.filter(f => f.id !== id);
    });
    setSelectedIds(prev => { const n = new Set(prev); n.delete(id); return n; });
  };

  const handleUpdateMetadata = (id: string, metadata: StockMetadata) => setFiles(prev => prev.map(f => f.id === id ? { ...f, metadata } : f));
  const handleAddTrending = async (id: string, trending: string[]) => setFiles(prev => prev.map(f => f.id === id ? { ...f, trendingContext: trending } : f));

  const handleClearAll = () => {
    if (isBatchProcessing) handleStopBatch();
    files.forEach(f => { if (f.previewUrl) URL.revokeObjectURL(f.previewUrl); });
    setFiles([]);
    setSelectedIds(new Set());
  };

  const generateMetadataCSVContent = (items: UploadedFile[]) => {
    const csvRows = [['Filename', 'Title', 'Description', 'Keywords', 'Category']];
    const escape = (str: string) => `"${str.replace(/"/g, '""')}"`;
    
    items.forEach(f => {
      if (!f.metadata) return;
      const m = f.metadata;
      
      let finalBase = renameOnExport 
          ? (m.title.replace(/[^a-z0-9\s-]/gi, '').trim().replace(/\s+/g, '_').substring(0, 100) || "image")
          : f.file.name.substring(0, f.file.name.lastIndexOf('.'));

      const originalExt = f.file.name.split('.').pop() || 'jpg';
      const imageFilename = `${finalBase}.${originalExt}`;
      
      // Add row for the Preview Image
      csvRows.push([
        escape(imageFilename),
        escape(m.title),
        escape(m.description),
        escape(m.keywords.join(', ')),
        escape(m.category)
      ]);

      // If a vector file is present, add a separate row for it as well
      if (f.vectorFile) {
        const vectorExt = f.vectorFile.name.split('.').pop() || 'eps';
        const vectorFilename = `${finalBase}.${vectorExt}`;
        csvRows.push([
          escape(vectorFilename),
          escape(m.title),
          escape(m.description),
          escape(m.keywords.join(', ')),
          escape(m.category)
        ]);
      }
    });
    return csvRows.map(r => r.join(',')).join('\n');
  };

  const handleExportCSVOnly = () => {
    const completedFilesList = files.filter(f => f.status === ProcessingStatus.COMPLETED && f.metadata);
    if (completedFilesList.length === 0) return;
    
    const csvContent = generateMetadataCSVContent(completedFilesList);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `stock_metadata_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  const handleExportZip = async () => {
    const completedFilesList = files.filter(f => f.status === ProcessingStatus.COMPLETED && f.metadata);
    if (completedFilesList.length === 0) return;
    setIsExporting(true);
    try {
      const zip = new JSZip();
      const usedFilenames = new Set<string>();
      const csvRows = [['Filename', 'Title', 'Description', 'Keywords', 'Category']];
      const escape = (str: string) => `"${str.replace(/"/g, '""')}"`;

      completedFilesList.forEach((f) => {
        const m = f.metadata!;
        const originalExt = f.file.name.split('.').pop() || 'jpg';
        let finalBase = renameOnExport 
            ? (m.title.replace(/[^a-z0-9\s-]/gi, '').trim().replace(/\s+/g, '_').substring(0, 100) || "image")
            : f.file.name.substring(0, f.file.name.lastIndexOf('.'));
            
        let counter = 1;
        const base = finalBase;
        // Check both possible extensions to ensure filename uniqueness for the asset pair
        while (usedFilenames.has(`${finalBase}.${originalExt}`)) { 
            finalBase = `${base}_${counter}`; 
            counter++; 
        }
        
        const imageFilename = `${finalBase}.${originalExt}`;
        usedFilenames.add(imageFilename);
        zip.file(imageFilename, f.file);

        // Add metadata row for image
        csvRows.push([
            escape(imageFilename), 
            escape(m.title), 
            escape(m.description), 
            escape(m.keywords.join(', ')), 
            escape(m.category)
        ]);

        if (f.vectorFile) {
            const vectorExt = f.vectorFile.name.split('.').pop() || 'eps';
            const vectorFilename = `${finalBase}.${vectorExt}`;
            zip.file(vectorFilename, f.vectorFile);
            usedFilenames.add(vectorFilename);

            // Add separate metadata row for vector
            csvRows.push([
                escape(vectorFilename), 
                escape(m.title), 
                escape(m.description), 
                escape(m.keywords.join(', ')), 
                escape(m.category)
            ]);
        }
      });

      zip.file("metadata_adobe_shutter.csv", csvRows.map(r => r.join(',')).join('\n'));
      const content = await zip.generateAsync({ type: "blob" });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(content);
      link.download = `stock_assets_${new Date().toISOString().slice(0, 10)}.zip`;
      link.click();
    } catch (e) { 
      console.error(e);
      alert("Zip export failed"); 
    } finally { setIsExporting(false); }
  };

  const filteredFiles = files.filter(f => statusFilter === 'ALL' || f.status === statusFilter);

  const handleToggleSelect = (id: string) => setSelectedIds(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const handleSelectAll = () => {
    if (filteredFiles.length > 0 && filteredFiles.every(f => selectedIds.has(f.id))) setSelectedIds(prev => { const n = new Set(prev); filteredFiles.forEach(f => n.delete(f.id)); return n; });
    else setSelectedIds(prev => { const n = new Set(prev); filteredFiles.forEach(f => n.add(f.id)); return n; });
  };

  const handleBulkApply = (action: BulkActionType, value: any, field: BulkTargetField) => {
    setFiles(prev => prev.map(file => {
      if (!selectedIds.has(file.id) || !file.metadata) return file;
      const m = { ...file.metadata };
      if (field === 'keywords') {
          const val = value as string[];
          if (action === 'ADD') m.keywords = [...new Set([...m.keywords, ...val])];
          else if (action === 'REMOVE') m.keywords = m.keywords.filter(k => !val.includes(k));
          else if (action === 'REPLACE_ALL') m.keywords = [...val];
          else if (action === 'CLEAR_ALL') m.keywords = [];
          else if (action === 'REPLACE_TEXT') {
              const { find, replace } = value as { find: string, replace: string };
              m.keywords = m.keywords.map(k => k.replace(new RegExp(find, 'gi'), replace).trim()).filter(Boolean);
          }
      } else {
          let text = field === 'title' ? m.title : m.description;
          const strVal = value as string;
          if (action === 'REPLACE_ALL') text = strVal;
          else if (action === 'APPEND') text += ` ${strVal}`;
          else if (action === 'PREPEND') text = `${strVal} ${text}`;
          else if (action === 'REPLACE_TEXT') {
               const { find, replace } = value as { find: string, replace: string };
               text = text.replace(new RegExp(find, 'gi'), replace);
          }
          if (field === 'title') m.title = text.substring(0, 150).trim();
          else m.description = text.substring(0, 200).trim();
      }
      return { ...file, metadata: m };
    }));
  };

  const completedFilesCount = files.filter(f => f.status === ProcessingStatus.COMPLETED).length;
  const progressPercent = files.length > 0 ? ((completedFilesCount + files.filter(f => f.status === ProcessingStatus.ERROR).length) / files.length) * 100 : 0;

  const isAnyProviderConnected = geminiSystemConnected || geminiKey || groqKey || mistralKey;

  return (
    <div className={`min-h-screen flex flex-col font-sans transition-colors duration-700 ${isDarkMode ? 'bg-[#050505]' : 'bg-[#fcfdfe]'}`}>
      
      {/* Dynamic Background System */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
         {/* Theme-based Mesh Blobs */}
         <div className={`absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] rounded-full blur-[120px] mix-blend-screen animate-blob ${isDarkMode ? 'bg-indigo-900/40' : 'bg-blue-100/60'}`} />
         <div className={`absolute bottom-[-10%] right-[-10%] w-[60vw] h-[60vw] rounded-full blur-[140px] mix-blend-screen animate-blob-reverse delay-700 ${isDarkMode ? 'bg-violet-900/30' : 'bg-indigo-100/50'}`} />
         <div className={`absolute top-[20%] right-[15%] w-[35vw] h-[35vw] rounded-full blur-[110px] mix-blend-screen animate-blob delay-1000 ${isDarkMode ? 'bg-indigo-800/20' : 'bg-sky-50/60'}`} />
         
         {/* Static Gradient Overlay for Depth */}
         <div className={`absolute inset-0 transition-opacity duration-1000 ${isDarkMode ? 'bg-gradient-to-tr from-black via-transparent to-black opacity-80' : 'bg-gradient-to-tr from-white via-transparent to-white opacity-40'}`} />
      </div>

      <ApiKeyModal 
        isOpen={isApiKeyModalOpen} 
        onClose={() => setIsApiKeyModalOpen(false)} 
        onSave={(p, k) => handleSaveApiKey(p as any, k)} 
        currentGeminiKey={geminiKey}
        currentGroqKey={groqKey}
        currentMistralKey={mistralKey}
      />
      <BulkKeywordModal isOpen={isBulkModalOpen} onClose={() => setIsBulkModalOpen(false)} onApply={handleBulkApply} selectedCount={selectedIds.size} />

      <header className={`sticky top-0 z-50 backdrop-blur-2xl border-b transition-all duration-300 ${isDarkMode ? 'bg-[#050505]/80 border-white/5' : 'bg-white/70 border-white/40 shadow-sm'}`}>
        <div className="max-w-[1920px] mx-auto px-6 md:px-10 flex items-center justify-between py-4">
          <div className="flex items-center gap-4 cursor-pointer" onClick={() => setView('generator')}>
            <div className={`p-2.5 rounded-xl ${isDarkMode ? 'bg-gradient-to-tr from-indigo-600 to-violet-600 shadow-lg shadow-indigo-900/40' : 'bg-gradient-to-tr from-indigo-600 to-indigo-500 text-white shadow-lg shadow-indigo-500/20'}`}>
              <Layers className="w-5 h-5 text-white" />
            </div>
            <h1 className={`text-2xl font-bold tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>StockMeta<span className="font-light opacity-70">AI</span></h1>
          </div>

          <div className="hidden md:flex items-center gap-4 lg:gap-6">
             <nav className="flex items-center gap-1">
                 {[
                   { id: 'generator', icon: Home, label: 'Metadata' },
                   { id: 'prompts', icon: Wand2, label: 'Prompts' },
                   { id: 'calendar', icon: Calendar, label: 'Calendar' },
                   { id: 'about', icon: Info, label: 'About' }
                 ].map((item) => (
                    <button key={item.id} onClick={() => setView(item.id as any)} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${view === item.id ? (isDarkMode ? 'bg-white/10 text-white' : 'bg-slate-200/50 text-slate-900') : (isDarkMode ? 'text-gray-400 hover:text-white' : 'text-slate-500 hover:text-slate-900')}`}>
                      <item.icon size={16} /> <span>{item.label}</span>
                    </button>
                 ))}
             </nav>
             <div className="h-6 w-px bg-slate-200 dark:bg-white/10 mx-2" />
             <button 
               onClick={() => setIsApiKeyModalOpen(true)} 
               className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-bold transition-all ${isAnyProviderConnected ? (isDarkMode ? 'text-emerald-400 bg-emerald-400/10' : 'text-emerald-600 bg-emerald-50') : (isDarkMode ? 'text-slate-400 hover:bg-white/10' : 'text-slate-500 hover:bg-white/60')}`}
             >
                {isAnyProviderConnected ? <CheckCircle size={14} className="text-emerald-500" /> : <Key size={14} />}
                <span>{isAnyProviderConnected ? 'Connected' : 'Providers'}</span>
             </button>
             <button onClick={() => setIsDarkMode(!isDarkMode)} className={`p-3 rounded-xl transition-all ${isDarkMode ? 'text-gray-400 hover:text-amber-400' : 'text-slate-400 hover:text-amber-500'}`}>
                {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
             </button>
          </div>
        </div>
      </header>

      <main className="flex-1 w-full max-w-[1920px] mx-auto px-6 md:px-10 py-10 relative z-10">
        {view === 'about' ? (
           <About onBack={() => setView('generator')} />
        ) : view === 'prompts' ? (
           <PromptGenerator onBack={() => setView('generator')} />
        ) : view === 'calendar' ? (
           <EventCalendar onBack={() => setView('generator')} />
        ) : (
          <div className="flex flex-col gap-10 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-gray-200 dark:border-white/5">
                <div>
                  <h2 className={`text-5xl font-bold tracking-tight mb-2 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Advance Metadata Generate</h2>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                 <div className="lg:col-span-3 order-2 lg:order-1">
                    <SettingsPanel settings={generationSettings} onSettingsChange={setGenerationSettings} modelMode={modelMode} onModelModeChange={setModelMode} />
                 </div>
                 <div className="lg:col-span-9 order-1 lg:order-2 space-y-8">
                    <FileUploader onFilesSelected={handleFilesSelected} disabled={isBatchProcessing} />
                    {files.length > 0 && (
                      <div className={`rounded-xl border shadow-xl transition-all overflow-hidden ${isDarkMode ? 'bg-[#0a0a0c]/80 border-white/10 backdrop-blur-xl' : 'bg-white/90 border-white/60 backdrop-blur-md'}`}>
                        {isBatchProcessing && <div className="absolute top-0 left-0 right-0 h-[3px] bg-gray-100 dark:bg-gray-800"><div className="h-full bg-indigo-500 transition-all duration-300 ease-out" style={{ width: `${progressPercent}%` }}/></div>}
                        <div className="flex flex-wrap md:flex-nowrap items-center justify-between gap-4 p-4">
                           <div className="flex items-center gap-4">
                              <button onClick={handleSelectAll} className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-bold uppercase tracking-wider transition-all border border-transparent text-slate-500">
                                 <div className={`w-5 h-5 rounded border flex items-center justify-center ${selectedIds.size > 0 ? 'bg-indigo-500 border-indigo-500 text-white' : 'border-slate-300 dark:border-gray-600'}`}>{selectedIds.size > 0 && <CheckSquare size={12} />}</div>
                                 {selectedIds.size > 0 ? `${selectedIds.size} Selected` : 'Select All'}
                              </button>
                           </div>
                           <div className="flex items-center gap-3">
                              {selectedIds.size > 0 && <button onClick={() => setIsBulkModalOpen(true)} className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-slate-100 dark:bg-white/5 hover:bg-slate-200 text-slate-700 dark:text-gray-200 text-sm font-bold"><Edit3 size={16} /> Bulk Edit</button>}
                              {!isBatchProcessing ? (
                                  <button onClick={handleGenerateAll} className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold shadow-md shadow-indigo-500/20"><Sparkles size={16} /> Generate All</button>
                              ) : (
                                  <button onClick={handleStopBatch} className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-red-600 hover:bg-red-500 text-white text-sm font-bold shadow-md shadow-red-500/20"><XCircle size={16} /> Stop</button>
                              )}
                              
                              <div className="flex bg-slate-100 dark:bg-white/5 p-1 rounded-xl">
                                <button 
                                  onClick={handleExportCSVOnly} 
                                  disabled={completedFilesCount === 0} 
                                  className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800 disabled:opacity-50"
                                >
                                  <FileText size={16} /> CSV
                                </button>
                                <button 
                                  onClick={handleExportZip} 
                                  disabled={completedFilesCount === 0 || isExporting} 
                                  className="flex items-center gap-2 px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold shadow-md disabled:opacity-50"
                                >
                                  {isExporting ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />} ZIP
                                </button>
                              </div>

                              <button onClick={handleClearAll} className="p-3 text-slate-400 hover:text-red-500 rounded-lg"><Trash2 size={18} /></button>
                           </div>
                        </div>
                      </div>
                    )}
                    <div className="flex flex-col gap-6 pb-24">
                      {filteredFiles.map(file => (
                        <MetadataCard 
                          key={file.id} 
                          item={file} 
                          isSelected={selectedIds.has(file.id)}
                          onToggleSelect={handleToggleSelect}
                          onRemove={handleRemoveFile} 
                          onRegenerate={handleRegenerate}
                          onUpdateMetadata={handleUpdateMetadata}
                          onAddTrending={handleAddTrending}
                          apiKey={modelMode === ModelMode.GROQ_VISION ? groqKey : modelMode === ModelMode.MISTRAL_PIXTRAL ? mistralKey : geminiKey}
                        />
                      ))}
                    </div>
                 </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className={`mt-auto border-t transition-all duration-300 ${isDarkMode ? 'bg-[#050505]/80 border-white/5 text-slate-400' : 'bg-white text-slate-500 border-slate-200'}`}>
        <div className="max-w-[1920px] mx-auto px-6 md:px-10 py-12 lg:py-16">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-8 mb-12">
            {/* Brand Column */}
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <div className={`p-1.5 rounded-lg ${isDarkMode ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/20' : 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'}`}>
                  <Layers size={18} />
                </div>
                <h4 className={`text-lg font-bold tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>StockMeta<span className="font-light opacity-70">AI</span></h4>
              </div>
              <p className="text-sm leading-relaxed max-w-xs">
                The intelligent workspace for stock contributors. Generate industry-standard metadata and optimize your portfolio using state-of-the-art computer vision.
              </p>
              <div className="flex items-center gap-4 pt-2">
                <a href="#" aria-label="Twitter" className="hover:text-indigo-500 transition-colors"><Twitter size={20} /></a>
                <a href="#" aria-label="GitHub" className="hover:text-indigo-500 transition-colors"><Github size={20} /></a>
                <a href="#" aria-label="Website" className="hover:text-indigo-500 transition-colors"><Globe size={20} /></a>
              </div>
            </div>

            {/* Platforms Column */}
            <div>
              <h5 className={`text-sm font-bold uppercase tracking-widest mb-6 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Contributor Hubs</h5>
              <ul className="space-y-3.5 text-sm">
                <li><a href="https://contributor.stock.adobe.com/" target="_blank" rel="noopener noreferrer" className="hover:text-indigo-500 flex items-center gap-2 transition-all">Adobe Stock <ExternalLink size={12} className="opacity-40" /></a></li>
                <li><a href="https://submit.shutterstock.com/" target="_blank" rel="noopener noreferrer" className="hover:text-indigo-500 flex items-center gap-2 transition-all">Shutterstock <ExternalLink size={12} className="opacity-40" /></a></li>
                <li><a href="https://workwithus.gettyimages.com/" target="_blank" rel="noopener noreferrer" className="hover:text-indigo-500 flex items-center gap-2 transition-all">Getty Images <ExternalLink size={12} className="opacity-40" /></a></li>
                <li><a href="https://www.pond5.com/sell-stock-footage" target="_blank" rel="noopener noreferrer" className="hover:text-indigo-500 flex items-center gap-2 transition-all">Pond5 <ExternalLink size={12} className="opacity-40" /></a></li>
              </ul>
            </div>

            {/* Product Column */}
            <div>
              <h5 className={`text-sm font-bold uppercase tracking-widest mb-6 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Resources</h5>
              <ul className="space-y-3.5 text-sm">
                <li><button onClick={() => setView('about')} className="hover:text-indigo-500 transition-colors">How it Works</button></li>
                <li><button onClick={() => setView('calendar')} className="hover:text-indigo-500 transition-colors">Content Calendar</button></li>
                <li><a href="#" className="hover:text-indigo-500 transition-colors">API Documentation</a></li>
                <li><a href="#" className="hover:text-indigo-500 transition-colors">Privacy Policy</a></li>
              </ul>
            </div>

            {/* Status Column */}
            <div className="space-y-6">
              <h5 className={`text-sm font-bold uppercase tracking-widest mb-6 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>System Status</h5>
              <div className={`p-4 rounded-xl border ${isDarkMode ? 'bg-white/5 border-white/5 shadow-inner' : 'bg-slate-50 border-slate-100'}`}>
                <div className="flex items-center justify-between mb-3.5">
                  <span className="text-xs font-medium">Core Engine</span>
                  <span className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-500 uppercase">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Operational
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium">API Gateway</span>
                  <span className={`flex items-center gap-1.5 text-[10px] font-bold uppercase ${isAnyProviderConnected ? 'text-emerald-500' : 'text-amber-500'}`}>
                    {isAnyProviderConnected ? <><CheckCircle size={10} /> Connected</> : 'Waiting for Key'}
                  </span>
                </div>
              </div>
              <p className="text-[10px] opacity-60 italic leading-normal">
                Powered by Google Gemini 3 Flash and multimodal vision experts. 
              </p>
            </div>
          </div>

          <div className={`pt-8 border-t flex flex-col md:flex-row items-center justify-between gap-6 text-xs font-medium ${isDarkMode ? 'border-white/5' : 'border-slate-100'}`}>
            <p>© {new Date().getFullYear()} StockMeta AI. Built for the Contributor Community.</p>
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5">
                Made with <Sparkles size={12} className="text-indigo-500" /> by Designers
              </span>
              <div className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-700" />
              <span>Version 2.5.0-Preview</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
