import React, { useState } from 'react';
import { ChevronDown, Sliders, Type, AlignLeft, Hash, Check, Settings2, Sparkles, AlertTriangle, Zap, Cpu, Eye } from 'lucide-react';
import { GenerationSettings, ModelMode } from '../types';

interface SettingsPanelProps {
  settings: GenerationSettings;
  onSettingsChange: (settings: GenerationSettings) => void;
  modelMode: ModelMode;
  onModelModeChange: (mode: ModelMode) => void;
}

export const SettingsPanel: React.FC<SettingsPanelProps> = ({ settings, onSettingsChange, modelMode, onModelModeChange }) => {
  const [isOpen, setIsOpen] = useState(true);

  const handleToggle = (field: keyof GenerationSettings) => {
    onSettingsChange({
      ...settings,
      [field]: !settings[field as keyof typeof settings]
    });
  };

  const handleChange = (field: keyof GenerationSettings, value: string | number) => {
    onSettingsChange({
      ...settings,
      [field]: value
    });
  };

  const handleRangeChange = (type: 'title' | 'desc' | 'kw', bound: 'min' | 'max', value: string) => {
      let val = parseInt(value) || 0;
      
      if (type === 'title') {
          if (val < 0) val = 0;
          if (bound === 'min') handleChange('titleWordCountMin', Math.min(val, settings.titleWordCountMax));
          else handleChange('titleWordCountMax', Math.max(val, settings.titleWordCountMin));
      } else if (type === 'desc') {
          if (val < 0) val = 0;
          if (bound === 'min') handleChange('descriptionWordCountMin', Math.min(val, settings.descriptionWordCountMax));
          else handleChange('descriptionWordCountMax', Math.max(val, settings.descriptionWordCountMin));
      } else if (type === 'kw') {
          if (val < 0) val = 0;
          if (bound === 'min') handleChange('keywordCountMin', Math.min(val, settings.keywordCountMax));
          else handleChange('keywordCountMax', Math.max(val, settings.keywordCountMin));
      }
  };

  return (
    <div className="w-full bg-white/60 backdrop-blur-md dark:bg-[#0f1218] border border-slate-200 dark:border-gray-800 rounded-2xl shadow-sm overflow-hidden transition-all hover:shadow-md hover:shadow-slate-200/50 dark:hover:shadow-none">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-6 text-left hover:bg-white/50 dark:hover:bg-white/5 transition-colors"
      >
        <div className="flex items-center gap-4">
          <div className="p-2.5 bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-gray-300 rounded-lg">
             <Sliders size={20} />
          </div>
          <div>
              <h3 className="font-bold text-slate-900 dark:text-gray-100 text-base">Configuration</h3>
              <p className="text-sm text-slate-500">Global logic settings</p>
          </div>
        </div>
        <div className={`transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}>
           <ChevronDown size={18} className="text-slate-400" />
        </div>
      </button>

      {isOpen && (
        <div className="p-6 pt-2 space-y-8 border-t border-slate-100 dark:border-gray-800">
          
          {/* Model Selection */}
          <div>
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">
              AI Processing Mode
            </h4>
            <div className="grid grid-cols-1 gap-2">
                <button
                    onClick={() => onModelModeChange(ModelMode.FAST)}
                    className={`flex items-center justify-between p-3 rounded-lg border text-sm font-medium transition-all ${
                        modelMode === ModelMode.FAST 
                        ? 'bg-emerald-50 dark:bg-emerald-900/10 border-emerald-500/50 text-emerald-700 dark:text-emerald-400' 
                        : 'bg-white/50 dark:bg-transparent border-slate-200 dark:border-gray-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-gray-800'
                    }`}
                >
                    <div className="flex items-center gap-3">
                        <Zap size={16} className={modelMode === ModelMode.FAST ? "text-emerald-500" : "text-slate-400"} />
                        <div className="text-left">
                            <span className="block font-bold">Gemini Flash Lite</span>
                            <span className="text-xs opacity-80">Speed & efficiency</span>
                        </div>
                    </div>
                    {modelMode === ModelMode.FAST && <Check size={16} />}
                </button>

                <button
                    onClick={() => onModelModeChange(ModelMode.QUALITY)}
                    className={`flex items-center justify-between p-3 rounded-lg border text-sm font-medium transition-all ${
                        modelMode === ModelMode.QUALITY 
                        ? 'bg-indigo-50 dark:bg-indigo-900/10 border-indigo-500/50 text-indigo-700 dark:text-indigo-400' 
                        : 'bg-white/50 dark:bg-transparent border-slate-200 dark:border-gray-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-gray-800'
                    }`}
                >
                    <div className="flex items-center gap-3">
                        <Sparkles size={16} className={modelMode === ModelMode.QUALITY ? "text-indigo-500" : "text-slate-400"} />
                        <div className="text-left">
                            <span className="block font-bold">Gemini Flash 2.5</span>
                            <span className="text-xs opacity-80">Balanced & accurate</span>
                        </div>
                    </div>
                    {modelMode === ModelMode.QUALITY && <Check size={16} />}
                </button>

                <button
                    onClick={() => onModelModeChange(ModelMode.GROQ_VISION)}
                    className={`flex items-center justify-between p-3 rounded-lg border text-sm font-medium transition-all ${
                        modelMode === ModelMode.GROQ_VISION 
                        ? 'bg-emerald-50 dark:bg-emerald-900/10 border-emerald-500/50 text-emerald-700 dark:text-emerald-400' 
                        : 'bg-white/50 dark:bg-transparent border-slate-200 dark:border-gray-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-gray-800'
                    }`}
                >
                    <div className="flex items-center gap-3">
                        <Cpu size={16} className={modelMode === ModelMode.GROQ_VISION ? "text-emerald-500" : "text-slate-400"} />
                        <div className="text-left">
                            <span className="block font-bold">Groq Llama 4 Scout</span>
                            <span className="text-xs opacity-80">Ultra-fast Multimodal</span>
                        </div>
                    </div>
                    {modelMode === ModelMode.GROQ_VISION && <Check size={16} />}
                </button>

                <button
                    onClick={() => onModelModeChange(ModelMode.MISTRAL_PIXTRAL)}
                    className={`flex items-center justify-between p-3 rounded-lg border text-sm font-medium transition-all ${
                        modelMode === ModelMode.MISTRAL_PIXTRAL 
                        ? 'bg-orange-50 dark:bg-orange-900/10 border-orange-500/50 text-orange-700 dark:text-orange-400' 
                        : 'bg-white/50 dark:bg-transparent border-slate-200 dark:border-gray-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-gray-800'
                    }`}
                >
                    <div className="flex items-center gap-3">
                        <Eye size={16} className={modelMode === ModelMode.MISTRAL_PIXTRAL ? "text-orange-500" : "text-slate-400"} />
                        <div className="text-left">
                            <span className="block font-bold">Mistral Pixtral 12B</span>
                            <span className="text-xs opacity-80">Vision Expert</span>
                        </div>
                    </div>
                    {modelMode === ModelMode.MISTRAL_PIXTRAL && <Check size={16} />}
                </button>
            </div>
          </div>

          <div className="h-px bg-slate-100 dark:bg-gray-800" />

          {/* Output Limits */}
          <div className="space-y-4">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">
                Target Limits
              </h4>
              
              <div className="space-y-4">
                  {/* Title */}
                  <div className="flex items-center justify-between p-4 rounded-lg border border-slate-100 dark:border-gray-800 hover:border-indigo-200 dark:hover:border-indigo-900/50 transition-colors bg-white/50 dark:bg-transparent">
                      <div className="flex items-center gap-3 text-slate-700 dark:text-gray-300 text-sm font-bold">
                          <Type size={16} className="text-slate-400" /> Title Words
                      </div>
                      <div className="flex items-center gap-2">
                          <input type="number" min="5" max="25" value={settings.titleWordCountMin} onChange={(e) => handleRangeChange('title', 'min', e.target.value)} className="w-12 text-center bg-slate-50 dark:bg-gray-800 rounded py-1.5 text-sm font-medium text-slate-800 dark:text-gray-200 focus:ring-1 focus:ring-indigo-500 outline-none" />
                          <span className="text-slate-400 text-xs">-</span>
                          <input type="number" min="5" max="25" value={settings.titleWordCountMax} onChange={(e) => handleRangeChange('title', 'max', e.target.value)} className="w-12 text-center bg-slate-50 dark:bg-gray-800 rounded py-1.5 text-sm font-medium text-slate-800 dark:text-gray-200 focus:ring-1 focus:ring-indigo-500 outline-none" />
                      </div>
                  </div>

                  {/* Desc */}
                  <div className="flex items-center justify-between p-4 rounded-lg border border-slate-100 dark:border-gray-800 hover:border-blue-200 dark:hover:border-blue-900/50 transition-colors bg-white/50 dark:bg-transparent">
                      <div className="flex items-center gap-3 text-slate-700 dark:text-gray-300 text-sm font-bold">
                          <AlignLeft size={16} className="text-slate-400" /> Desc
                      </div>
                      <div className="flex items-center gap-2">
                          <input type="number" min="10" max="100" value={settings.descriptionWordCountMin} onChange={(e) => handleRangeChange('desc', 'min', e.target.value)} className="w-12 text-center bg-slate-50 dark:bg-gray-800 rounded py-1.5 text-sm font-medium text-slate-800 dark:text-gray-200 focus:ring-1 focus:ring-blue-500 outline-none" />
                          <span className="text-slate-400 text-xs">-</span>
                          <input type="number" min="10" max="100" value={settings.descriptionWordCountMax} onChange={(e) => handleRangeChange('desc', 'max', e.target.value)} className="w-12 text-center bg-slate-50 dark:bg-gray-800 rounded py-1.5 text-sm font-medium text-slate-800 dark:text-gray-200 focus:ring-1 focus:ring-blue-500 outline-none" />
                      </div>
                  </div>

                  {/* Keywords */}
                  <div className="flex items-center justify-between p-4 rounded-lg border border-slate-100 dark:border-gray-800 hover:border-emerald-200 dark:hover:border-emerald-900/50 transition-colors bg-white/50 dark:bg-transparent">
                      <div className="flex items-center gap-3 text-slate-700 dark:text-gray-300 text-sm font-bold">
                          <Hash size={16} className="text-slate-400" /> Keyword Count
                      </div>
                      <div className="flex items-center gap-2">
                          <input type="number" min="15" max="50" value={settings.keywordCountMin} onChange={(e) => handleRangeChange('kw', 'min', e.target.value)} className="w-12 text-center bg-slate-50 dark:bg-gray-800 rounded py-1.5 text-sm font-medium text-slate-800 dark:text-gray-200 focus:ring-1 focus:ring-emerald-500 outline-none" />
                          <span className="text-slate-400 text-xs">-</span>
                          <input type="number" min="15" max="50" value={settings.keywordCountMax} onChange={(e) => handleRangeChange('kw', 'max', e.target.value)} className="w-12 text-center bg-slate-50 dark:bg-gray-800 rounded py-1.5 text-sm font-medium text-slate-800 dark:text-gray-200 focus:ring-1 focus:ring-emerald-500 outline-none" />
                      </div>
                  </div>
              </div>
          </div>

          <div className="h-px bg-slate-100 dark:bg-gray-800" />

          {/* Toggles */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">
               Image Logic
            </h4>

            {[
                { key: 'silhouette', label: 'Silhouette Mode', desc: 'Auto-detect shadow subjects' },
                { key: 'whiteBackground', label: 'Isolated White', desc: 'Force isolated bg tagging' },
                { key: 'transparentBackground', label: 'Isolated Alpha', desc: 'Detect transparency' },
                { key: 'singleWordKeywords', label: 'Single Words Only', desc: 'Strip keyword phrases' }
            ].map((item) => (
                <div key={item.key} className="flex items-center justify-between group cursor-pointer p-3 -mx-3 hover:bg-slate-50 dark:hover:bg-white/5 rounded-lg transition-colors" onClick={() => handleToggle(item.key as keyof GenerationSettings)}>
                    <div>
                        <p className="text-sm font-bold text-slate-700 dark:text-gray-300">{item.label}</p>
                        <p className="text-xs text-slate-400">{item.desc}</p>
                    </div>
                    <div className={`w-11 h-6 rounded-full transition-colors relative ${
                            settings[item.key as keyof GenerationSettings] 
                            ? 'bg-indigo-600' 
                            : 'bg-slate-200 dark:bg-gray-700'
                        }`}
                    >
                        <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-all duration-200 ${
                            settings[item.key as keyof GenerationSettings] ? 'left-6' : 'left-1'
                        }`} />
                    </div>
                </div>
            ))}
          </div>

          <div className="h-px bg-slate-100 dark:bg-gray-800" />
          
          {/* Advanced */}
          <div className="space-y-6">
               {/* Custom Prompt */}
               <div>
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-sm font-bold text-slate-700 dark:text-gray-300 flex items-center gap-2">
                            <Settings2 size={16} /> Custom Prompt
                        </span>
                        <div 
                            onClick={() => handleToggle('customPromptEnabled')}
                            className={`w-10 h-5 rounded-full cursor-pointer transition-colors relative ${settings.customPromptEnabled ? 'bg-indigo-600' : 'bg-slate-200 dark:bg-gray-700'}`}
                        >
                            <div className={`w-3.5 h-3.5 bg-white rounded-full absolute top-0.5 transition-all ${settings.customPromptEnabled ? 'left-5.5' : 'left-0.5'}`} />
                        </div>
                    </div>
                    {settings.customPromptEnabled && (
                        <textarea
                            value={settings.customPromptText}
                            onChange={(e) => handleChange('customPromptText', e.target.value)}
                            placeholder="Extra instructions for AI..."
                            className="w-full bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-lg p-3 text-sm text-slate-700 dark:text-gray-300 focus:ring-1 focus:ring-indigo-500 outline-none resize-none h-24 animate-in fade-in"
                        />
                    )}
               </div>

               {/* Prohibited Words */}
               <div>
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-sm font-bold text-slate-700 dark:text-gray-300 flex items-center gap-2">
                            <AlertTriangle size={16} /> Restricted Words
                        </span>
                        <div 
                            onClick={() => handleToggle('prohibitedWordsEnabled')}
                            className={`w-10 h-5 rounded-full cursor-pointer transition-colors relative ${settings.prohibitedWordsEnabled ? 'bg-red-500' : 'bg-slate-200 dark:bg-gray-700'}`}
                        >
                            <div className={`w-3.5 h-3.5 bg-white rounded-full absolute top-0.5 transition-all ${settings.prohibitedWordsEnabled ? 'left-5.5' : 'left-0.5'}`} />
                        </div>
                    </div>
                    {settings.prohibitedWordsEnabled && (
                        <textarea
                            value={settings.prohibitedWordsText}
                            onChange={(e) => handleChange('prohibitedWordsText', e.target.value)}
                            placeholder="Words to never use..."
                            className="w-full bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-500/20 rounded-lg p-3 text-sm text-slate-700 dark:text-gray-300 focus:ring-1 focus:ring-red-500 outline-none resize-none h-24 animate-in fade-in placeholder:text-red-300"
                        />
                    )}
               </div>
          </div>

        </div>
      )}
    </div>
  );
};