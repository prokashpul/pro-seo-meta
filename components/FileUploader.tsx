import React, { useRef } from 'react';
import { UploadCloud } from 'lucide-react';

interface FileUploaderProps {
  onFilesSelected: (files: File[]) => void;
  disabled?: boolean;
}

export const FileUploader: React.FC<FileUploaderProps> = ({ onFilesSelected, disabled }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onFilesSelected(Array.from(e.target.files));
      // Reset value so same files can be selected again if needed
      e.target.value = '';
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (disabled) return;
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onFilesSelected(Array.from(e.dataTransfer.files));
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  return (
    <div 
      className={`border-2 border-dashed rounded-xl p-10 flex flex-col items-center justify-center transition-all cursor-pointer
        ${disabled 
          ? 'border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-900/50 opacity-50 cursor-not-allowed' 
          : 'border-indigo-500/50 bg-white dark:bg-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800 hover:border-indigo-400'}`}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
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
      
      <div className="bg-indigo-500/10 p-4 rounded-full mb-4">
        <UploadCloud className="w-8 h-8 text-indigo-500 dark:text-indigo-400" />
      </div>
      <h3 className="text-xl font-semibold mb-2 text-slate-800 dark:text-slate-200">
        Upload Stock Assets
      </h3>
      <p className="text-center max-w-md text-slate-500 dark:text-slate-400">
        Drag & drop or click to browse. 
        <br />
        <span className="text-indigo-500 dark:text-indigo-400">JPG, PNG, WEBP, EPS, AI</span>
        <br />
        <span className="text-xs mt-2 block text-slate-400 dark:text-slate-500">
          Vectors (.eps, .ai) will be automatically paired with matching preview images.
        </span>
      </p>
    </div>
  );
};