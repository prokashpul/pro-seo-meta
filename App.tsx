import React, { useState, useCallback } from 'react';
import { UploadedFile, ProcessingStatus, ModelMode, StockMetadata } from './types';
import { generateImageMetadata } from './services/geminiService';
import { FileUploader } from './components/FileUploader';
import { MetadataCard } from './components/MetadataCard';
import { Zap, Aperture, Layers, Trash2, Github, TrendingUp, Download } from 'lucide-react';

const MAX_PARALLEL_UPLOADS = 3;

function App() {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [modelMode, setModelMode] = useState<ModelMode>(ModelMode.QUALITY);
  
  // Convert File to Base64 helper
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const result = reader.result as string;
        // Remove data URL prefix (e.g., "data:image/jpeg;base64,")
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = error => reject(error);
    });
  };

  const processFile = async (fileObj: UploadedFile) => {
    try {
      setFiles(prev => prev.map(f => f.id === fileObj.id ? { ...f, status: ProcessingStatus.ANALYZING } : f));
      
      const base64 = await fileToBase64(fileObj.file);
      const metadata = await generateImageMetadata(base64, fileObj.file.type, modelMode);
      
      setFiles(prev => prev.map(f => 
        f.id === fileObj.id 
          ? { ...f, status: ProcessingStatus.COMPLETED, metadata } 
          : f
      ));
    } catch (error) {
      setFiles(prev => prev.map(f => 
        f.id === fileObj.id 
          ? { ...f, status: ProcessingStatus.ERROR, error: (error as Error).message } 
          : f
      ));
    }
  };

  const handleFilesSelected = useCallback((newFiles: File[]) => {
    const newUploadedFiles: UploadedFile[] = newFiles.map(file => ({
      id: Math.random().toString(36).substring(7),
      file,
      previewUrl: URL.createObjectURL(file),
      status: ProcessingStatus.IDLE
    }));

    setFiles(prev => [...prev, ...newUploadedFiles]);

    // Automatically start processing
    newUploadedFiles.forEach(f => processFile(f));
  }, [modelMode]);

  const handleRemoveFile = (id: string) => {
    setFiles(prev => {
      const fileToRemove = prev.find(f => f.id === id);
      if (fileToRemove) {
        URL.revokeObjectURL(fileToRemove.previewUrl);
      }
      return prev.filter(f => f.id !== id);
    });
  };

  const handleUpdateMetadata = (id: string, metadata: StockMetadata) => {
    setFiles(prev => prev.map(f => f.id === id ? { ...f, metadata } : f));
  };

  const handleAddTrending = (id: string, trending: string[]) => {
    setFiles(prev => prev.map(f => f.id === id ? { ...f, trendingContext: trending } : f));
  };

  const handleClearAll = () => {
    files.forEach(f => URL.revokeObjectURL(f.previewUrl));
    setFiles([]);
  };

  const handleExportCSV = () => {
    const completedFiles = files.filter(f => f.status === ProcessingStatus.COMPLETED && f.metadata);
    
    if (completedFiles.length === 0) return;

    // CSV Headers
    const headers = ['Filename', 'Title', 'Description', 'Keywords', 'Category'];
    
    // Create CSV rows
    const csvRows = [headers.join(',')];

    for (const f of completedFiles) {
      const m = f.metadata!;
      // Escape double quotes by doubling them to comply with CSV standard
      const escape = (str: string) => `"${str.replace(/"/g, '""')}"`;

      const row = [
        escape(f.file.name),
        escape(m.title),
        escape(m.description),
        escape(m.keywords.join(', ')), // Stock sites typically want comma-separated keywords string
        escape(m.category)
      ];
      csvRows.push(row.join(','));
    }

    // Create and trigger download
    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `stock_metadata_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="bg-slate-900/50 backdrop-blur-md border-b border-slate-800 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-gradient-to-tr from-indigo-500 to-purple-500 p-2 rounded-lg">
              <Layers className="text-white w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-400">
                StockMeta AI
              </h1>
              <p className="text-[10px] text-slate-400 font-medium tracking-wider">ADOBE STOCK & SHUTTERSTOCK OPTIMIZED</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Mode Switcher */}
            <div className="bg-slate-800 p-1 rounded-lg flex items-center border border-slate-700">
              <button
                onClick={() => setModelMode(ModelMode.FAST)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                  modelMode === ModelMode.FAST 
                    ? 'bg-indigo-600 text-white shadow-lg' 
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Zap size={14} />
                Fast Mode
              </button>
              <button
                onClick={() => setModelMode(ModelMode.QUALITY)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                  modelMode === ModelMode.QUALITY 
                    ? 'bg-purple-600 text-white shadow-lg' 
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Aperture size={14} />
                Pro Analysis
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Intro / Stats */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-white mb-2">Generate Metadata</h2>
          <p className="text-slate-400 max-w-2xl">
            Upload your stock photography to automatically generate optimized titles, descriptions, and keywords. 
            Uses 
            <span className={`mx-1.5 inline-block px-1.5 py-0.5 rounded text-xs border ${
                modelMode === ModelMode.QUALITY 
                ? 'border-purple-500/50 text-purple-300 bg-purple-500/10' 
                : 'border-indigo-500/50 text-indigo-300 bg-indigo-500/10'
            }`}>
              {modelMode === ModelMode.QUALITY ? 'Gemini 3 Pro Preview' : 'Gemini 2.5 Flash Lite'}
            </span> 
            vision model.
          </p>
        </div>

        {/* Uploader */}
        <div className="mb-10">
          <FileUploader onFilesSelected={handleFilesSelected} />
        </div>

        {/* Actions Bar */}
        {files.length > 0 && (
          <div className="flex justify-between items-center mb-6 sticky top-20 z-40 bg-slate-900/90 backdrop-blur p-4 rounded-xl border border-slate-800 shadow-xl">
            <div className="flex items-center gap-3">
               <span className="text-slate-300 font-medium text-sm">
                 {files.length} File{files.length !== 1 ? 's' : ''} in queue
               </span>
               <span className="w-px h-4 bg-slate-700"></span>
               <span className="text-slate-500 text-xs flex items-center gap-1">
                 <div className={`w-2 h-2 rounded-full ${files.some(f => f.status === ProcessingStatus.ANALYZING) ? 'bg-indigo-500 animate-pulse' : 'bg-emerald-500'}`}></div>
                 {files.some(f => f.status === ProcessingStatus.ANALYZING) ? 'Processing...' : 'Ready'}
               </span>
            </div>
            
            <div className="flex items-center gap-3">
              <button 
                onClick={handleExportCSV}
                disabled={!files.some(f => f.status === ProcessingStatus.COMPLETED)}
                className="text-emerald-400 hover:text-emerald-300 disabled:text-slate-600 disabled:hover:bg-transparent text-sm flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-emerald-500/10 transition-colors disabled:cursor-not-allowed"
              >
                <Download size={16} />
                Export CSV
              </button>
              
              <div className="w-px h-4 bg-slate-700"></div>

              <button 
                onClick={handleClearAll}
                className="text-red-400 hover:text-red-300 text-sm flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-red-500/10 transition-colors"
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
              onRemove={handleRemoveFile} 
              onUpdateMetadata={handleUpdateMetadata}
              onAddTrending={handleAddTrending}
            />
          ))}
        </div>

        {/* Empty State Help */}
        {files.length === 0 && (
           <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
             <div className="bg-slate-800/50 p-6 rounded-xl border border-slate-800">
                <div className="w-10 h-10 bg-indigo-500/20 text-indigo-400 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Aperture size={20} />
                </div>
                <h3 className="text-white font-medium mb-2">Vision Analysis</h3>
                <p className="text-slate-400 text-sm">Deeply analyzes composition, mood, and objects to generate accurate metadata.</p>
             </div>
             <div className="bg-slate-800/50 p-6 rounded-xl border border-slate-800">
                <div className="w-10 h-10 bg-emerald-500/20 text-emerald-400 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Zap size={20} />
                </div>
                <h3 className="text-white font-medium mb-2">SEO Optimized</h3>
                <p className="text-slate-400 text-sm">Titles and keywords tailored for Adobe Stock and Shutterstock search algorithms.</p>
             </div>
             <div className="bg-slate-800/50 p-6 rounded-xl border border-slate-800">
                <div className="w-10 h-10 bg-purple-500/20 text-purple-400 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <TrendingUp size={20} />
                </div>
                <h3 className="text-white font-medium mb-2">Trend Data</h3>
                <p className="text-slate-400 text-sm">Cross-reference with Google Search data to find high-traffic keywords.</p>
             </div>
           </div>
        )}

      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800 mt-12 bg-slate-900 py-8">
         <div className="max-w-6xl mx-auto px-4 flex justify-between items-center text-slate-500 text-sm">
            <p>&copy; 2024 StockMeta AI. Powered by Google Gemini.</p>
            <div className="flex gap-4">
               <a href="#" className="hover:text-white transition-colors"><Github size={18} /></a>
            </div>
         </div>
      </footer>
    </div>
  );
}

export default App;