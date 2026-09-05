'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Search, X, Loader2 } from 'lucide-react';

export interface SearchSuggestion { label: string; value: string; description?: string; }
export interface SearchInputProps {
  value: string; onChange: (value: string) => void; placeholder?: string;
  onSearch?: (value: string) => void; suggestions?: SearchSuggestion[];
  loading?: boolean; className?: string; debounceMs?: number;
}

export function SearchInput({
  value, onChange, placeholder = 'Search...', onSearch,
  suggestions = [], loading = false, className = '', debounceMs = 300,
}: SearchInputProps) {
  const [localValue, setLocalValue] = useState(value);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => { setLocalValue(value); }, [value]);

  const handleChange = useCallback((val: string) => {
    setLocalValue(val); setSelectedIndex(-1);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => onChange(val), debounceMs);
  }, [onChange, debounceMs]);

  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current); }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setShowSuggestions(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleClear = () => { setLocalValue(''); onChange(''); setShowSuggestions(false); inputRef.current?.focus(); };
  const handleSelectSuggestion = (s: SearchSuggestion) => { setLocalValue(s.label); onChange(s.value); onSearch?.(s.value); setShowSuggestions(false); };
  const handleKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'Enter': e.preventDefault(); if (selectedIndex >= 0 && suggestions[selectedIndex]) handleSelectSuggestion(suggestions[selectedIndex]); else onSearch?.(localValue); setShowSuggestions(false); break;
      case 'Escape': if (showSuggestions) setShowSuggestions(false); else handleClear(); break;
      case 'ArrowDown': e.preventDefault(); setSelectedIndex(p => p < suggestions.length - 1 ? p + 1 : 0); break;
      case 'ArrowUp': e.preventDefault(); setSelectedIndex(p => p > 0 ? p - 1 : suggestions.length - 1); break;
    }
  };

  const hasSuggestions = suggestions.length > 0 && showSuggestions && localValue.length > 0;

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <div className="relative">
        <div className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none">
          {loading ? <Loader2 className="w-4 h-4 text-slate-500 animate-spin" /> : <Search className="w-4 h-4 text-slate-500" />}
        </div>
        <input ref={inputRef} type="text" value={localValue} onChange={e => handleChange(e.target.value)}
          onFocus={() => setShowSuggestions(true)} onKeyDown={handleKeyDown} placeholder={placeholder}
          className="w-full pl-10 pr-10 py-2.5 text-base sm:text-sm bg-white border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-400 transition-all"
          autoComplete="off" />
        {localValue && (
          <button onClick={handleClear} className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 rounded-md text-slate-500 hover:text-gray-600 hover:bg-gray-100 transition-all" aria-label="Clear search">
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
      {hasSuggestions && (
        <div className="absolute z-50 top-full left-0 right-0 mt-1.5 py-1.5 rounded-xl bg-white border border-gray-100 shadow-lg overflow-hidden max-h-64 overflow-y-auto">
          {suggestions.map((suggestion, index) => (
            <button key={suggestion.value} onClick={() => handleSelectSuggestion(suggestion)} onMouseEnter={() => setSelectedIndex(index)}
              className={`w-full text-left px-4 py-2.5 flex flex-col gap-0.5 transition-colors ${
                index === selectedIndex ? 'bg-blue-50' : 'hover:bg-gray-50'
              }`}>
              <span className={`text-sm font-medium ${index === selectedIndex ? 'text-blue-700' : 'text-gray-800'}`}>{suggestion.label}</span>
              {suggestion.description && <span className="text-xs text-slate-500">{suggestion.description}</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default SearchInput;
