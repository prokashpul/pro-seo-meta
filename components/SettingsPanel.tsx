
import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Info, Settings, Type, AlignLeft, Hash } from 'lucide-react';
import { GenerationSettings } from '../types';

interface SettingsPanelProps {
  settings: GenerationSettings;
  onSettingsChange: (settings: GenerationSettings) => void;
}

export const SettingsPanel: React.FC<SettingsPanelProps> = ({ settings, onSettingsChange }) => {
  const [isOpen, setIsOpen] = useState(false);

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

  // Helper to safely update min/max ranges
  const handleRangeChange = (type: 'title' | 'desc' | 'kw', bound: 'min' | 'max', value: string) => {
      const val = parseInt(value) || 0;
      if (type === 'title') {
          if (bound === 'min') handleChange('titleWordCountMin', Math.min(val, settings.titleWordCountMax));
          else handleChange('titleWordCountMax', Math.max(val, settings.titleWordCountMin));
      } else if (type === 'desc') {
          if (bound === 'min') handleChange('descriptionWordCountMin', Math.min(val, settings.descriptionWordCountMax));
          else handleChange('descriptionWordCountMax', Math.max(val, settings.descriptionWordCountMin));
      } else if (type === 'kw') {
          if (bound === 'min') handleChange('keywordCountMin', Math.min(val, settings.keywordCountMax));
          else handleChange('keywordCountMax', Math.max(val, settings.keywordCountMin));
      }
  };

  return (
    <div className="w-full mb-6">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-full bg-orange-600 hover:bg-orange-500 text-white px-4 py-2 rounded-t-xl transition-colors font-semibold text-sm shadow-md"
      >
        <div className="flex items-center gap-2">
          <Settings size={16} />
          Metadata Customization & Settings
        </div>
        {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
      </button>

      {isOpen && (
        <div className="bg-slate-900 border border-slate-700 rounded-b-xl p-4 space-y-6 animate-in slide-in-from-top-2 shadow-xl">
          
          {/* --- COUNTS & LIMITS SECTION --- */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pb-4 border-b border-slate-800">
              
              {/* Title Words */}
              <div className="bg-slate-800/50 p-3 rounded-lg">
                  <div className="flex items-center gap-2 text-orange-400 text-xs font-bold uppercase tracking-wider mb-2">
                      <Type size={12} /> Title Words
                  </div>
                  <div className="flex items-center gap-2">
                      <div className="flex-1">
                          <label className="block text-[10px] text-slate-500 mb-1">Min (5-25)</label>
                          <input 
                              type="number" 
                              min="5" max="25"
                              value={settings.titleWordCountMin}
                              onChange={(e) => handleRangeChange('title', 'min', e.target.value)}
                              className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-white text-center focus:border-orange-500 outline-none"
                          />
                      </div>
                      <span className="text-slate-600 mt-4">-</span>
                      <div className="flex-1">
                          <label className="block text-[10px] text-slate-500 mb-1">Max (5-25)</label>
                          <input 
                              type="number" 
                              min="5" max="25"
                              value={settings.titleWordCountMax}
                              onChange={(e) => handleRangeChange('title', 'max', e.target.value)}
                              className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-white text-center focus:border-orange-500 outline-none"
                          />
                      </div>
                  </div>
              </div>

              {/* Description Words */}
              <div className="bg-slate-800/50 p-3 rounded-lg">
                  <div className="flex items-center gap-2 text-orange-400 text-xs font-bold uppercase tracking-wider mb-2">
                      <AlignLeft size={12} /> Description Words
                  </div>
                  <div className="flex items-center gap-2">
                      <div className="flex-1">
                          <label className="block text-[10px] text-slate-500 mb-1">Min (1-40)</label>
                          <input 
                              type="number" 
                              min="1" max="40"
                              value={settings.descriptionWordCountMin}
                              onChange={(e) => handleRangeChange('desc', 'min', e.target.value)}
                              className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-white text-center focus:border-orange-500 outline-none"
                          />
                      </div>
                      <span className="text-slate-600 mt-4">-</span>
                      <div className="flex-1">
                          <label className="block text-[10px] text-slate-500 mb-1">Max (1-40)</label>
                          <input 
                              type="number" 
                              min="1" max="40"
                              value={settings.descriptionWordCountMax}
                              onChange={(e) => handleRangeChange('desc', 'max', e.target.value)}
                              className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-white text-center focus:border-orange-500 outline-none"
                          />
                      </div>
                  </div>
              </div>

              {/* Keyword Count */}
              <div className="bg-slate-800/50 p-3 rounded-lg">
                  <div className="flex items-center gap-2 text-orange-400 text-xs font-bold uppercase tracking-wider mb-2">
                      <Hash size={12} /> Keyword Count
                  </div>
                  <div className="flex items-center gap-2">
                      <div className="flex-1">
                          <label className="block text-[10px] text-slate-500 mb-1">Min (1-50)</label>
                          <input 
                              type="number" 
                              min="1" max="50"
                              value={settings.keywordCountMin}
                              onChange={(e) => handleRangeChange('kw', 'min', e.target.value)}
                              className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-white text-center focus:border-orange-500 outline-none"
                          />
                      </div>
                      <span className="text-slate-600 mt-4">-</span>
                      <div className="flex-1">
                          <label className="block text-[10px] text-slate-500 mb-1">Max (1-50)</label>
                          <input 
                              type="number" 
                              min="1" max="50"
                              value={settings.keywordCountMax}
                              onChange={(e) => handleRangeChange('kw', 'max', e.target.value)}
                              className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-white text-center focus:border-orange-500 outline-none"
                          />
                      </div>
                  </div>
              </div>
          </div>

          {/* --- TOGGLES SECTION --- */}
          <div className="space-y-4">
            {/* SILHOUETTE */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-slate-300 text-sm font-medium">
                SILHOUETTE
                <div className="group relative">
                    <Info size={14} className="text-slate-500 cursor-help" />
                    <div className="absolute left-0 bottom-full mb-2 w-48 bg-black/90 text-white text-xs p-2 rounded hidden group-hover:block z-50">
                    Force detection of silhouette style metadata.
                    </div>
                </div>
                </div>
                <button 
                onClick={() => handleToggle('silhouette')}
                className={`w-10 h-5 rounded-full transition-colors relative ${settings.silhouette ? 'bg-orange-500' : 'bg-slate-700'}`}
                >
                <div className={`w-3 h-3 bg-white rounded-full absolute top-1 transition-all ${settings.silhouette ? 'left-6' : 'left-1'}`} />
                </button>
            </div>

            {/* CUSTOM PROMPT */}
            <div>
                <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 text-slate-300 text-sm font-medium">
                    CUSTOM PROMPT
                    <div className="group relative">
                    <Info size={14} className="text-slate-500 cursor-help" />
                    <div className="absolute left-0 bottom-full mb-2 w-48 bg-black/90 text-white text-xs p-2 rounded hidden group-hover:block z-50">
                        Add custom instructions to the AI.
                    </div>
                    </div>
                </div>
                <button 
                    onClick={() => handleToggle('customPromptEnabled')}
                    className={`w-10 h-5 rounded-full transition-colors relative ${settings.customPromptEnabled ? 'bg-orange-500' : 'bg-slate-700'}`}
                >
                    <div className={`w-3 h-3 bg-white rounded-full absolute top-1 transition-all ${settings.customPromptEnabled ? 'left-6' : 'left-1'}`} />
                </button>
                </div>
                {settings.customPromptEnabled && (
                <textarea 
                    value={settings.customPromptText}
                    onChange={(e) => handleChange('customPromptText', e.target.value)}
                    placeholder="e.g. Focus on the emotional aspect..."
                    className="w-full bg-slate-800 border border-slate-600 rounded p-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-orange-500"
                    rows={2}
                />
                )}
            </div>

            {/* White Background */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-slate-300 text-sm font-medium">
                White Background
                <div className="group relative">
                    <Info size={14} className="text-slate-500 cursor-help" />
                    <div className="absolute left-0 bottom-full mb-2 w-48 bg-black/90 text-white text-xs p-2 rounded hidden group-hover:block z-50">
                    Tag as 'Isolated on White Background'.
                    </div>
                </div>
                </div>
                <button 
                onClick={() => handleToggle('whiteBackground')}
                className={`w-10 h-5 rounded-full transition-colors relative ${settings.whiteBackground ? 'bg-orange-500' : 'bg-slate-700'}`}
                >
                <div className={`w-3 h-3 bg-white rounded-full absolute top-1 transition-all ${settings.whiteBackground ? 'left-6' : 'left-1'}`} />
                </button>
            </div>

            {/* Transparent Background */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-slate-300 text-sm font-medium">
                Transparent Background
                <div className="group relative">
                    <Info size={14} className="text-slate-500 cursor-help" />
                    <div className="absolute left-0 bottom-full mb-2 w-48 bg-black/90 text-white text-xs p-2 rounded hidden group-hover:block z-50">
                    Force 'Isolated on Transparent Background'.
                    </div>
                </div>
                </div>
                <button 
                onClick={() => handleToggle('transparentBackground')}
                className={`w-10 h-5 rounded-full transition-colors relative ${settings.transparentBackground ? 'bg-orange-500' : 'bg-slate-700'}`}
                >
                <div className={`w-3 h-3 bg-white rounded-full absolute top-1 transition-all ${settings.transparentBackground ? 'left-6' : 'left-1'}`} />
                </button>
            </div>

            {/* PROHIBITED WORDS */}
            <div>
                <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 text-slate-300 text-sm font-medium">
                    PROHIBITED WORDS
                    <div className="group relative">
                    <Info size={14} className="text-slate-500 cursor-help" />
                    <div className="absolute left-0 bottom-full mb-2 w-48 bg-black/90 text-white text-xs p-2 rounded hidden group-hover:block z-50">
                        Exclude these words from metadata.
                    </div>
                    </div>
                </div>
                <button 
                    onClick={() => handleToggle('prohibitedWordsEnabled')}
                    className={`w-10 h-5 rounded-full transition-colors relative ${settings.prohibitedWordsEnabled ? 'bg-orange-500' : 'bg-slate-700'}`}
                >
                    <div className={`w-3 h-3 bg-white rounded-full absolute top-1 transition-all ${settings.prohibitedWordsEnabled ? 'left-6' : 'left-1'}`} />
                </button>
                </div>
                {settings.prohibitedWordsEnabled && (
                <textarea 
                    value={settings.prohibitedWordsText}
                    onChange={(e) => handleChange('prohibitedWordsText', e.target.value)}
                    placeholder="e.g. trademark, brand, logo..."
                    className="w-full bg-slate-800 border border-slate-600 rounded p-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-orange-500"
                    rows={2}
                />
                )}
            </div>

            {/* SINGLE WORD KEYWORDS */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-slate-300 text-sm font-medium">
                SINGLE WORD KEYWORDS
                <div className="group relative">
                    <Info size={14} className="text-slate-500 cursor-help" />
                    <div className="absolute left-0 bottom-full mb-2 w-48 bg-black/90 text-white text-xs p-2 rounded hidden group-hover:block z-50">
                    Restrict all keywords to single words (no phrases).
                    </div>
                </div>
                </div>
                <button 
                onClick={() => handleToggle('singleWordKeywords')}
                className={`w-10 h-5 rounded-full transition-colors relative ${settings.singleWordKeywords ? 'bg-orange-500' : 'bg-slate-700'}`}
                >
                <div className={`w-3 h-3 bg-white rounded-full absolute top-1 transition-all ${settings.singleWordKeywords ? 'left-6' : 'left-1'}`} />
                </button>
            </div>
          </div>

        </div>
      )}
    </div>
  );
};
