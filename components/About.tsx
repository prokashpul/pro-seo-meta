import React from 'react';
import { UploadCloud, Sparkles, Edit3, Download, Zap, Aperture, TrendingUp, ShieldCheck, ArrowLeft } from 'lucide-react';

interface AboutProps {
  onBack?: () => void;
}

export const About: React.FC<AboutProps> = ({ onBack }) => {
  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 relative">
      {onBack && (
        <button 
          onClick={onBack}
          className="mb-4 inline-flex items-center gap-2 text-sm text-slate-400 hover:text-indigo-500 transition-colors font-medium"
        >
          <ArrowLeft size={16} /> Back to Home
        </button>
      )}

      <div className="text-center mb-12">
        <h2 className="text-3xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 to-purple-500">
          About StockMeta AI
        </h2>
        <p className="max-w-2xl mx-auto text-slate-600 dark:text-slate-400 text-lg">
          The intelligent workflow automation tool designed specifically for Adobe Stock and Shutterstock contributors.
        </p>
      </div>

      {/* How It Works Section */}
      <div className="mb-16">
        <h3 className="text-xl font-bold mb-8 text-slate-900 dark:text-white flex items-center gap-2">
          <span className="bg-indigo-500 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs">1</span>
          How it Works
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-6 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-4">
              <UploadCloud size={24} />
            </div>
            <h4 className="font-bold text-slate-900 dark:text-white mb-2">Upload Assets</h4>
            <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
              Drag and drop your stock photos (JPG, PNG, WEBP) or vector files (EPS, AI). The system automatically pairs vectors with their preview images if they share the same filename.
            </p>
          </div>

          <div className="p-6 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-lg bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 flex items-center justify-center mb-4">
              <Sparkles size={24} />
            </div>
            <h4 className="font-bold text-slate-900 dark:text-white mb-2">AI Analysis</h4>
            <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
              Google Gemini Vision models analyze your content to understand composition, mood, and objects. It automatically generates SEO-friendly titles (55-150 chars), descriptions (max 200 chars), and 35-49 keywords.
            </p>
          </div>

          <div className="p-6 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-lg bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-4">
              <Edit3 size={24} />
            </div>
            <h4 className="font-bold text-slate-900 dark:text-white mb-2">Review & Refine</h4>
            <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
              Use <strong>Bulk Edit</strong> to manage keywords across multiple files. Use <strong>Trend Search</strong> to find high-traffic keywords from Google Search. Auto-save ensures you never lose work.
            </p>
          </div>

          <div className="p-6 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-4">
              <Download size={24} />
            </div>
            <h4 className="font-bold text-slate-900 dark:text-white mb-2">Export</h4>
            <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
              Download a ready-to-upload ZIP file. It includes your renamed assets (based on titles) and a CSV file formatted for stock agencies.
            </p>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="mb-16">
        <h3 className="text-xl font-bold mb-8 text-slate-900 dark:text-white flex items-center gap-2">
          <span className="bg-indigo-500 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs">2</span>
          Key Features
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
           <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50">
              <div className="flex items-center gap-3 mb-3">
                <Aperture className="text-indigo-500" size={20} />
                <h4 className="font-bold text-slate-800 dark:text-slate-200">Vision Intelligence</h4>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Uses state-of-the-art multimodal AI to "see" your images like a human reviewer would, identifying subtle concepts and technical details.
              </p>
           </div>
           
           <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50">
              <div className="flex items-center gap-3 mb-3">
                <Zap className="text-yellow-500" size={20} />
                <h4 className="font-bold text-slate-800 dark:text-slate-200">Dual Modes</h4>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Switch between <strong>Fast Mode</strong> for quick results or <strong>Pro Analysis</strong> for maximum detail and reasoning capabilities.
              </p>
           </div>

           <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50">
              <div className="flex items-center gap-3 mb-3">
                <TrendingUp className="text-purple-500" size={20} />
                <h4 className="font-bold text-slate-800 dark:text-slate-200">Trend Grounding</h4>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Real-time connection to Google Search (via Gemini) to find trending keywords related to your specific content.
              </p>
           </div>
        </div>
      </div>

      {/* Privacy Note */}
       <div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-500/20 rounded-xl p-6">
          <div className="flex items-start gap-4">
             <div className="bg-indigo-100 dark:bg-indigo-500/20 p-2 rounded-lg shrink-0">
                <ShieldCheck className="text-indigo-600 dark:text-indigo-400" size={24} />
             </div>
             <div>
                <h4 className="font-bold text-indigo-900 dark:text-indigo-300 mb-1">Privacy & Security</h4>
                <p className="text-sm text-indigo-700 dark:text-indigo-400/80">
                   StockMeta AI runs entirely in your browser. Your images are processed directly by the Gemini API and are not stored on our servers. Your API Key is saved locally in your browser's secure storage.
                </p>
             </div>
          </div>
       </div>

    </div>
  );
};