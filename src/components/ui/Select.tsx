'use client';

import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectProps {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  className?: string;
  buttonClassName?: string;
  disabled?: boolean;
  id?: string;
}

export function Select({
  value,
  onChange,
  options,
  placeholder = 'Select option...',
  className = '',
  buttonClassName = '',
  disabled = false,
  id,
}: SelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);

  // Find currently selected option
  const selectedOption = options.find((opt) => opt.value === value);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleToggle = () => {
    if (!disabled) {
      const nextOpen = !isOpen;
      setIsOpen(nextOpen);
      if (nextOpen) {
        const idx = options.findIndex((opt) => opt.value === value);
        setFocusedIndex(idx >= 0 ? idx : 0);
      }
    }
  };

  const handleSelect = (val: string) => {
    onChange(val);
    setIsOpen(false);
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (disabled) return;

    switch (event.key) {
      case 'Enter':
      case ' ':
        event.preventDefault();
        if (!isOpen) {
          setIsOpen(true);
          const idx = options.findIndex((opt) => opt.value === value);
          setFocusedIndex(idx >= 0 ? idx : 0);
        } else if (focusedIndex >= 0 && focusedIndex < options.length) {
          handleSelect(options[focusedIndex].value);
        }
        break;
      case 'ArrowDown':
        event.preventDefault();
        if (!isOpen) {
          setIsOpen(true);
          const idx = options.findIndex((opt) => opt.value === value);
          setFocusedIndex(idx >= 0 ? idx : 0);
        } else {
          setFocusedIndex((prev) => (prev + 1) % options.length);
        }
        break;
      case 'ArrowUp':
        event.preventDefault();
        if (!isOpen) {
          setIsOpen(true);
          const idx = options.findIndex((opt) => opt.value === value);
          setFocusedIndex(idx >= 0 ? idx : options.length - 1);
        } else {
          setFocusedIndex((prev) => (prev - 1 + options.length) % options.length);
        }
        break;
      case 'Escape':
        event.preventDefault();
        setIsOpen(false);
        break;
      case 'Tab':
        setIsOpen(false);
        break;
      default:
        break;
    }
  };

  return (
    <div
      ref={containerRef}
      onKeyDown={handleKeyDown}
      className={`relative inline-block w-full text-left font-outfit ${className}`}
      id={id}
    >
      <button
        type="button"
        disabled={disabled}
        onClick={handleToggle}
        className={`flex w-full items-center justify-between gap-2 rounded-xl text-sm outline-none transition-all cursor-pointer ${
          buttonClassName || (disabled
            ? 'bg-[#334155] border border-[#1E293B] text-[#64748B] cursor-not-allowed px-4 py-2.5'
            : isOpen
            ? 'bg-[#0F172A] border border-[#3B82F6] text-[#FFFFFF] px-4 py-2.5'
            : 'bg-[#0F172A] border border-[#1E293B] hover:border-gray-500 text-[#FFFFFF] px-4 py-2.5')
        }`}
      >
        <span className={!selectedOption ? 'text-[#94A3B8] truncate' : 'text-[#FFFFFF] truncate'}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown
          size={16}
          className={`text-gray-400 shrink-0 transition-transform ${isOpen ? 'rotate-180 text-[#3B82F6]' : ''}`}
        />
      </button>

      {isOpen && (
        <div className="absolute left-0 right-0 z-50 mt-1.5 max-h-60 overflow-y-auto rounded-xl border border-[#1E293B] bg-[#0F172A] p-1 shadow-2xl animate-fade-in-scale select-none scroll-snap-x">
          {options.map((option, idx) => {
            const isSelected = option.value === value;
            const isFocused = idx === focusedIndex;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => handleSelect(option.value)}
                onMouseEnter={() => setFocusedIndex(idx)}
                className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium cursor-pointer transition-all ${
                  isSelected
                    ? 'bg-[#2563EB] text-[#FFFFFF]'
                    : isFocused
                    ? 'bg-[#1D4ED8] text-[#FFFFFF]'
                    : 'text-[#FFFFFF] hover:bg-[#1D4ED8] hover:text-[#FFFFFF]'
                }`}
              >
                {option.label}
              </button>
            );
          })}
          {options.length === 0 && (
            <div className="px-3 py-2 text-xs text-[#94A3B8] text-center">No options available</div>
          )}
        </div>
      )}
    </div>
  );
}
