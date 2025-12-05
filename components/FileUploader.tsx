import React, { useRef, useState } from 'react';
import { UploadCloud, Image as ImageIcon, FileType } from 'lucide-react';

interface FileUploaderProps {
  onFilesSelected: (files: File[]) => void;
  disabled?: boolean;
}

export const FileUploader: React.FC<FileUploaderProps> = ({ onFilesSelected, disabled }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragActive, setIsDragActive] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onFilesSelected(Array.from(e.target.files));
      e.target.value = '';
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragActive(false);
    if (disabled) return;
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onFilesSelected(Array.from(e.dataTransfer.files));
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
    <div 
      className={`relative group h-[320px] flex flex-col items-center justify-center rounded-2xl transition-all duration-300 cursor-pointer 
        ${disabled 
          ? 'opacity-60 cursor-not-allowed border-2 border-dashed border-slate-200 dark:border-gray-800 bg-slate-50/50 dark:bg-[#0f1218]/50' 
          : isDragActive
            ? 'border-2 border-dashed border-indigo-500 bg-indigo-50/10'
            : 'border-2 border-dashed border-slate-200 dark:border-gray-800 bg-white/60 dark:bg-[#0f1218] hover:border-indigo-400 hover:bg-slate-50/50 dark:hover:bg-white/5 shadow-sm hover:shadow-md'
        }`}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onClick={() => !disabled && fileInputRef.current?.click()}
    >
      <input 
        type="file" 
        multiple 
        accept="image/jpeg,image/png,image/webp,.eps,.ai,application/postscript,application/illustrator" 
        className="hidden" 
        ref={fileInputRef}
        onChange={handleFileChange}
      />
      
      {/* Content */}
      <div className="flex flex-col items-center p-8 text-center">
          <div className={`w-20 h-20 mb-6 rounded-3xl flex items-center justify-center transition-all duration-300 ${
              isDragActive 
                ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/30' 
                : 'bg-slate-100 dark:bg-gray-800 text-slate-400 group-hover:bg-indigo-100 dark:group-hover:bg-indigo-900/30 group-hover:text-indigo-600 dark:group-hover:text-indigo-400'
          }`}>
            <UploadCloud className="w-10 h-10" strokeWidth={2} />
          </div>
          
          <h3 className={`text-2xl font-bold mb-3 transition-colors ${
              isDragActive ? 'text-indigo-600' : 'text-slate-900 dark:text-white'
          }`}>
            Upload Assets
          </h3>
          <p className="text-base text-slate-500 dark:text-gray-400 max-w-[320px]">
            Drag & drop JPG, PNG, or EPS files here
          </p>

          <div className="flex items-center gap-4 mt-8">
             <span className="px-4 py-2 rounded-lg bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 text-sm font-bold text-slate-400 flex items-center gap-2">
                <ImageIcon size={16} /> JPG / PNG
             </span>
             <span className="px-4 py-2 rounded-lg bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 text-sm font-bold text-slate-400 flex items-center gap-2">
                <FileType size={16} /> EPS / AI
             </span>
          </div>
      </div>
    </div>
  );
};