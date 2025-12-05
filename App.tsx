import React, { useState, useCallback, useEffect } from 'react';
import { UploadedFile, ProcessingStatus, ModelMode, StockMetadata, GenerationSettings } from './types';
import { generateImageMetadata, getTrendingKeywords } from './services/geminiService';
import { optimizeImage } from './services/imageOptimizer';
import { FileUploader } from './components/FileUploader';
import { MetadataCard } from './components/MetadataCard';
import { BulkKeywordModal, BulkActionType, BulkTargetField } from './components/BulkKeywordModal';
import { ApiKeyModal } from './components/ApiKeyModal';
import { About } from './components/About';
import { PromptGenerator } from './components/PromptGenerator';
import { EventCalendar } from './components/EventCalendar';
import { SettingsPanel } from './components/SettingsPanel';
import { Zap, Aperture, Trash2, Github, TrendingUp, Download, CheckSquare, Edit3, Loader2, Sparkles, Sun, Moon, Key, LogOut, Info, Home, Image as ImageIcon, Menu, X, Calendar, Layers, Filter, Command, Activity, PieChart, CheckCircle2, AlertCircle } from 'lucide-react';
import JSZip from 'jszip';

const MAX_PARALLEL_UPLOADS = 3;

function App() {
  // Initialize user immediately to bypass login screen
  const [user, setUser] = useState<{name: string, email: string, avatar: string}>({
    name: 'StockMeta User',
    email: 'user@example.com',
    avatar: 'https://ui-avatars.com/api/?name=User&background=6366f1&color=fff' 
  });
  
  const [apiKey, setApiKey] = useState<string>('');
  const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState(false);
  
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [modelMode, setModelMode] = useState<ModelMode>(ModelMode.FAST);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [renameOnExport, setRenameOnExport] = useState(true);
  
  // Filter State
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Generation Settings State - FIXED DEFAULTS
  const [generationSettings, setGenerationSettings] = useState<GenerationSettings>({
    silhouette: false,
    whiteBackground: false,
    transparentBackground: false,
    singleWordKeywords: false,
    customPromptEnabled: false,
    customPromptText: '',
    prohibitedWordsEnabled: false,
    prohibitedWordsText: '',
    // Fixed Ranges as requested
    titleWordCountMin: 8,
    titleWordCountMax: 25,
    descriptionWordCountMin: 8,
    descriptionWordCountMax: 40,
    keywordCountMin: 25,
    keywordCountMax: 50
  });
  
  // Initialize Dark Mode from Local Storage OR System Preference
  const [isDarkMode, setIsDarkMode] = useState(() => {
    // 1. Check Local Storage
    const savedTheme = localStorage.getItem('stockmeta_theme');
    if (savedTheme) {
      return savedTheme === 'dark';
    }
    // 2. Check System Preference (Auto)
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return true;
    }
    // 3. Fallback
    return false;
  });
  
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  const [view, setView] = useState<'generator' | 'prompts' | 'about' | 'calendar'>('generator');

  // Theme Toggle Effect & Persistence
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('stockmeta_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('stockmeta_theme', 'light');
    }
  }, [isDarkMode]);

  // Load API Key from local storage on mount
  useEffect(() => {
    const storedKey = localStorage.getItem('gemini_api_key');
    if (storedKey) {
      setApiKey(storedKey);
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('gemini_api_key');
    setApiKey('');
    setFiles([]);
    setSelectedIds(new Set());
    setIsApiKeyModalOpen(true);
  };

  const handleSaveApiKey = (key: string) => {
      setApiKey(key);
      localStorage.setItem('gemini_api_key', key);
  };
  
  const processFile = async (fileObj: UploadedFile) => {
    if (!fileObj.file.type.startsWith('image/')) {
        setFiles(prev => prev.map(f => 
            f.id === fileObj.id 
              ? { ...f, status: ProcessingStatus.ERROR, error: "Missing Preview Image (JPG/PNG)" } 
              : f
          ));
        return;
    }

    try {
      setFiles(prev => prev.map(f => f.id === fileObj.id ? { ...f, status: ProcessingStatus.ANALYZING } : f));
      
      const { base64, mimeType } = await optimizeImage(fileObj.file);
      const metadata = await generateImageMetadata(base64, mimeType, modelMode, apiKey, generationSettings);
      
      setFiles(prev => prev.map(f => 
        f.id === fileObj.id 
              ? { ...f, status: ProcessingStatus.COMPLETED, metadata } 
              : f
      ));
    } catch (error) {
      const errorMsg = (error as Error).message;
      
      if (errorMsg.includes("Invalid API Key")) {
          setIsApiKeyModalOpen(true);
      }

      setFiles(prev => prev.map(f => 
        f.id === fileObj.id 
              ? { ...f, status: ProcessingStatus.ERROR, error: errorMsg } 
              : f
      ));
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
                if (group.vector && !existing.vectorFile) {
                     newFileList[existingIndex] = { ...existing, vectorFile: group.vector };
                }
                if (group.image && !isImage(existing.file)) {
                     const updated: UploadedFile = {
                         ...existing,
                         file: group.image,
                         vectorFile: existing.file,
                         previewUrl: URL.createObjectURL(group.image),
                         status: ProcessingStatus.IDLE,
                         error: undefined
                     };
                     newFileList[existingIndex] = updated;
                }
            } else {
                if (group.image) {
                     const newFile: UploadedFile = {
                         id: Math.random().toString(36).substring(7),
                         file: group.image,
                         previewUrl: URL.createObjectURL(group.image),
                         status: ProcessingStatus.IDLE,
                         vectorFile: group.vector
                     };
                     newFileList.push(newFile);
                } else if (group.vector) {
                    const newFile: UploadedFile = {
                        id: Math.random().toString(36).substring(7),
                        file: group.vector,
                        previewUrl: "", 
                        status: ProcessingStatus.ERROR,
                        error: "Missing Preview Image",
                        vectorFile: group.vector 
                    };
                    newFileList.push(newFile);
                }
            }
        });
        
        return newFileList;
    });

  }, [modelMode]);

  const handleGenerateAll = () => {
    if (!apiKey && !process.env.API_KEY) {
        setIsApiKeyModalOpen(true);
        return;
    }
    const toProcess = filteredFiles.filter(f => f.status === ProcessingStatus.IDLE || f.status === ProcessingStatus.ERROR);
    toProcess.forEach(f => processFile(f));
  };
  
  const handleRegenerate = (id: string) => {
    if (!apiKey && !process.env.API_KEY) {
        setIsApiKeyModalOpen(true);
        return;
    }
    const file = files.find(f => f.id === id);
    if (file) {
        processFile(file);
    }
  };

  const handleRemoveFile = (id: string) => {
    setFiles(prev => {
      const fileToRemove = prev.find(f => f.id === id);
      if (fileToRemove) {
        if (fileToRemove.previewUrl) URL.revokeObjectURL(fileToRemove.previewUrl);
      }
      return prev.filter(f => f.id !== id);
    });
    setSelectedIds(prev => {
      const newSet = new Set(prev);
      newSet.delete(id);
      return newSet;
    });
  };

  const handleUpdateMetadata = (id: string, metadata: StockMetadata) => {
    setFiles(prev => prev.map(f => f.id === id ? { ...f, metadata } : f));
  };

  const handleAddTrending = async (id: string, trending: string[]) => {
      setFiles(prev => prev.map(f => f.id === id ? { ...f, trendingContext: trending } : f));
  };

  const handleClearAll = () => {
    files.forEach(f => {
        if (f.previewUrl) URL.revokeObjectURL(f.previewUrl);
    });
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
        let candidateBase = "";

        if (renameOnExport) {
            let safeTitle = m.title.replace(/[^a-z0-9\s-]/gi, '').trim().replace(/\s+/g, '_').substring(0, 100);
            if (!safeTitle) safeTitle = "image";
            candidateBase = safeTitle;
        } else {
            candidateBase = f.file.name.substring(0, f.file.name.lastIndexOf('.'));
        }

        let finalBase = candidateBase;
        let counter = 1;

        while (usedFilenames.has(`${finalBase}.${originalExt}`)) {
          finalBase = `${candidateBase}_${counter}`;
          counter++;
        }

        const imageFilename = `${finalBase}.${originalExt}`;
        usedFilenames.add(imageFilename);

        zip.file(imageFilename, f.file);

        const escape = (str: string) => `"${str.replace(/"/g, '""')}"`;
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
            csvRows.push([
              escape(vectorFilename),
              escape(m.title),
              escape(m.description),
              escape(m.keywords.join(', ')),
              escape(m.category)
            ]);
        }
      });

      zip.file("metadata.csv", csvRows.map(r => r.join(',')).join('\n'));
      const content = await zip.generateAsync({ type: "blob" });

      const url = URL.createObjectURL(content);
      const link = document.createElement('a');
      link.href = url;
      link.download = `stock_assets_${new Date().toISOString().slice(0, 10)}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

    } catch (e) {
      console.error("Failed to generate zip", e);
      alert("An error occurred while creating the ZIP file.");
    } finally {
      setIsExporting(false);
    }
  };

  const handleNavClick = (newView: 'generator' | 'prompts' | 'about' | 'calendar') => {
      setView(newView);
      setIsMobileMenuOpen(false);
  }

  const filteredFiles = files.filter(f => {
    if (statusFilter === 'ALL') return true;
    return f.status === statusFilter;
  });

  const handleToggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) newSet.delete(id);
      else newSet.add(id);
      return newSet;
    });
  };

  const handleSelectAll = () => {
    const allVisibleSelected = filteredFiles.length > 0 && filteredFiles.every(f => selectedIds.has(f.id));
    if (allVisibleSelected) {
      setSelectedIds(prev => {
        const newSet = new Set(prev);
        filteredFiles.forEach(f => newSet.delete(f.id));
        return newSet;
      });
    } else {
      setSelectedIds(prev => {
        const newSet = new Set(prev);
        filteredFiles.forEach(f => newSet.add(f.id));
        return newSet;
      });
    }
  };

  const handleBulkApply = (action: BulkActionType, value: any, field: BulkTargetField) => {
    setFiles(prev => prev.map(file => {
      if (!selectedIds.has(file.id) || !file.metadata) return file;
      
      // Bulk Logic
       if (field === 'keywords') {
          const keywords = value as string[]; 
          let newKeywords = [...file.metadata.keywords];
          if (action === 'ADD') {
            const existing = new Set(newKeywords.map(k => k.toLowerCase()));
            (value as string[]).forEach(k => {
              if (!existing.has(k.toLowerCase())) newKeywords.push(k);
            });
          } else if (action === 'REMOVE') {
            const toRemove = new Set((value as string[]).map(k => k.toLowerCase()));
            newKeywords = newKeywords.filter(k => !toRemove.has(k.toLowerCase()));
          } else if (action === 'REPLACE_ALL') {
            newKeywords = [...(value as string[])];
          } else if (action === 'CLEAR_ALL') {
            newKeywords = [];
          } else if (action === 'REPLACE_TEXT') {
              const { find, replace } = value as { find: string, replace: string };
              if (find) {
                  const escapedFind = find.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                  const regex = new RegExp(escapedFind, 'gi');
                  newKeywords = newKeywords.map(k => k.replace(regex, replace).trim()).filter(k => k.length > 0);
              }
          }
          return { ...file, metadata: { ...file.metadata, keywords: newKeywords } };
      } else if (field === 'title' || field === 'description') {
          let newText = field === 'title' ? file.metadata.title : file.metadata.description;
          const maxLength = field === 'title' ? 150 : 200;
          if (action === 'REPLACE_ALL') newText = value as string;
          else if (action === 'APPEND') newText = `${newText} ${value}`.trim();
          else if (action === 'PREPEND') newText = `${value} ${newText}`.trim();
          else if (action === 'REMOVE') {
              const text = value as string;
              if (text) {
                  const escapedText = text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                  const regex = new RegExp(escapedText, 'gi');
                  newText = newText.replace(regex, '');
                  newText = newText.replace(/\s+/g, ' ').trim();
              }
          } else if (action === 'REPLACE_TEXT') {
              const { find, replace } = value as { find: string, replace: string };
              if (find) {
                  const escapedFind = find.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                  const regex = new RegExp(escapedFind, 'gi');
                  newText = newText.replace(regex, replace);
                  newText = newText.replace(/\s+/g, ' ').trim();
              }
          }
          return { ...file, metadata: { ...file.metadata, [field]: newText.substring(0, maxLength) } };
      }
      return file;
    }));
  };

  const selectedCount = selectedIds.size;
  const pendingFilesCount = filteredFiles.filter(f => f.status === ProcessingStatus.IDLE || f.status === ProcessingStatus.ERROR).length;
  const processingCount = files.filter(f => f.status === ProcessingStatus.ANALYZING).length;
  const completedFiles = files.filter(f => f.status === ProcessingStatus.COMPLETED).length;
  const errorFilesCount = files.filter(f => f.status === ProcessingStatus.ERROR).length;
  
  // Progress Calculation
  const totalUploads = files.length;
  const progressPercent = totalUploads > 0 ? ((completedFiles + errorFilesCount) / totalUploads) * 100 : 0;
  const isProcessing = processingCount > 0;

  return (
    <div className={`min-h-screen flex flex-col font-sans transition-colors duration-500 ${isDarkMode ? 'bg-[#050505]' : 'bg-[#f8fafc]'}`}>
      
      {/* Clean Gradient Background */}
      <div className="fixed inset-0 z-0 pointer-events-none">
         <div className={`absolute top-0 left-0 w-full h-[500px] bg-gradient-to-b ${isDarkMode ? 'from-indigo-900/10 to-transparent' : 'from-indigo-100/50 to-transparent'}`} />
         <div className={`absolute bottom-0 right-0 w-[800px] h-[600px] rounded-full blur-[120px] opacity-[0.05] ${isDarkMode ? 'bg-blue-600' : 'bg-blue-600/30'}`} />
         {/* Additional Light Mode Ambient Mesh */}
         {!isDarkMode && (
            <div className="absolute top-[20%] right-[10%] w-[400px] h-[400px] rounded-full blur-[80px] bg-purple-100/40 opacity-50" />
         )}
      </div>

      <ApiKeyModal isOpen={isApiKeyModalOpen} onClose={() => setIsApiKeyModalOpen(false)} onSave={handleSaveApiKey} currentKey={apiKey} />
      <BulkKeywordModal isOpen={isBulkModalOpen} onClose={() => setIsBulkModalOpen(false)} onApply={handleBulkApply} selectedCount={selectedCount} />

      {/* Modern Minimal Header */}
      <header className={`sticky top-0 z-50 backdrop-blur-xl border-b transition-all duration-300 ${
        isDarkMode 
          ? 'bg-[#050505]/80 border-white/5' 
          : 'bg-white/70 border-white/40 shadow-sm shadow-slate-200/50'
      }`}>
        <div className="max-w-[1920px] mx-auto px-6 md:px-10 flex items-center justify-between py-4">
          
          {/* LEFT: LOGO */}
          <div className="flex items-center gap-4 cursor-pointer" onClick={() => handleNavClick('generator')}>
            <div className={`p-2.5 rounded-xl transition-all ${
                isDarkMode 
                ? 'bg-gradient-to-tr from-indigo-600 to-blue-600 shadow-lg shadow-indigo-900/20' 
                : 'bg-gradient-to-tr from-indigo-600 to-indigo-500 text-white shadow-lg shadow-indigo-200'
            }`}>
              <Layers className="w-5 h-5 text-white" />
            </div>
            <div>
                <h1 className={`text-2xl font-bold tracking-tight leading-none ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                StockMeta<span className="font-light opacity-70">AI</span>
                </h1>
            </div>
          </div>

          {/* RIGHT: NAVIGATION + CONTROLS */}
          <div className="hidden md:flex items-center gap-4 lg:gap-6">
             
             {/* Navigation moved here */}
             <nav className="flex items-center gap-1">
                 {[
                   { id: 'generator', icon: Home, label: 'Metadata' },
                   { id: 'prompts', icon: ImageIcon, label: 'Prompts' },
                   { id: 'calendar', icon: Calendar, label: 'Calendar' },
                   { id: 'about', icon: Info, label: 'About' }
                 ].map((item) => (
                    <button
                      key={item.id}
                      onClick={() => setView(item.id as any)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all duration-200 ${
                        view === item.id 
                        ? isDarkMode ? 'bg-white/10 text-white' : 'bg-slate-100 text-slate-900'
                        : isDarkMode ? 'text-gray-400 hover:text-white hover:bg-white/5' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
                      }`}
                    >
                      <item.icon size={16} /> <span>{item.label}</span>
                    </button>
                 ))}
             </nav>
             
             <div className="h-6 w-px bg-slate-200 dark:bg-white/10 mx-2" />

             {/* Integrated Control Bar */}
             <div className={`flex items-center gap-3 p-1.5 rounded-2xl border backdrop-blur-sm ${
                 isDarkMode ? 'bg-white/5 border-white/5' : 'bg-slate-100/80 border-slate-200/50'
             }`}>
                 {view === 'generator' && (
                   <div className={`flex rounded-xl p-1 shadow-sm ${isDarkMode ? 'bg-gray-800/80' : 'bg-white'}`}>
                      <button 
                        onClick={() => setModelMode(ModelMode.FAST)} 
                        className={`px-3 py-1.5 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${
                            modelMode === ModelMode.FAST 
                            ? isDarkMode ? 'bg-gray-700 text-indigo-400 shadow-sm' : 'bg-indigo-50 text-indigo-600 shadow-sm' 
                            : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
                        }`}
                      >
                        <Zap size={14} /> Fast
                      </button>
                      <button 
                        onClick={() => setModelMode(ModelMode.QUALITY)} 
                        className={`px-3 py-1.5 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${
                            modelMode === ModelMode.QUALITY 
                            ? isDarkMode ? 'bg-gray-700 text-purple-400 shadow-sm' : 'bg-purple-50 text-purple-600 shadow-sm'
                            : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
                        }`}
                      >
                        <Aperture size={14} /> Quality
                      </button>
                   </div>
                 )}
                 
                 {view === 'generator' && <div className="w-px h-6 bg-gray-300 dark:bg-white/10 mx-1" />}

                 <button 
                    onClick={() => setIsApiKeyModalOpen(true)} 
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-bold transition-all ${
                        !apiKey 
                        ? 'bg-red-500 text-white shadow-md shadow-red-500/20 animate-pulse' 
                        : isDarkMode ? 'hover:bg-white/10 text-emerald-400' : 'hover:bg-white/60 text-emerald-600'
                    }`}
                 >
                    {apiKey ? (
                        <>
                           <div className="w-2 h-2 rounded-full bg-emerald-500" />
                           <span className="hidden lg:inline">Connected</span>
                           <Key size={14} className="lg:hidden" />
                        </>
                    ) : (
                        <>
                           <Key size={14} /> 
                           <span>Connect API</span>
                        </>
                    )}
                 </button>
             </div>

             <div className="flex items-center gap-3">
                 <button 
                    onClick={() => setIsDarkMode(!isDarkMode)} 
                    className={`p-3 rounded-xl transition-all ${
                        isDarkMode 
                        ? 'text-gray-400 hover:text-amber-400 hover:bg-white/5' 
                        : 'text-slate-400 hover:text-amber-500 hover:bg-slate-100'
                    }`}
                 >
                    {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
                 </button>

                 <div className="relative group">
                    <div className="h-10 w-10 rounded-full p-0.5 bg-gradient-to-br from-indigo-500 to-purple-500 cursor-pointer shadow-md hover:shadow-lg transition-all">
                       <img src={user.avatar} alt={user.name} className="h-full w-full object-cover rounded-full border-2 border-white dark:border-[#111827]" />
                    </div>
                    <div className="absolute top-full right-0 mt-3 w-56 bg-white dark:bg-[#111827] border border-gray-200 dark:border-white/10 rounded-2xl shadow-xl overflow-hidden hidden group-hover:block z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                        <div className="p-4 border-b border-gray-100 dark:border-white/5">
                            <p className="text-sm font-bold text-slate-900 dark:text-white">{user.name}</p>
                            <p className="text-xs text-slate-500 dark:text-gray-400">{user.email}</p>
                        </div>
                        <button onClick={handleLogout} className="w-full text-left px-4 py-3 text-sm font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 flex items-center gap-2 transition-colors">
                          <LogOut size={16} /> Reset Application
                        </button>
                    </div>
                 </div>
             </div>
          </div>
          
          <div className="md:hidden flex items-center gap-3">
             <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2 text-gray-600 dark:text-gray-300">
                {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
             </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
            <div className="md:hidden border-t border-gray-200 dark:border-white/5 bg-white/95 dark:bg-[#050505]/95 backdrop-blur-xl absolute left-0 right-0 top-full p-4 shadow-xl z-[60] animate-in slide-in-from-top-2">
               <div className="grid grid-cols-2 gap-2 mb-4">
                  {[
                     { id: 'generator', icon: Home, label: 'Metadata' },
                     { id: 'prompts', icon: ImageIcon, label: 'Prompts' },
                     { id: 'calendar', icon: Calendar, label: 'Calendar' },
                     { id: 'about', icon: Info, label: 'About' }
                  ].map((item) => (
                    <button 
                      key={item.id}
                      onClick={() => handleNavClick(item.id as any)} 
                      className={`p-3 rounded-lg flex flex-col items-center justify-center gap-2 text-sm font-bold transition-all ${
                          view === item.id 
                          ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400' 
                          : 'bg-gray-50 dark:bg-white/5 text-gray-600 dark:text-gray-400'
                      }`}
                    >
                      <item.icon size={22}/> {item.label}
                    </button>
                  ))}
               </div>
               <div className="flex gap-2">
                   <button onClick={() => setIsDarkMode(!isDarkMode)} className="flex-1 p-3 rounded-lg bg-gray-50 dark:bg-white/5 text-base font-bold text-gray-600 dark:text-gray-300 flex items-center justify-center gap-2">
                      {isDarkMode ? <Sun size={18} /> : <Moon size={18} />} Theme
                   </button>
                   <button onClick={handleLogout} className="flex-1 p-3 rounded-lg bg-red-50 dark:bg-red-900/10 text-base font-bold text-red-600 dark:text-red-400 flex items-center justify-center gap-2">
                      <LogOut size={18} /> Reset
                   </button>
               </div>
            </div>
        )}
      </header>

      {/* Main Content */}
      <main className="flex-1 w-full max-w-[1920px] mx-auto px-6 md:px-10 py-10 relative z-10">
        
        {view === 'about' ? <About onBack={() => setView('generator')} /> : 
         view === 'prompts' ? <PromptGenerator apiKey={apiKey} onBack={() => setView('generator')} /> : 
         view === 'calendar' ? <EventCalendar onBack={() => setView('generator')} /> : (
          <div className="flex flex-col gap-10 animate-in fade-in duration-500">
            
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-gray-200 dark:border-white/5">
                <div>
                  <h2 className={`text-5xl font-bold tracking-tight mb-2 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                    Metadata Workspace
                  </h2>
                  <p className={`text-lg ${isDarkMode ? 'text-gray-400' : 'text-slate-500'}`}>
                    Upload stock photography to automatically generate optimized titles, descriptions, and keywords. Supports paired Vectors (EPS/AI).
                  </p>
                </div>
            </div>

            {/* Main Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                 {/* Left Panel: Settings (3 cols) */}
                 <div className="lg:col-span-3 order-2 lg:order-1 space-y-6">
                    <SettingsPanel settings={generationSettings} onSettingsChange={setGenerationSettings} />
                 </div>
                 
                 {/* Right Panel: Workspace (9 cols) */}
                 <div className="lg:col-span-9 order-1 lg:order-2 space-y-8">
                    <FileUploader onFilesSelected={handleFilesSelected} disabled={isProcessing} />
                    
                    {/* Action Bar */}
                    {files.length > 0 && (
                      <div className={`rounded-xl border shadow-xl shadow-slate-200/50 dark:shadow-black/20 transition-all overflow-hidden ${
                        isDarkMode 
                          ? 'bg-[#111827] border-white/10' 
                          : 'bg-white/90 border-white/60 backdrop-blur-md'
                      }`}>
                        
                        {/* Integrated Progress Bar */}
                        {isProcessing && (
                          <div className="absolute top-0 left-0 right-0 h-[3px] bg-gray-100 dark:bg-gray-800">
                            <div 
                                className="h-full bg-indigo-500 transition-all duration-300 ease-out" 
                                style={{ width: `${Math.max(5, progressPercent)}%` }}
                            />
                          </div>
                        )}
                        
                        <div className="flex flex-wrap md:flex-nowrap items-center justify-between gap-4 p-4 relative z-10">
                           <div className="flex items-center gap-4 w-full md:w-auto overflow-x-auto no-scrollbar">
                              <button 
                                  onClick={handleSelectAll}
                                  className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-bold uppercase tracking-wider transition-all border ${
                                     selectedCount > 0 
                                     ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-900/30' 
                                     : 'border-transparent text-slate-500 hover:bg-slate-50 dark:hover:bg-white/5'
                                  }`}
                              >
                                 <div className={`w-5 h-5 rounded border flex items-center justify-center transition-all ${selectedCount > 0 && selectedCount === filteredFiles.length ? 'bg-indigo-500 border-indigo-500 text-white' : 'border-slate-300 dark:border-gray-600'}`}>
                                     {selectedCount > 0 && selectedCount === filteredFiles.length && <CheckSquare size={12} />}
                                 </div>
                                 {selectedCount > 0 ? `${selectedCount} Selected` : 'Select All'}
                              </button>
                              
                              <div className="h-8 w-px bg-gray-200 dark:bg-white/10" />

                              <div className="flex items-center gap-2">
                                  <Filter size={16} className="text-gray-400" />
                                  <select
                                    value={statusFilter}
                                    onChange={(e) => setStatusFilter(e.target.value)}
                                    className="bg-transparent border-none text-base font-bold text-slate-600 dark:text-gray-300 focus:ring-0 cursor-pointer p-0 pr-6 outline-none"
                                  >
                                     <option value="ALL">All Files ({files.length})</option>
                                     <option value="COMPLETED">Completed ({completedFiles})</option>
                                     <option value="IDLE">Pending ({files.length - completedFiles - errorFilesCount})</option>
                                     <option value="ERROR">Errors ({errorFilesCount})</option>
                                  </select>
                              </div>
                           </div>

                           <div className="flex items-center gap-3 w-full md:w-auto justify-end">
                              {selectedCount > 0 && (
                                  <button onClick={() => setIsBulkModalOpen(true)} className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-700 dark:text-gray-200 text-sm font-bold transition-colors">
                                    <Edit3 size={16} /> Bulk Edit
                                  </button>
                              )}

                              {pendingFilesCount > 0 && (
                                <button onClick={handleGenerateAll} className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold shadow-md shadow-indigo-500/20 transition-all hover:scale-[1.02] active:scale-[0.98]">
                                   {isProcessing ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                                   Generate Pending
                                </button>
                              )}

                              {/* Stats Widget */}
                              <div className="hidden lg:flex items-center gap-3 px-5 py-2.5 bg-slate-50 dark:bg-white/5 rounded-lg border border-slate-200 dark:border-white/5 mr-2">
                                  <div className="flex flex-col leading-none">
                                      <span className="text-xs font-bold text-slate-400 uppercase">Total</span>
                                      <span className="text-base font-bold text-slate-700 dark:text-gray-200">{files.length}</span>
                                  </div>
                                  <div className="w-px h-8 bg-slate-200 dark:bg-white/10" />
                                  <div className="flex flex-col leading-none">
                                      <span className="text-xs font-bold text-slate-400 uppercase">Done</span>
                                      <span className="text-base font-bold text-emerald-500">{completedFiles}</span>
                                  </div>
                              </div>

                              <button 
                                onClick={handleExportZip}
                                disabled={!files.some(f => f.status === ProcessingStatus.COMPLETED) || isExporting}
                                className={`flex items-center gap-2 px-6 py-2.5 rounded-lg border text-sm font-bold transition-all ${
                                    !files.some(f => f.status === ProcessingStatus.COMPLETED) 
                                    ? 'opacity-50 cursor-not-allowed border-slate-200 dark:border-white/10 text-slate-400' 
                                    : 'border-emerald-500/30 bg-emerald-50 dark:bg-emerald-900/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/20'
                                }`}
                              >
                                 {isExporting ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
                                 Export
                              </button>

                              <button onClick={handleClearAll} className="p-3 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors" title="Clear All">
                                 <Trash2 size={18} />
                              </button>
                           </div>
                        </div>
                      </div>
                    )}

                    {/* Metadata Cards */}
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
                          apiKey={apiKey}
                        />
                      ))}
                      {filteredFiles.length === 0 && files.length > 0 && (
                          <div className="text-center py-20 text-slate-400 border-2 border-dashed border-slate-200 dark:border-gray-800 rounded-2xl">
                              <Filter className="w-16 h-16 mx-auto mb-4 opacity-20" />
                              <p className="text-base font-medium">No files match the current filter.</p>
                          </div>
                      )}
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