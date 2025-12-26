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
import { Trash2, Download, CheckSquare, Edit3, Loader2, Sparkles, Sun, Moon, Key, Info, Home, Layers, XCircle, Wand2, Calendar } from 'lucide-react';
import JSZip from 'jszip';

const MAX_PARALLEL_UPLOADS = 3;

function App() {
  const [user, setUser] = useState<{name: string, email: string, avatar: string}>({
    name: 'StockMeta User',
    email: 'user@example.com',
    avatar: 'https://ui-avatars.com/api/?name=User&background=6366f1&color=fff' 
  });
  
  // --- PROVIDER & KEY STATE ---
  const [geminiKey, setGeminiKey] = useState<string>('');
  const [mistralKey, setMistralKey] = useState<string>('');
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
    titleWordCountMax: 15, // Roughly targeting under 70 chars
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

  // LOAD SAVED KEYS & PROVIDER
  useEffect(() => {
    const gKey = localStorage.getItem('gemini_api_key');
    if (gKey) setGeminiKey(gKey);

    const mKey = localStorage.getItem('mistral_api_key');
    if (mKey) setMistralKey(mKey);
  }, []);

  const handleSaveApiKey = (provider: 'GEMINI' | 'MISTRAL', key: string) => {
      if (provider === 'GEMINI') {
          setGeminiKey(key);
          localStorage.setItem('gemini_api_key', key);
      } else if (provider === 'MISTRAL') {
          setMistralKey(key);
          localStorage.setItem('mistral_api_key', key);
      }
  };

  const processFile = async (fileObj: UploadedFile) => {
    if (!fileObj.file.type.startsWith('image/')) {
        setFiles(prev => prev.map(f => f.id === fileObj.id ? { ...f, status: ProcessingStatus.ERROR, error: "Missing Preview Image" } : f));
        return;
    }

    try {
      setFiles(prev => prev.map(f => f.id === fileObj.id ? { ...f, status: ProcessingStatus.ANALYZING } : f));
      
      const { base64, mimeType } = await optimizeImage(fileObj.file);
      
      // Determine which key to use based on mode
      let activeKey = geminiKey;
      if (modelMode === ModelMode.MISTRAL_PIXTRAL) {
          activeKey = mistralKey;
      }

      const metadata = await generateImageMetadata(
          base64,
          mimeType,
          modelMode,
          activeKey,
          generationSettings
      );
      
      setFiles(prev => prev.map(f => f.id === fileObj.id ? { ...f, status: ProcessingStatus.COMPLETED, metadata } : f));
    } catch (error) {
      const errorMsg = (error as Error).message;
      if (errorMsg.includes("Missing") || errorMsg.includes("Key")) setIsApiKeyModalOpen(true);

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
                } else if (group.vector) {
                    newFileList.push({
                        id: Math.random().toString(36).substring(7),
                        file: group.vector,
                        previewUrl: "", 
                        status: ProcessingStatus.ERROR,
                        error: "Missing Preview Image",
                        vectorFile: group.vector 
                    });
                }
            }
        });
        return newFileList;
    });
  }, []);

  const handleGenerateAll = async () => {
    const activeKey = modelMode === ModelMode.MISTRAL_PIXTRAL ? mistralKey : geminiKey;

    if (!activeKey && !process.env.API_KEY) {
        setIsApiKeyModalOpen(true);
        return;
    }
    
    const toProcess = filteredFiles.filter(f => f.status === ProcessingStatus.IDLE || f.status === ProcessingStatus.ERROR);
    if (toProcess.length === 0) return;

    setIsBatchProcessing(true);
    stopBatchRef.current = false;

    for (const f of toProcess) {
        if (stopBatchRef.current) break;
        await processFile(f);
        if (!stopBatchRef.current) await new Promise(resolve => setTimeout(resolve, modelMode === ModelMode.MISTRAL_PIXTRAL ? 2000 : 3000));
    }

    setIsBatchProcessing(false);
  };
  
  const handleStopBatch = () => { stopBatchRef.current = true; setIsBatchProcessing(false); };
  
  const handleRegenerate = (id: string) => {
    const activeKey = modelMode === ModelMode.MISTRAL_PIXTRAL ? mistralKey : geminiKey;
    if (!activeKey) { setIsApiKeyModalOpen(true); return; }
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

  const handleExportZip = async () => {
    const completedFiles = files.filter(f => f.status === ProcessingStatus.COMPLETED && f.metadata);
    if (completedFiles.length === 0) return;
    setIsExporting(true);
    try {
      const zip = new JSZip();
      const usedFilenames = new Set<string>();
      const csvRows = [['Filename', 'Title', 'Description', 'Keywords', 'Category']];

      completedFiles.forEach((f) => {
        const m = f.metadata!;
        const originalExt = f.file.name.split('.').pop() || 'jpg';
        let finalBase = renameOnExport 
            ? (m.title.replace(/[^a-z0-9\s-]/gi, '').trim().replace(/\s+/g, '_').substring(0, 100) || "image")
            : f.file.name.substring(0, f.file.name.lastIndexOf('.'));
            
        let counter = 1;
        const base = finalBase;
        while (usedFilenames.has(`${finalBase}.${originalExt}`)) { finalBase = `${base}_${counter}`; counter++; }
        const imageFilename = `${finalBase}.${originalExt}`;
        usedFilenames.add(imageFilename);

        zip.file(imageFilename, f.file);
        const escape = (str: string) => `"${str.replace(/"/g, '""')}"`;
        csvRows.push([escape(imageFilename), escape(m.title), escape(m.description), escape(m.keywords.join(', ')), escape(m.category)]);

        if (f.vectorFile) {
            const vectorExt = f.vectorFile.name.split('.').pop() || 'eps';
            zip.file(`${finalBase}.${vectorExt}`, f.vectorFile);
            csvRows.push([escape(`${finalBase}.${vectorExt}`), escape(m.title), escape(m.description), escape(m.keywords.join(', ')), escape(m.category)]);
        }
      });

      zip.file("metadata.csv", csvRows.map(r => r.join(',')).join('\n'));
      const content = await zip.generateAsync({ type: "blob" });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(content);
      link.download = `stock_assets_${new Date().toISOString().slice(0, 10)}.zip`;
      link.click();
    } catch (e) { alert("Zip export failed"); } finally { setIsExporting(false); }
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

  const completedFiles = files.filter(f => f.status === ProcessingStatus.COMPLETED).length;
  const progressPercent = files.length > 0 ? ((completedFiles + files.filter(f => f.status === ProcessingStatus.ERROR).length) / files.length) * 100 : 0;

  return (
    <div className={`min-h-screen flex flex-col font-sans transition-colors duration-500 ${isDarkMode ? 'bg-[#050505]' : 'bg-[#f8fafc]'}`}>
      <div className="fixed inset-0 z-0 pointer-events-none">
         <div className={`absolute top-0 left-0 w-full h-[500px] bg-gradient-to-b ${isDarkMode ? 'from-orange-900/10 to-transparent' : 'from-indigo-100/50 to-transparent'}`} />
      </div>

      <ApiKeyModal 
        isOpen={isApiKeyModalOpen} 
        onClose={() => setIsApiKeyModalOpen(false)} 
        onSave={handleSaveApiKey} 
        currentGeminiKey={geminiKey}
        currentMistralKey={mistralKey}
      />
      <BulkKeywordModal isOpen={isBulkModalOpen} onClose={() => setIsBulkModalOpen(false)} onApply={handleBulkApply} selectedCount={selectedIds.size} />

      <header className={`sticky top-0 z-50 backdrop-blur-xl border-b transition-all duration-300 ${isDarkMode ? 'bg-[#050505]/80 border-white/5' : 'bg-white/70 border-white/40 shadow-sm'}`}>
        <div className="max-w-[1920px] mx-auto px-6 md:px-10 flex items-center justify-between py-4">
          <div className="flex items-center gap-4 cursor-pointer" onClick={() => setView('generator')}>
            <div className={`p-2.5 rounded-xl ${isDarkMode ? 'bg-gradient-to-tr from-orange-600 to-amber-600' : 'bg-gradient-to-tr from-indigo-600 to-indigo-500 text-white'}`}>
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
                    <button key={item.id} onClick={() => setView(item.id as any)} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${view === item.id ? (isDarkMode ? 'bg-white/10 text-white' : 'bg-slate-100 text-slate-900') : (isDarkMode ? 'text-gray-400 hover:text-white' : 'text-slate-500 hover:text-slate-900')}`}>
                      <item.icon size={16} /> <span>{item.label}</span>
                    </button>
                 ))}
             </nav>
             <div className="h-6 w-px bg-slate-200 dark:bg-white/10 mx-2" />

             <button 
                onClick={() => setIsApiKeyModalOpen(true)} 
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-bold transition-all ${!geminiKey ? 'bg-red-500 text-white animate-pulse' : (isDarkMode ? 'hover:bg-white/10 text-emerald-400' : 'hover:bg-white/60 text-emerald-600')}`}
             >
                {geminiKey ? <><div className="w-2 h-2 rounded-full bg-emerald-500" /><span className="hidden lg:inline">Connected</span></> : <><Key size={14} /><span>Connect API</span></>}
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
           <PromptGenerator geminiKey={geminiKey} mistralKey={mistralKey} onBack={() => setView('generator')} />
        ) : view === 'calendar' ? (
           <EventCalendar onBack={() => setView('generator')} />
        ) : (
          <div className="flex flex-col gap-10 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-gray-200 dark:border-white/5">
                <div>
                  <h2 className={`text-5xl font-bold tracking-tight mb-2 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Metadata Workspace</h2>
                  <p className={`text-lg ${isDarkMode ? 'text-gray-400' : 'text-slate-500'}`}>
                    AI Power: <strong className="text-indigo-500">
                      {modelMode === ModelMode.MISTRAL_PIXTRAL ? 'Mistral Pixtral 12B' : 'Gemini 2.5 Flash & Lite'}
                    </strong>.
                  </p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                 <div className="lg:col-span-3 order-2 lg:order-1 space-y-6 lg:sticky lg:top-24 h-fit">
                    <SettingsPanel 
                      settings={generationSettings} 
                      onSettingsChange={setGenerationSettings} 
                      modelMode={modelMode}
                      onModelModeChange={setModelMode}
                    />
                 </div>
                 <div className="lg:col-span-9 order-1 lg:order-2 space-y-8">
                    <FileUploader onFilesSelected={handleFilesSelected} disabled={isBatchProcessing || !!(files.find(f => f.status === ProcessingStatus.ANALYZING))} />
                    
                    {files.length > 0 && (
                      <div className={`rounded-xl border shadow-xl shadow-slate-200/50 dark:shadow-black/20 transition-all overflow-hidden ${isDarkMode ? 'bg-[#111827] border-white/10' : 'bg-white/90 border-white/60 backdrop-blur-md'}`}>
                        {isBatchProcessing && <div className="absolute top-0 left-0 right-0 h-[3px] bg-gray-100 dark:bg-gray-800"><div className="h-full bg-indigo-500 transition-all duration-300 ease-out" style={{ width: `${Math.max(5, progressPercent)}%` }}/></div>}
                        <div className="flex flex-wrap md:flex-nowrap items-center justify-between gap-4 p-4 relative z-10">
                           <div className="flex items-center gap-4 w-full md:w-auto">
                              <button onClick={handleSelectAll} className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-bold uppercase tracking-wider transition-all border ${selectedIds.size > 0 ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-900/30' : 'border-transparent text-slate-500'}`}>
                                 <div className={`w-5 h-5 rounded border flex items-center justify-center ${selectedIds.size > 0 && selectedIds.size === filteredFiles.length ? 'bg-indigo-500 border-indigo-500 text-white' : 'border-slate-300 dark:border-gray-600'}`}>{selectedIds.size > 0 && <CheckSquare size={12} />}</div>
                                 {selectedIds.size > 0 ? `${selectedIds.size} Selected` : 'Select All'}
                              </button>
                              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="bg-transparent border-none text-base font-bold text-slate-600 dark:text-gray-300 focus:ring-0 cursor-pointer outline-none">
                                 <option value="ALL">All ({files.length})</option>
                                 <option value="COMPLETED">Done ({completedFiles})</option>
                                 <option value="IDLE">Pending ({files.length - completedFiles - files.filter(f => f.status === ProcessingStatus.ERROR).length})</option>
                              </select>
                           </div>

                           <div className="flex items-center gap-3 w-full md:w-auto justify-end">
                              {selectedIds.size > 0 && <button onClick={() => setIsBulkModalOpen(true)} className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-slate-100 dark:bg-white/5 hover:bg-slate-200 text-slate-700 dark:text-gray-200 text-sm font-bold"><Edit3 size={16} /> Bulk Edit</button>}
                              {files.some(f => f.status === ProcessingStatus.IDLE || f.status === ProcessingStatus.ERROR) && (
                                !isBatchProcessing ? (
                                    <button onClick={handleGenerateAll} className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold shadow-md shadow-indigo-500/20 hover:scale-[1.02]"><Sparkles size={16} /> Generate All</button>
                                ) : (
                                    <button onClick={handleStopBatch} className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-red-600 hover:bg-red-500 text-white text-sm font-bold shadow-md shadow-red-500/20"><XCircle size={16} /> Stop</button>
                                )
                              )}
                              <button onClick={handleExportZip} disabled={completedFiles === 0 || isExporting} className="flex items-center gap-2 px-6 py-2.5 rounded-lg border text-sm font-bold transition-all border-emerald-500/30 bg-emerald-50 dark:bg-emerald-900/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 disabled:opacity-50 disabled:cursor-not-allowed">
                                 {isExporting ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />} Export
                              </button>
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
                          apiKey={geminiKey}
                        />
                      ))}
                    </div>
                 </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;