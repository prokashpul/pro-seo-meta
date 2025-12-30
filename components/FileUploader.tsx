
import React, { useRef, useState, useEffect } from 'react';
import { UploadCloud, Image as ImageIcon, FileType, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';

interface FileUploaderProps {
  onFilesSelected: (files: File[]) => void;
  disabled?: boolean;
}

export const FileUploader: React.FC<FileUploaderProps> = ({ onFilesSelected, disabled }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragActive, setIsDragActive] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successCount, setSuccessCount] = useState<number | null>(null);

  useEffect(() => {
    if (errorMessage || successCount) {
      const timer = setTimeout(() => {
        setErrorMessage(null);
        setSuccessCount(null);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [errorMessage, successCount]);

  const validateAndProcessFiles = (fileList: FileList | File[]) => {
    const files = Array.from(fileList);
    const supportedExtensions = ['jpg', 'jpeg', 'png', 'webp', 'eps', 'ai'];
    
    const validFiles: File[] = [];
    const invalidFiles: string[] = [];

    files.forEach(file => {
      const ext = file.name.split('.').pop()?.toLowerCase();
      if (ext && supportedExtensions.includes(ext)) {
        validFiles.push(file);
      } else {
        invalidFiles.push(file.name);
      }
    });

    if (invalidFiles.length > 0) {
      setErrorMessage(`Unsupported format: ${invalidFiles.length} file(s) ignored (${invalidFiles[0]}${invalidFiles.length > 1 ? '...' : ''})`);
      setSuccessCount(null);
    }

    if (validFiles.length > 0) {
      onFilesSelected(validFiles);
      setSuccessCount(validFiles.length);
      if (invalidFiles.length === 0) setErrorMessage(null);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      validateAndProcessFiles(e.target.files);
      e.target.value = '';
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragActive(false);
    if (disabled) return;
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      validateAndProcessFiles(e.dataTransfer.files);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) setIsDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragActive(false);
  };

  return (
    <div className="space-y-4">
      <div 
        className={`relative group h-[320px] flex flex-col items-center justify-center rounded-2xl transition-all duration-300 cursor-pointer 
          ${disabled 
            ? 'opacity-60 cursor-not-allowed border-2 border-dashed border-slate-200 dark:border-gray-800 bg-slate-50/50 dark:bg-[#0f1218]/50' 
            : isDragActive
              ? 'border-2 border-dashed border-indigo-500 bg-indigo-50/10 shadow-2xl shadow-indigo-500/10'
              : 'border-2 border-dashed border-slate-200 dark:border-gray-800 bg-white/60 dark:bg-[#0f1218] hover:border-indigo-400 hover:bg-slate-50/50 dark:hover:bg-white/5 shadow-sm hover:shadow-lg'
          }`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => !disabled && fileInputRef.current?.click()}
      >
        <input 
          type="file" 
          multiple 
          accept="image/jpeg,image/png,image/webp,.eps,.ai" 
          className="hidden" 
          ref={fileInputRef}
          onChange={handleFileChange}
        />
        
        {/* Content */}
        <div className="flex flex-col items-center p-8 text-center">
            <div className={`w-20 h-20 mb-6 rounded-3xl flex items-center justify-center transition-all duration-500 transform ${
                isDragActive 
                  ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/30 scale-110 rotate-6' 
                  : 'bg-slate-100 dark:bg-gray-800 text-slate-400 group-hover:bg-indigo-100 dark:group-hover:bg-indigo-900/30 group-hover:text-indigo-600 dark:group-hover:text-indigo-400'
            }`}>
              <UploadCloud className={`w-10 h-10 ${isDragActive ? 'animate-bounce' : ''}`} strokeWidth={2} />
            </div>
            
            <h3 className={`text-2xl font-bold mb-3 transition-colors ${
                isDragActive ? 'text-indigo-600' : 'text-slate-900 dark:text-white'
            }`}>
              {isDragActive ? 'Drop to Upload' : 'Upload Assets'}
            </h3>
            <p className="text-base text-slate-500 dark:text-gray-400 max-w-[320px]">
              Drag & drop JPG, PNG, WebP or EPS/AI files here
            </p>

            <div className="flex items-center gap-4 mt-8">
               <span className="px-4 py-2 rounded-lg bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 text-sm font-bold text-slate-400 flex items-center gap-2">
                  <ImageIcon size={16} /> JPG / PNG / WebP
               </span>
               <span className="px-4 py-2 rounded-lg bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 text-sm font-bold text-slate-400 flex items-center gap-2">
                  <FileType size={16} /> EPS / AI
               </span>
            </div>
        </div>

        {/* Temporary Feedback Overlays */}
        {errorMessage && (
          <div className="absolute bottom-4 left-4 right-4 bg-red-500 text-white px-4 py-3 rounded-xl flex items-center gap-3 animate-in slide-in-from-bottom-2 shadow-lg">
            <AlertCircle size={20} className="shrink-0" />
            <span className="text-sm font-bold truncate">{errorMessage}</span>
          </div>
        )}

        {successCount && !errorMessage && (
          <div className="absolute bottom-4 left-4 right-4 bg-emerald-500 text-white px-4 py-3 rounded-xl flex items-center gap-3 animate-in slide-in-from-bottom-2 shadow-lg">
            <CheckCircle size={20} className="shrink-0" />
            <span className="text-sm font-bold">Successfully added {successCount} files!</span>
          </div>
        )}
      </div>

      {/* Info helper */}
      <div className="flex items-center gap-2 px-2">
        <AlertCircle size={14} className="text-slate-400" />
        <p className="text-xs text-slate-400 font-medium">
          Make sure vectors (.eps/.ai) have the same name as their .jpg previews for automatic pairing.
        </p>
      </div>
    </div>
  );
};
