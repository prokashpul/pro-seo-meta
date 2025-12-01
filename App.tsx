
import React, { useState, useCallback, useEffect } from 'react';
import { UploadedFile, ProcessingStatus, ModelMode, StockMetadata } from './types';
import { generateImageMetadata, getTrendingKeywords } from './services/geminiService';
import { optimizeImage } from './services/imageOptimizer';
import { FileUploader } from './components/FileUploader';
import { MetadataCard } from './components/MetadataCard';
import { BulkKeywordModal, BulkActionType, BulkTargetField } from './components/BulkKeywordModal';
import { Login } from './components/Login';
import { ApiKeyModal } from './components/ApiKeyModal';
import { About } from './components/About';
import { PromptGenerator } from './components/PromptGenerator';
import { EventCalendar } from './components/EventCalendar';
import { Zap, Aperture, Trash2, Github, TrendingUp, Download, CheckSquare, Edit3, Loader2, Sparkles, Sun, Moon, Key, LogOut, Info, Home, Image as ImageIcon, Menu, X, Calendar, Layers } from 'lucide-react';
import JSZip from 'jszip';

const MAX_PARALLEL_UPLOADS = 3;

function App() {
  const [user, setUser] = useState<{name: string, email: string, avatar: string} | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [apiKey, setApiKey] = useState<string>('');
  const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState(false);
  
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [modelMode, setModelMode] = useState<ModelMode>(ModelMode.FAST);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [renameOnExport, setRenameOnExport] = useState(true);
  
  // Initialize Dark Mode from Local Storage
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const savedTheme = localStorage.getItem('stockmeta_theme');
    // Default to true (dark) if no preference found
    return savedTheme ? savedTheme === 'dark' : true;
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

  // Load API Key from local storage & Auto-login if key exists
  useEffect(() => {
    const storedKey = localStorage.getItem('gemini_api_key');
    if (storedKey) {
      setApiKey(storedKey);
      // Auto-login to bypass welcome screen
      setUser({
        name: 'StockMeta User',
        email: 'user@example.com',
        avatar: 'https://lh3.googleusercontent.com/a/default-user=s96-c' 
      });
    }
  }, []);

  const handleLogin = async () => {
    setIsLoggingIn(true);
    // Simulate Login
    setTimeout(() => {
        setUser({
          name: 'StockMeta User',
          email: 'user@example.com',
          avatar: 'https://lh3.googleusercontent.com/a/default-user=s96-c' 
        });
        setIsLoggingIn(false);
        
        // If no key is set after login, prompt for it
        if (!localStorage.getItem('gemini_api_key')) {
           setIsApiKeyModalOpen(true);
        }
    }, 1500);
  };

  const handleLogout = () => {
    setUser(null);
    setFiles([]);
    setSelectedIds(new Set());
  };

  const handleSaveApiKey = (key: string) => {
      setApiKey(key);
      localStorage.setItem('gemini_api_key', key);
      // Ensure user is logged in if they save the key
      if (!user) {
          setUser({
            name: 'StockMeta User',
            email: 'user@example.com',
            avatar: 'https://lh3.googleusercontent.com/a/default-user=s96-c' 
          });
      }
  };
  
  const processFile = async (fileObj: UploadedFile) => {
    // Cannot process vectors without a preview image
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
      
      // Optimize image (resize & convert to WebP) before sending to AI
      const { base64, mimeType } = await optimizeImage(fileObj.file);
      
      const metadata = await generateImageMetadata(base64, mimeType, modelMode, apiKey);
      
      setFiles(prev => prev.map(f => 
        f.id === fileObj.id 
          ? { ...f, status: ProcessingStatus.COMPLETED, metadata } 
          : f
      ));
    } catch (error) {
      const errorMsg = (error as Error).message;
      
      // Auto-open API Key modal if invalid
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
    // Pairing Logic
    const incomingMap = new Map<string, { image?: File, vector?: File }>();
    
    const getBasename = (name: string) => name.substring(0, name.lastIndexOf('.'));
    const isVector = (file: File) => /\.(eps|ai)$/i.test(file.name);
    const isImage = (file: File) => /\.(jpg|jpeg|png|webp)$/i.test(file.name);

    // 1. Group incoming files by basename
    incomingFiles.forEach(f => {
        const base = getBasename(f.name);
        if (!incomingMap.has(base)) incomingMap.set(base, {});
        
        if (isVector(f)) incomingMap.get(base)!.vector = f;
        else if (isImage(f)) incomingMap.get(base)!.image = f;
    });

    setFiles(prev => {
        const newFileList = [...prev];
        
        incomingMap.forEach((group, basename) => {
            // Check if we can pair with an existing file in the list
            const existingIndex = newFileList.findIndex(f => getBasename(f.file.name) === basename);
            
            if (existingIndex >= 0) {
                // Merge with existing entry
                const existing = newFileList[existingIndex];
                
                // If we found a vector for an existing image
                if (group.vector && !existing.vectorFile) {
                     newFileList[existingIndex] = { ...existing, vectorFile: group.vector };
                }
                
                // If we found an image for an existing orphaned vector
                if (group.image && !isImage(existing.file)) {
                     // Replace the vector-as-file with the image-as-file
                     const updated: UploadedFile = {
                         ...existing,
                         file: group.image,
                         vectorFile: existing.file, // The old 'file' was the vector
                         previewUrl: URL.createObjectURL(group.image),
                         status: ProcessingStatus.IDLE, // Ready to process now
                         error: undefined
                     };
                     newFileList[existingIndex] = updated;
                }
            } else {
                // New Entry
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
                    // Orphan vector (no image yet)
                    const newFile: UploadedFile = {
                        id: Math.random().toString(36).substring(7),
                        file: group.vector, // Store vector as primary temporarily
                        previewUrl: "", // No preview
                        status: ProcessingStatus.ERROR, // Will show error state
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
    const toProcess = files.filter(f => f.status === ProcessingStatus.IDLE || f.status === ProcessingStatus.ERROR);
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
      
      // CSV Headers
      const csvRows = [['Filename', 'Title', 'Description', 'Keywords', 'Category']];

      completedFiles.forEach((f) => {
        const m = f.metadata!;
        const originalExt = f.file.name.split('.').pop() || 'jpg';
        
        // Determine the base filename
        let candidateBase = "";

        if (renameOnExport) {
            // Sanitize title to create a safe filename
            let safeTitle = m.title
              .replace(/[^a-z0-9\s-]/gi, '')
              .trim()
              .replace(/\s+/g, '_')
              .substring(0, 100);
            if (!safeTitle) safeTitle = "image";
            candidateBase = safeTitle;
        } else {
            // Use original filename (stripped of extension)
            candidateBase = f.file.name.substring(0, f.file.name.lastIndexOf('.'));
        }

        let finalBase = candidateBase;
        let counter = 1;

        // Check collision for the Image filename to ensure uniqueness
        while (usedFilenames.has(`${finalBase}.${originalExt}`)) {
          finalBase = `${candidateBase}_${counter}`;
          counter++;
        }

        const imageFilename = `${finalBase}.${originalExt}`;
        usedFilenames.add(imageFilename);

        // 1. Add Image to ZIP
        zip.file(imageFilename, f.file);

        const escape = (str: string) => `"${str.replace(/"/g, '""')}"`;

        // 2. Add Image Row to CSV
        csvRows.push([
          escape(imageFilename),
          escape(m.title),
          escape(m.description),
          escape(m.keywords.join(', ')),
          escape(m.category)
        ]);

        // 3. Handle Vector (if exists) - Add to ZIP and Add separate CSV row
        if (f.vectorFile) {
            const vectorExt = f.vectorFile.name.split('.').pop() || 'eps';
            const vectorFilename = `${finalBase}.${vectorExt}`;
            
            // Add Vector to Zip
            zip.file(vectorFilename, f.vectorFile);

            // Add Vector Row to CSV
            csvRows.push([
              escape(vectorFilename),
              escape(m.title),
              escape(m.description),
              escape(m.keywords.join(', ')),
              escape(m.category)
            ]);
        }
      });

      // Add CSV to zip
      zip.file("metadata.csv", csvRows.map(r => r.join(',')).join('\n'));

      // Generate the zip file
      const content = await zip.generateAsync({ type: "blob" });

      // Trigger download
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

  // Bulk Selection Logic and other methods...
  const handleToggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const handleSelectAll = () => {
    if (selectedIds.size === files.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(files.map(f => f.id)));
    }
  };

  const handleBulkApply = (action: BulkActionType, value: any, field: BulkTargetField) => {
    setFiles(prev => prev.map(file => {
      if (!selectedIds.has(file.id) || !file.metadata) return file;

      if (field === 'keywords') {
          const keywords = value as string[];
          let newKeywords = [...file.metadata.keywords];
          
          if (action === 'ADD') {
            const existing = new Set(newKeywords.map(k => k.toLowerCase()));
            keywords.forEach(k => {
              if (!existing.has(k.toLowerCase())) {
                newKeywords.push(k);
              }
            });
          } else if (action === 'REMOVE') {
            const toRemove = new Set(keywords.map(k => k.toLowerCase()));
            newKeywords = newKeywords.filter(k => !toRemove.has(k.toLowerCase()));
          } else if (action === 'REPLACE_ALL') {
            newKeywords = [...keywords];
          } else if (action === 'CLEAR_ALL') {
            newKeywords = [];
          }

          return {
            ...file,
            metadata: {
              ...file.metadata,
              keywords: newKeywords
            }
          };
      } else if (field === 'title') {
          let newTitle = file.metadata.title;
          
          if (action === 'REPLACE_ALL') {
              newTitle = value as string;
          } else if (action === 'APPEND') {
              newTitle = `${newTitle} ${value}`.trim();
          } else if (action === 'PREPEND') {
              newTitle = `${value} ${newTitle}`.trim();
          } else if (action === 'REMOVE') {
              const text = value as string;
              // Case insensitive, global replacement logic for "Remove Text"
              if (text) {
                  const escapedText = text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                  const regex = new RegExp(escapedText, 'gi');
                  newTitle = newTitle.replace(regex, '');
                  // Clean up extra whitespace left behind
                  newTitle = newTitle.replace(/\s+/g, ' ').trim();
              }
          } else if (action === 'REPLACE_TEXT') {
              const { find, replace } = value as { find: string, replace: string };
              if (find) {
                  const escapedFind = find.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                  const regex = new RegExp(escapedFind, 'gi');
                  newTitle = newTitle.replace(regex, replace);
                  // Clean up extra whitespace left behind
                  newTitle = newTitle.replace(/\s+/g, ' ').trim();
              }
          }
          
          return {
            ...file,
            metadata: {
              ...file.metadata,
              title: newTitle.substring(0, 150) // Enforce max length safety
            }
          };
      }
      
      return file;
    }));
  };

  if (!user) {
    return (
      <Login 
        onLogin={handleLogin} 
        isLoggingIn={isLoggingIn}
        isDarkMode={isDarkMode} 
        toggleTheme={() => setIsDarkMode(!isDarkMode)} 
      />
    );
  }

  const selectedCount = selectedIds.size;
  const pendingFilesCount = files.filter(f => f.status === ProcessingStatus.IDLE || f.status === ProcessingStatus.ERROR).length;

  return (
    <div className={`min-h-screen flex flex-col transition-colors duration-300 ${isDarkMode ? 'bg-[#0f172a]' : 'bg-slate-50'}`}>
      <ApiKeyModal 
        isOpen={isApiKeyModalOpen}
        onClose={() => setIsApiKeyModalOpen(false)}
        onSave={handleSaveApiKey}
        currentKey={apiKey}
      />

      <BulkKeywordModal 
        isOpen={isBulkModalOpen} 
        onClose={() => setIsBulkModalOpen(false)}
        onApply={handleBulkApply}
        selectedCount={selectedCount}
      />

      {/* Header */}
      <header className={`backdrop-blur-md border-b sticky top-0 z-50 transition-colors duration-300 ${
        isDarkMode ? 'bg-slate-900/50 border-slate-800' : 'bg-white/70 border-slate-200'
      }`}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div 
            className="flex items-center gap-2 cursor-pointer group"
            onClick={() => handleNavClick('generator')}
          >
            <div className="p-1 rounded-lg group-hover:shadow-lg transition-all animate-in zoom-in bg-gradient-to-br from-indigo-500/10 to-purple-500/10 dark:from-indigo-500/20 dark:to-purple-500/20">
              <Layers className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-400">
                StockMeta AI
              </h1>
              <p className={`text-[10px] font-medium tracking-wider hidden sm:block ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                ADOBE STOCK & SHUTTERSTOCK OPTIMIZED
              </p>
            </div>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-4">
             
             {/* Home Button (Visible when not on Home) */}
             {view !== 'generator' && (
                 <button
                    onClick={() => setView('generator')}
                    className={`p-2 rounded-lg border transition-colors flex items-center gap-2 text-xs font-medium ${
                      isDarkMode 
                        ? 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white hover:border-slate-600' 
                        : 'bg-white border-slate-200 text-slate-600 hover:text-slate-900 hover:border-slate-300'
                    }`}
                    title="Back to Generator"
                  >
                    <Home size={14} />
                    <span>Home</span>
                  </button>
             )}

             {/* Prompts Button */}
             <button
                onClick={() => setView('prompts')}
                className={`p-2 rounded-lg border transition-colors flex items-center gap-2 text-xs font-medium ${
                  view === 'prompts'
                    ? 'bg-pink-600 text-white border-pink-600'
                    : isDarkMode 
                      ? 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white hover:border-slate-600' 
                      : 'bg-white border-slate-200 text-slate-600 hover:text-slate-900 hover:border-slate-300'
                }`}
                title="Prompts Generate"
              >
                <ImageIcon size={14} />
                <span>Prompts</span>
              </button>

             {/* Calendar Button */}
             <button
                onClick={() => setView('calendar')}
                className={`p-2 rounded-lg border transition-colors flex items-center gap-2 text-xs font-medium ${
                  view === 'calendar'
                    ? 'bg-blue-600 text-white border-blue-600'
                    : isDarkMode 
                      ? 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white hover:border-slate-600' 
                      : 'bg-white border-slate-200 text-slate-600 hover:text-slate-900 hover:border-slate-300'
                }`}
                title="Event Calendar"
              >
                <Calendar size={14} />
                <span>Calendar</span>
              </button>

             {/* About Button */}
             <button
                onClick={() => setView('about')}
                className={`p-2 rounded-lg border transition-colors flex items-center gap-2 text-xs font-medium ${
                  view === 'about'
                    ? 'bg-indigo-500 text-white border-indigo-500'
                    : isDarkMode 
                      ? 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white hover:border-slate-600' 
                      : 'bg-white border-slate-200 text-slate-600 hover:text-slate-900 hover:border-slate-300'
                }`}
                title="About"
              >
                <Info size={14} />
                <span>About</span>
              </button>

            {/* Mode Switcher - Only on Generator view */}
            {view === 'generator' && (
              <div className={`flex p-1 rounded-lg items-center border transition-colors ${
                isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-100 border-slate-200'
              }`}>
                <button
                  onClick={() => setModelMode(ModelMode.FAST)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                    modelMode === ModelMode.FAST 
                      ? 'bg-indigo-600 text-white shadow-lg' 
                      : (isDarkMode ? 'text-slate-400 hover:text-slate-200' : 'text-slate-500 hover:text-slate-900')
                  }`}
                >
                  <Zap size={14} />
                  Fast
                </button>
                <button
                  onClick={() => setModelMode(ModelMode.QUALITY)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                    modelMode === ModelMode.QUALITY 
                      ? 'bg-purple-600 text-white shadow-lg' 
                      : (isDarkMode ? 'text-slate-400 hover:text-slate-200' : 'text-slate-500 hover:text-slate-900')
                  }`}
                >
                  <Aperture size={14} />
                  Pro
                </button>
              </div>
            )}

            <div className="h-6 w-px bg-slate-200 dark:bg-slate-700"></div>

            {/* API Key & User Profile */}
            <div className="flex items-center gap-3">
               
               <button
                  onClick={() => setIsApiKeyModalOpen(true)}
                  className={`p-2 rounded-lg border transition-colors flex items-center gap-2 text-xs font-medium ${
                    isDarkMode 
                      ? 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white hover:border-slate-600' 
                      : 'bg-white border-slate-200 text-slate-600 hover:text-slate-900 hover:border-slate-300'
                  } ${!apiKey ? 'ring-2 ring-indigo-500 ring-offset-2 ring-offset-slate-900' : ''}`}
                  title="Manage API Key"
                >
                  <Key size={14} />
                </button>

                <div className="relative group">
                   <img 
                     src={user.avatar} 
                     alt={user.name}
                     className="w-8 h-8 rounded-full border border-slate-200 dark:border-slate-700 cursor-pointer object-cover" 
                   />
                   
                   {/* Dropdown / Sign Out */}
                   <div className="absolute top-full right-0 mt-2 w-56 bg-white dark:bg-slate-800 border dark:border-slate-700 shadow-lg rounded-lg overflow-hidden hidden group-hover:block z-50 animate-in fade-in slide-in-from-top-2">
                       <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-700">
                           <p className="text-sm font-semibold text-slate-900 dark:text-white truncate" title={user.name}>{user.name}</p>
                           <p className="text-xs text-slate-500 dark:text-slate-400 truncate" title={user.email}>{user.email}</p>
                       </div>
                       
                       <button 
                         onClick={handleLogout} 
                         className="w-full text-left px-4 py-2 text-xs text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2"
                       >
                          <LogOut size={12} />
                          Sign Out
                       </button>
                   </div>
                </div>
            </div>

            {/* Theme Toggle */}
             <button
                onClick={() => setIsDarkMode(!isDarkMode)}
                className={`p-2 rounded-full transition-colors ${
                  isDarkMode 
                    ? 'bg-slate-800 text-yellow-400 hover:bg-slate-700' 
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-orange-500'
                }`}
                title="Toggle Dark Mode"
              >
                {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
              </button>

          </div>
          
          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center gap-3">
             <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className={`p-2 rounded-lg transition-colors ${
                  isDarkMode ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
                }`}
             >
                {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
             </button>
          </div>
        </div>

        {/* Mobile Navigation Dropdown */}
        {isMobileMenuOpen && (
            <div className="md:hidden border-t border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl animate-in slide-in-from-top-2">
                <div className="px-4 py-4 space-y-4">
                    {/* User Info Mobile */}
                    <div className="flex items-center gap-3 pb-4 border-b border-slate-100 dark:border-slate-700">
                        <img 
                            src={user.avatar} 
                            alt={user.name}
                            className="w-10 h-10 rounded-full border border-slate-200 dark:border-slate-700 object-cover" 
                        />
                        <div className="flex-1 overflow-hidden">
                            <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">{user.name}</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{user.email}</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                         <button
                            onClick={() => handleNavClick('generator')}
                            className={`p-3 rounded-lg border text-sm font-medium flex items-center justify-center gap-2 ${
                              view === 'generator'
                                ? 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-400'
                                : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                            }`}
                         >
                            <Home size={16} /> Home
                         </button>

                         <button
                            onClick={() => handleNavClick('prompts')}
                            className={`p-3 rounded-lg border text-sm font-medium flex items-center justify-center gap-2 ${
                              view === 'prompts'
                                ? 'bg-pink-50 dark:bg-pink-900/20 border-pink-200 dark:border-pink-800 text-pink-700 dark:text-pink-400'
                                : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                            }`}
                         >
                            <ImageIcon size={16} /> Prompts
                         </button>

                         <button
                            onClick={() => handleNavClick('calendar')}
                            className={`p-3 rounded-lg border text-sm font-medium flex items-center justify-center gap-2 ${
                              view === 'calendar'
                                ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-400'
                                : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                            }`}
                         >
                            <Calendar size={16} /> Calendar
                         </button>
                    </div>
                    
                    <button
                        onClick={() => handleNavClick('about')}
                        className={`w-full p-3 rounded-lg border text-sm font-medium flex items-center justify-center gap-2 ${
                              view === 'about'
                                ? 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-400'
                                : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                        }`}
                    >
                        <Info size={16} /> About StockMeta
                    </button>

                    {/* Mode Switcher Mobile */}
                    {view === 'generator' && (
                        <div className="grid grid-cols-2 gap-3 pt-2">
                             <button
                                onClick={() => { setModelMode(ModelMode.FAST); setIsMobileMenuOpen(false); }}
                                className={`p-2 rounded-lg text-xs font-medium flex items-center justify-center gap-2 border ${
                                    modelMode === ModelMode.FAST
                                    ? 'bg-indigo-600 border-indigo-600 text-white'
                                    : 'bg-transparent border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400'
                                }`}
                             >
                                <Zap size={14} /> Fast Mode
                             </button>
                             <button
                                onClick={() => { setModelMode(ModelMode.QUALITY); setIsMobileMenuOpen(false); }}
                                className={`p-2 rounded-lg text-xs font-medium flex items-center justify-center gap-2 border ${
                                    modelMode === ModelMode.QUALITY
                                    ? 'bg-purple-600 border-purple-600 text-white'
                                    : 'bg-transparent border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400'
                                }`}
                             >
                                <Aperture size={14} /> Pro Analysis
                             </button>
                        </div>
                    )}

                    <div className="border-t border-slate-100 dark:border-slate-700 pt-4 flex items-center justify-between">
                         <button
                            onClick={() => setIsDarkMode(!isDarkMode)}
                            className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300"
                         >
                            {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
                            {isDarkMode ? 'Light Mode' : 'Dark Mode'}
                         </button>

                         <button
                            onClick={() => { setIsApiKeyModalOpen(true); setIsMobileMenuOpen(false); }}
                            className="flex items-center gap-2 text-sm text-indigo-600 dark:text-indigo-400 font-medium"
                         >
                            <Key size={16} /> API Key
                         </button>
                    </div>

                    <button 
                         onClick={handleLogout} 
                         className="w-full text-center py-2 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center justify-center gap-2 rounded-lg"
                    >
                          <LogOut size={16} />
                          Sign Out
                    </button>
                </div>
            </div>
        )}
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {view === 'about' ? (
          <About onBack={() => setView('generator')} />
        ) : view === 'prompts' ? (
          <PromptGenerator apiKey={apiKey} onBack={() => setView('generator')} />
        ) : view === 'calendar' ? (
          <EventCalendar onBack={() => setView('generator')} />
        ) : (
          <>
            {/* Intro / Stats */}
            <div className="mb-8">
              <h2 className={`text-3xl font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                Generate Metadata
              </h2>
              <p className={`max-w-2xl ${isDarkMode ? 'text-slate-400' : 'text-slate-600'} block sm:hidden`}>
                 Upload stock photography to generate optimized metadata.
              </p>
              <p className={`max-w-2xl ${isDarkMode ? 'text-slate-400' : 'text-slate-600'} hidden sm:block`}>
                Upload your stock photography to automatically generate optimized titles, descriptions, and keywords. 
                Supports paired Vectors (EPS/AI) if matched by filename.
              </p>
            </div>

            {/* Uploader */}
            <div className="mb-10">
              <FileUploader onFilesSelected={handleFilesSelected} />
            </div>

            {/* Actions Bar */}
            {files.length > 0 && (
              <div className={`flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-6 sticky top-20 z-40 backdrop-blur p-4 rounded-xl border shadow-xl transition-all ${
                isDarkMode ? 'bg-slate-900/90 border-slate-800' : 'bg-white/90 border-slate-200'
              }`}>
                <div className="flex items-center gap-3">
                  {selectedCount > 0 ? (
                    <div className="flex items-center gap-3 animate-in fade-in slide-in-from-left-2">
                      <button 
                          onClick={handleSelectAll}
                          className="text-indigo-400 font-medium text-sm flex items-center gap-2 px-2 py-1 rounded hover:bg-indigo-500/10 transition-colors"
                      >
                        <div className={`w-4 h-4 rounded border flex items-center justify-center ${selectedCount === files.length ? 'bg-indigo-500 border-indigo-500' : 'border-indigo-400'}`}>
                            {selectedCount === files.length && <CheckSquare size={10} className="text-white" />}
                        </div>
                        {selectedCount} Selected
                      </button>
                    </div>
                  ) : (
                    <>
                      <span className={`font-medium text-sm ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                        {files.length} Asset{files.length !== 1 ? 's' : ''}
                      </span>
                      <span className="hidden sm:inline w-px h-4 bg-slate-700"></span>
                      <span className="text-slate-500 text-xs flex items-center gap-1">
                        <div className={`w-2 h-2 rounded-full ${files.some(f => f.status === ProcessingStatus.ANALYZING) ? 'bg-indigo-500 animate-pulse' : 'bg-emerald-500'}`}></div>
                        {files.some(f => f.status === ProcessingStatus.ANALYZING) ? 'Processing...' : 'Ready'}
                      </span>
                    </>
                  )}
                </div>
                
                <div className="flex flex-wrap items-center gap-3">
                  
                  {/* Generate Button (Primary Action) */}
                  {pendingFilesCount > 0 && (
                    <button 
                      onClick={handleGenerateAll}
                      className="bg-indigo-600 hover:bg-indigo-500 text-white text-sm flex items-center gap-2 px-4 py-2 rounded-lg shadow-lg shadow-indigo-500/20 transition-all hover:scale-105 animate-in zoom-in-95 font-semibold w-full md:w-auto justify-center"
                    >
                      <Sparkles size={16} />
                      Generate Metadata ({pendingFilesCount})
                    </button>
                  )}

                  {/* Select All Toggle (if none selected yet) */}
                  {selectedCount === 0 && (
                    <button 
                      onClick={handleSelectAll}
                      className={`text-sm flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors ${
                        isDarkMode ? 'text-slate-400 hover:text-white hover:bg-slate-800' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
                      }`}
                    >
                      <CheckSquare size={16} />
                      Select All
                    </button>
                  )}

                  {/* Bulk Edit Button */}
                  {selectedCount > 0 && (
                    <button 
                      onClick={() => setIsBulkModalOpen(true)}
                      className={`text-white text-sm flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all animate-in zoom-in-95 ${
                        isDarkMode ? 'bg-slate-700 hover:bg-slate-600' : 'bg-slate-600 hover:bg-slate-500'
                      }`}
                    >
                      <Edit3 size={16} />
                      Bulk Edit
                    </button>
                  )}

                  <div className="hidden sm:block w-px h-4 bg-slate-700"></div>

                  {/* Rename Toggle */}
                  <label className="flex items-center gap-2 cursor-pointer group px-2 select-none">
                      <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                        renameOnExport 
                          ? 'bg-indigo-500 border-indigo-500' 
                          : (isDarkMode ? 'border-slate-600 bg-slate-800' : 'border-slate-300 bg-slate-100')
                      }`}>
                          {renameOnExport && <CheckSquare size={10} className="text-white" />}
                      </div>
                      <input 
                          type="checkbox" 
                          className="hidden" 
                          checked={renameOnExport} 
                          onChange={e => setRenameOnExport(e.target.checked)} 
                      />
                      <span className={`text-xs font-medium ${
                        renameOnExport 
                          ? 'text-indigo-400' 
                          : (isDarkMode ? 'text-slate-400 group-hover:text-slate-300' : 'text-slate-500 group-hover:text-slate-700')
                      }`}>
                          Rename files
                      </span>
                  </label>

                  <button 
                    onClick={handleExportZip}
                    disabled={!files.some(f => f.status === ProcessingStatus.COMPLETED) || isExporting}
                    className={`text-sm flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors disabled:cursor-not-allowed min-w-[120px] justify-center ${
                      !files.some(f => f.status === ProcessingStatus.COMPLETED) || isExporting
                      ? 'text-slate-400 hover:bg-transparent'
                      : 'text-emerald-500 hover:text-emerald-600 hover:bg-emerald-500/10'
                    }`}
                  >
                    {isExporting ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
                    {isExporting ? 'Zipping...' : 'Export ZIP'}
                  </button>
                  
                  <div className="hidden sm:block w-px h-4 bg-slate-700"></div>

                  <button 
                    onClick={handleClearAll}
                    className="text-red-400 hover:text-red-500 text-sm flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-red-500/10 transition-colors"
                  >
                    <Trash2 size={16} />
                    Clear All
                  </button>
                </div>
              </div>
            )}

            {/* List of Cards */}
            <div className="space-y-6">
              {files.map(file => (
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
            </div>

            {/* Empty State Help */}
            {files.length === 0 && (
              <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
                <div className={`p-6 rounded-xl border transition-colors ${
                    isDarkMode ? 'bg-slate-800/50 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
                }`}>
                    <div className="w-10 h-10 bg-indigo-500/20 text-indigo-500 rounded-lg flex items-center justify-center mx-auto mb-4">
                      <Aperture size={20} />
                    </div>
                    <h3 className={`font-medium mb-2 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Vision Analysis</h3>
                    <p className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Deeply analyzes composition, mood, and objects to generate accurate metadata.</p>
                </div>
                <div className={`p-6 rounded-xl border transition-colors ${
                    isDarkMode ? 'bg-slate-800/50 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
                }`}>
                    <div className="w-10 h-10 bg-emerald-500/20 text-emerald-500 rounded-lg flex items-center justify-center mx-auto mb-4">
                      <Zap size={20} />
                    </div>
                    <h3 className={`font-medium mb-2 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Vectors Supported</h3>
                    <p className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Upload EPS/AI files with matching JPG previews. They get renamed together on export.</p>
                </div>
                <div className={`p-6 rounded-xl border transition-colors ${
                    isDarkMode ? 'bg-slate-800/50 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
                }`}>
                    <div className="w-10 h-10 bg-purple-500/20 text-purple-500 rounded-lg flex items-center justify-center mx-auto mb-4">
                      <TrendingUp size={20} />
                    </div>
                    <h3 className={`font-medium mb-2 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Trend Data</h3>
                    <p className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Cross-reference with Google Search data to find high-traffic keywords.</p>
                </div>
              </div>
            )}
          </>
        )}

      </main>

      {/* Footer */}
      <footer className={`border-t py-8 mt-12 transition-colors ${
        isDarkMode ? 'border-slate-800 bg-slate-900' : 'border-slate-200 bg-white'
      }`}>
         <div className="max-w-6xl mx-auto px-4 flex justify-between items-center text-sm">
            <p className={isDarkMode ? 'text-slate-500' : 'text-slate-400'}>&copy; 2025 - 2030 StockMeta AI. Powered by Google Gemini.</p>
            <div className="flex gap-4">
               <button 
                 onClick={() => setView('about')}
                 className={`transition-colors hover:underline ${isDarkMode ? 'text-slate-500 hover:text-white' : 'text-slate-400 hover:text-slate-900'}`}
               >
                 About
               </button>
               <a href="#" className={`transition-colors ${isDarkMode ? 'text-slate-500 hover:text-white' : 'text-slate-400 hover:text-slate-900'}`}><Github size={18} /></a>
            </div>
         </div>
      </footer>
    </div>
  );
}

export default App;
