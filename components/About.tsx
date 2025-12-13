import React from 'react';
import { UploadCloud, Sparkles, Edit3, Download, Zap, Aperture, TrendingUp, ShieldCheck, ArrowLeft, Layers, Calendar, Image as ImageIcon, FileType } from 'lucide-react';

interface AboutProps {
  onBack?: () => void;
}

export const About: React.FC<AboutProps> = ({ onBack }) => {
  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 relative pb-12">
      {onBack && (
        <button 
          onClick={onBack}
          className="mb-8 inline-flex items-center gap-2 text-base text-slate-400 hover:text-indigo-500 transition-colors font-medium"
        >
          <ArrowLeft size={18} /> Back to Metadata
        </button>
      )}

      <div className="text-center mb-16">
        <div className="inline-flex p-4 rounded-3xl bg-gradient-to-br from-indigo-500/10 to-purple-500/10 mb-6">
            <Layers className="w-12 h-12 text-indigo-600 dark:text-indigo-400" />
        </div>
        <h2 className="text-4xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 to-purple-500">
          About StockMeta AI
        </h2>
        <p className="max-w-3xl mx-auto text-slate-600 dark:text-slate-400 text-xl leading-relaxed">
          The ultimate AI-powered workflow tool for stock photography & vector contributors. 
          Optimize metadata, generate prompts, and plan your shoots—all in one place.
        </p>
      </div>

      {/* Main Workflow Section */}
      <div className="mb-20">
        <h3 className="text-2xl font-bold mb-10 text-slate-900 dark:text-white flex items-center gap-3">
          <span className="bg-indigo-500 text-white w-8 h-8 rounded-full flex items-center justify-center text-sm">1</span>
          The Workflow
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="p-8 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
            <div className="w-14 h-14 rounded-xl bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-5">
              <UploadCloud size={28} />
            </div>
            <h4 className="text-xl font-bold text-slate-900 dark:text-white mb-3">Smart Upload & Vectors</h4>
            <p className="text-base text-slate-500 dark:text-slate-400 leading-relaxed">
              Upload <strong>JPG, PNG, WEBP</strong> images or <strong>EPS/AI</strong> vector files. 
              The system intelligently pairs vector files with their matching preview images (e.g., `flower.eps` + `flower.jpg`) to ensure your metadata applies to both assets.
            </p>
          </div>

          <div className="p-8 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
            <div className="w-14 h-14 rounded-xl bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 flex items-center justify-center mb-5">
              <Sparkles size={28} />
            </div>
            <h4 className="text-xl font-bold text-slate-900 dark:text-white mb-3">Gemini Vision Analysis</h4>
            <p className="text-base text-slate-500 dark:text-slate-400 leading-relaxed">
              We use Google's latest <strong>Gemini 2.5 Flash</strong> and <strong>Flash-Lite</strong> models to "see" your images. 
              It generates:
              <ul className="list-disc list-inside mt-2 space-y-1 opacity-80 pl-2">
                  <li>SEO Titles (55-150 chars)</li>
                  <li>Agency-Optimized Descriptions (70-200 chars)</li>
                  <li>35-49 Relevancy-ranked Keywords</li>
              </ul>
            </p>
          </div>

          <div className="p-8 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
            <div className="w-14 h-14 rounded-xl bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-5">
              <Edit3 size={28} />
            </div>
            <h4 className="text-xl font-bold text-slate-900 dark:text-white mb-3">Advanced Bulk Editing</h4>
            <p className="text-base text-slate-500 dark:text-slate-400 leading-relaxed">
              Manage large batches with ease.
              <ul className="list-disc list-inside mt-2 space-y-1 opacity-80 pl-2">
                  <li><strong>Keywords:</strong> Add, Remove, or Replace tags across all selected files.</li>
                  <li><strong>Titles:</strong> Find & Replace text, Append suffix, or Prepend prefix for series consistency.</li>
              </ul>
            </p>
          </div>

          <div className="p-8 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
            <div className="w-14 h-14 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-5">
              <Download size={28} />
            </div>
            <h4 className="text-xl font-bold text-slate-900 dark:text-white mb-3">ZIP Export</h4>
            <p className="text-base text-slate-500 dark:text-slate-400 leading-relaxed">
              One-click download of a <strong>ZIP file</strong> containing:
              <ul className="list-disc list-inside mt-2 space-y-1 opacity-80 pl-2">
                  <li>Your images renamed to match their SEO Titles.</li>
                  <li>Your vector files (EPS/AI) renamed to match.</li>
                  <li>A <strong>metadata.csv</strong> file formatted for Adobe Stock, Shutterstock, and Getty Images.</li>
              </ul>
            </p>
          </div>
        </div>
      </div>

      {/* Tools Ecosystem */}
      <div className="mb-20">
        <h3 className="text-2xl font-bold mb-10 text-slate-900 dark:text-white flex items-center gap-3">
          <span className="bg-indigo-500 text-white w-8 h-8 rounded-full flex items-center justify-center text-sm">2</span>
          Tools Ecosystem
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
           <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50">
              <div className="flex items-center gap-4 mb-4">
                <ImageIcon className="text-pink-500" size={24} />
                <h4 className="text-lg font-bold text-slate-800 dark:text-slate-200">Reverse Prompts</h4>
              </div>
              <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                Upload any image to generate a detailed AI text prompt. Use this to recreate styles in Midjourney or Stable Diffusion.
              </p>
           </div>
           
           <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50">
              <div className="flex items-center gap-4 mb-4">
                <Calendar className="text-blue-500" size={24} />
                <h4 className="text-lg font-bold text-slate-800 dark:text-slate-200">Event Calendar</h4>
              </div>
              <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                Plan your shoots with our Global and Indian event calendar. Track submission deadlines to ensure your content is online before buyers search for it.
              </p>
           </div>

           <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50">
              <div className="flex items-center gap-4 mb-4">
                <TrendingUp className="text-purple-500" size={24} />
                <h4 className="text-lg font-bold text-slate-800 dark:text-slate-200">Trend Grounding</h4>
              </div>
              <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                Real-time connection to Google Search finding trending keywords related to your specific content.
              </p>
           </div>
        </div>
      </div>

      {/* Privacy Note */}
       <div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-500/20 rounded-2xl p-8">
          <div className="flex items-start gap-6">
             <div className="bg-indigo-100 dark:bg-indigo-500/20 p-3 rounded-xl shrink-0">
                <ShieldCheck className="text-indigo-600 dark:text-indigo-400" size={32} />
             </div>
             <div>
                <h4 className="text-lg font-bold text-indigo-900 dark:text-indigo-300 mb-2">Privacy & Local Caching</h4>
                <p className="text-base text-indigo-700 dark:text-indigo-400/80 leading-relaxed">
                   StockMeta AI runs entirely in your browser ("Client-Side"). 
                   <br/><br/>
                   Your images are processed directly by the Gemini API and are <strong>never stored on our servers</strong>. 
                   Your API Key and preferences (Dark Mode, Advanced Settings) are stored securely in your browser's <strong>Local Storage</strong> (Cache) for convenience, ensuring you don't need to re-enter them every time.
                </p>
             </div>
          </div>
       </div>

    </div>
  );
};