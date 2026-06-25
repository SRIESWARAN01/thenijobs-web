'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Search, X, Loader2 } from 'lucide-react';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export interface SearchSuggestion {
  label: string;
  value: string;
  description?: string;
}

export interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  onSearch?: (value: string) => void;
  suggestions?: SearchSuggestion[];
  loading?: boolean;
  className?: string;
  debounceMs?: number;
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function SearchInput({
  value,
  onChange,
  placeholder = 'Search...',
  onSearch,
  suggestions = [],
  loading = false,
  className = '',
  debounceMs = 300,
}: SearchInputProps) {
  const [localValue, setLocalValue] = useState(value);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Sync external value
  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  // Debounced onChange
  const handleChange = useCallback(
    (val: string) => {
      setLocalValue(val);
      setSelectedIndex(-1);

      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        onChange(val);
      }, debounceMs);
    },
    [onChange, debounceMs],
  );

  // Cleanup timer
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  // Close suggestions on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleClear = () => {
    setLocalValue('');
    onChange('');
    setShowSuggestions(false);
    inputRef.current?.focus();
  };

  const handleSelectSuggestion = (suggestion: SearchSuggestion) => {
    setLocalValue(suggestion.label);
    onChange(suggestion.value);
    onSearch?.(suggestion.value);
    setShowSuggestions(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && suggestions[selectedIndex]) {
          handleSelectSuggestion(suggestions[selectedIndex]);
        } else {
          onSearch?.(localValue);
        }
        setShowSuggestions(false);
        break;
      case 'Escape':
        if (showSuggestions) {
          setShowSuggestions(false);
        } else {
          handleClear();
        }
        break;
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev < suggestions.length - 1 ? prev + 1 : 0,
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev > 0 ? prev - 1 : suggestions.length - 1,
        );
        break;
    }
  };

  const hasSuggestions = suggestions.length > 0 && showSuggestions && localValue.length > 0;

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* Input wrapper */}
      <div className="relative">
        {/* Search icon */}
        <div className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none">
          {loading ? (
            <Loader2 className="w-4 h-4 text-white/40 animate-spin" />
          ) : (
            <Search className="w-4 h-4 text-white/40" />
          )}
        </div>

        <input
          ref={inputRef}
          type="text"
          value={localValue}
          onChange={(e) => handleChange(e.target.value)}
          onFocus={() => setShowSuggestions(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="search-input w-full pl-10 pr-10 py-2.5 text-sm"
          autoComplete="off"
        />

        {/* Clear button */}
        {localValue && (
          <button
            onClick={handleClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 rounded-md
              text-white/30 hover:text-white/60 hover:bg-white/[0.06] transition-all"
            aria-label="Clear search"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Suggestions dropdown */}
      {hasSuggestions && (
        <div
          className="absolute z-50 top-full left-0 right-0 mt-1.5 py-1.5
            rounded-xl glass-card overflow-hidden max-h-64 overflow-y-auto"
        >
          {suggestions.map((suggestion, index) => (
            <button
              key={suggestion.value}
              onClick={() => handleSelectSuggestion(suggestion)}
              onMouseEnter={() => setSelectedIndex(index)}
              className={`w-full text-left px-4 py-2.5 flex flex-col gap-0.5
                transition-colors ${
                  index === selectedIndex
                    ? 'bg-purple-500/10 text-white'
                    : 'text-white/70 hover:bg-white/[0.04]'
                }`}
            >
              <span className="text-sm font-medium">{suggestion.label}</span>
              {suggestion.description && (
                <span className="text-xs text-white/40">{suggestion.description}</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default SearchInput;
