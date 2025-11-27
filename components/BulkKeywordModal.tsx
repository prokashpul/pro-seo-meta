import React, { useState } from 'react';
import { X, Plus, Minus, RefreshCcw, Trash2, Type, ArrowRight, ArrowLeft, Eraser, Replace } from 'lucide-react';

export type BulkActionType = 'ADD' | 'REMOVE' | 'REPLACE_ALL' | 'CLEAR_ALL' | 'APPEND' | 'PREPEND' | 'REPLACE_TEXT';
export type BulkTargetField = 'keywords' | 'title';

interface BulkKeywordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (action: BulkActionType, value: any, field: BulkTargetField) => void;
  selectedCount: number;
}

export const BulkKeywordModal: React.FC<BulkKeywordModalProps> = ({ isOpen, onClose, onApply, selectedCount }) => {
  const [field, setField] = useState<BulkTargetField>('keywords');
  const [action, setAction] = useState<BulkActionType>('ADD');
  const [inputValue, setInputValue] = useState('');
  
  // Specific state for Find & Replace
  const [findValue, setFindValue] = useState('');
  const [replaceValue, setReplaceValue] = useState('');

  if (!isOpen) return null;

  const handleFieldChange = (newField: BulkTargetField) => {
    setField(newField);
    setInputValue('');
    setFindValue('');
    setReplaceValue('');
    // Set default reasonable action for the field
    if (newField === 'keywords') setAction('ADD');
    else setAction('REPLACE_ALL');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (field === 'keywords') {
        if (action === 'CLEAR_ALL') {
            onApply(action, [], field);
            onClose();
            return;
        }

        const keywords = inputValue.split(',').map(k => k.trim()).filter(k => k.length > 0);
        if (action === 'REPLACE_ALL' || keywords.length > 0) { 
            onApply(action, keywords, field);
            setInputValue('');
            onClose();
        }
    } else {
        // Title Actions
        if (action === 'REPLACE_TEXT') {
            onApply(action, { find: findValue, replace: replaceValue }, field);
        } else {
            onApply(action, inputValue.trim(), field);
        }
        setInputValue('');
        setFindValue('');
        setReplaceValue('');
        onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">Bulk Edit</h3>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-white">
              <X size={20} />
            </button>
          </div>

          <p className="text-slate-500 dark:text-slate-400 mb-6 text-sm">
            Applying changes to <span className="text-indigo-600 dark:text-indigo-400 font-semibold">{selectedCount}</span> selected items.
          </p>
          
          {/* Field Tabs */}
          <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-lg mb-6">
            <button
                type="button"
                onClick={() => handleFieldChange('keywords')}
                className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${
                    field === 'keywords' 
                    ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm' 
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
                }`}
            >
                Keywords
            </button>
            <button
                type="button"
                onClick={() => handleFieldChange('title')}
                className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${
                    field === 'title' 
                    ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm' 
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
                }`}
            >
                Title
            </button>
          </div>

          <div className="space-y-4 mb-6">
            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-2 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg sm:flex sm:flex-wrap">
              {field === 'keywords' ? (
                <>
                    <button
                        type="button"
                        onClick={() => setAction('ADD')}
                        className={`py-2 px-3 rounded-md text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
                        action === 'ADD' ? 'bg-indigo-600 text-white shadow' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                        } flex-1`}
                    >
                        <Plus size={14} /> Add
                    </button>
                    <button
                        type="button"
                        onClick={() => setAction('REMOVE')}
                        className={`py-2 px-3 rounded-md text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
                        action === 'REMOVE' ? 'bg-amber-600 text-white shadow' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                        } flex-1`}
                    >
                        <Minus size={14} /> Remove
                    </button>
                    <button
                        type="button"
                        onClick={() => setAction('REPLACE_ALL')}
                        className={`py-2 px-3 rounded-md text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
                        action === 'REPLACE_ALL' ? 'bg-emerald-600 text-white shadow' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                        } flex-1`}
                    >
                        <RefreshCcw size={14} /> Set
                    </button>
                    <button
                        type="button"
                        onClick={() => setAction('CLEAR_ALL')}
                        className={`py-2 px-3 rounded-md text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
                        action === 'CLEAR_ALL' ? 'bg-red-600 text-white shadow' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                        } flex-1`}
                    >
                        <Trash2 size={14} /> Clear
                    </button>
                </>
              ) : (
                <>
                    <button
                        type="button"
                        onClick={() => setAction('REPLACE_ALL')}
                        className={`py-2 px-3 rounded-md text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
                        action === 'REPLACE_ALL' ? 'bg-emerald-600 text-white shadow' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                        } flex-1`}
                        title="Set Exact Title"
                    >
                        <Type size={14} /> Set Exact
                    </button>
                    <button
                        type="button"
                        onClick={() => setAction('REPLACE_TEXT')}
                        className={`py-2 px-3 rounded-md text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
                        action === 'REPLACE_TEXT' ? 'bg-blue-600 text-white shadow' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                        } flex-1`}
                        title="Find and Replace"
                    >
                        <Replace size={14} /> Replace
                    </button>
                    <button
                        type="button"
                        onClick={() => setAction('APPEND')}
                        className={`py-2 px-3 rounded-md text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
                        action === 'APPEND' ? 'bg-indigo-600 text-white shadow' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                        } flex-1`}
                        title="Add to end"
                    >
                        <ArrowRight size={14} /> Append
                    </button>
                    <button
                        type="button"
                        onClick={() => setAction('PREPEND')}
                        className={`py-2 px-3 rounded-md text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
                        action === 'PREPEND' ? 'bg-purple-600 text-white shadow' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                        } flex-1`}
                        title="Add to start"
                    >
                        <ArrowLeft size={14} /> Prepend
                    </button>
                    <button
                        type="button"
                        onClick={() => setAction('REMOVE')}
                        className={`py-2 px-3 rounded-md text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
                        action === 'REMOVE' ? 'bg-amber-600 text-white shadow' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                        } flex-1`}
                        title="Remove specific text"
                    >
                        <Eraser size={14} /> Remove
                    </button>
                </>
              )}
            </div>

            {action === 'CLEAR_ALL' && field === 'keywords' ? (
               <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-6 text-center animate-in fade-in">
                 <Trash2 size={32} className="mx-auto text-red-500 dark:text-red-400 mb-3" />
                 <p className="text-red-600 dark:text-red-200 text-sm font-medium">
                   Are you sure? This will remove all keywords from the selected images.
                 </p>
               </div>
            ) : action === 'REPLACE_TEXT' && field === 'title' ? (
                <div className="space-y-3 animate-in fade-in">
                     <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider mb-2 text-slate-500 dark:text-slate-400">
                          Find Word/Phrase
                        </label>
                        <input
                            value={findValue}
                            onChange={(e) => setFindValue(e.target.value)}
                            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-slate-200 text-sm focus:ring-1 focus:ring-indigo-500 focus:outline-none placeholder-slate-400 dark:placeholder-slate-500"
                            placeholder="Word to find..."
                        />
                     </div>
                     <div className="flex justify-center">
                         <ArrowRight className="text-slate-400 rotate-90" size={16} />
                     </div>
                     <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider mb-2 text-slate-500 dark:text-slate-400">
                          Replace With
                        </label>
                        <input
                            value={replaceValue}
                            onChange={(e) => setReplaceValue(e.target.value)}
                            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-slate-200 text-sm focus:ring-1 focus:ring-indigo-500 focus:outline-none placeholder-slate-400 dark:placeholder-slate-500"
                            placeholder="New word..."
                        />
                     </div>
                </div>
            ) : (
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider mb-2 text-slate-500 dark:text-slate-400">
                  {field === 'keywords' ? 'Keywords (Comma Separated)' : 'Title Text'}
                </label>
                {field === 'keywords' ? (
                    <textarea
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-slate-200 text-sm focus:ring-1 focus:ring-indigo-500 focus:outline-none resize-none h-32 placeholder-slate-400 dark:placeholder-slate-500"
                    placeholder={
                        action === 'REMOVE' 
                        ? "Enter keywords to remove from selected items..." 
                        : action === 'REPLACE_ALL' 
                            ? "Overwrite keywords for all selected items..." 
                            : "Enter keywords to add..."
                    }
                    />
                ) : (
                    <textarea
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-slate-200 text-sm focus:ring-1 focus:ring-indigo-500 focus:outline-none resize-none h-24 placeholder-slate-400 dark:placeholder-slate-500"
                    placeholder={
                         action === 'REPLACE_ALL' 
                            ? "Set this title for all selected items..." 
                            : action === 'APPEND'
                                ? "Add this text to the end of all titles..."
                                : action === 'PREPEND'
                                    ? "Add this text to the start of all titles..."
                                    : "Enter text to remove from titles (e.g. 'Vector')..."
                    }
                    />
                )}
              </div>
            )}
          </div>

          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-medium text-sm transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              className={`flex-1 py-2.5 rounded-lg text-white font-medium text-sm transition-colors ${
                action === 'CLEAR_ALL' || (field === 'title' && action === 'REMOVE')
                  ? 'bg-amber-600 hover:bg-amber-500' 
                  : 'bg-indigo-600 hover:bg-indigo-500'
              }`}
            >
              {action === 'CLEAR_ALL' ? 'Clear Keywords' : action === 'REMOVE' && field === 'title' ? 'Remove Text' : 'Apply Changes'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};