'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Globe, Check, ChevronDown } from 'lucide-react';
import { useLanguage, LANGUAGES, LanguageCode } from '@/lib/language-context';

interface LanguageSwitcherProps {
    variant?: 'header' | 'mobile';
}

export function LanguageSwitcher({ variant = 'header' }: LanguageSwitcherProps) {
    const { language, setLanguage, currentLanguageLabel } = useLanguage();
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Close on click outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSelect = (code: LanguageCode) => {
        setLanguage(code);
        setIsOpen(false);
    };

    if (variant === 'mobile') {
        return (
            <div className="flex flex-col gap-2 p-3 rounded-xl bg-slate-900 border border-slate-800">
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-300 mb-1">
                    <Globe className="h-4 w-4 text-[#00E5C3]" />
                    <span>भाषा चुनें / Select Language:</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                    {LANGUAGES.map((item) => {
                        const isSelected = language === item.code;
                        return (
                            <button
                                key={item.code}
                                onClick={() => handleSelect(item.code)}
                                type="button"
                                className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                                    isSelected
                                        ? 'bg-[#00E5C3] text-[#0B1120] shadow-md'
                                        : 'bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700'
                                }`}
                            >
                                <span>{item.nativeLabel}</span>
                                {isSelected && <Check className="h-4 w-4" />}
                            </button>
                        );
                    })}
                </div>
            </div>
        );
    }

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 text-xs font-semibold text-slate-200 hover:text-white transition-all shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
                aria-label="Change language / भाषा बदलें"
                aria-expanded={isOpen}
            >
                <Globe className="h-3.5 w-3.5 text-[#00E5C3]" />
                <span>{currentLanguageLabel}</span>
                <ChevronDown className={`h-3.5 w-3.5 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-44 rounded-xl bg-[#0E1626] border border-slate-700 shadow-2xl p-1.5 z-50 animate-in fade-in zoom-in-95 duration-150">
                    <div className="text-[10px] font-bold text-slate-400 px-2.5 py-1 uppercase tracking-wider">
                        भाषा / Language
                    </div>
                    <div className="flex flex-col gap-0.5">
                        {LANGUAGES.map((item) => {
                            const isSelected = language === item.code;
                            return (
                                <button
                                    key={item.code}
                                    onClick={() => handleSelect(item.code)}
                                    type="button"
                                    className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold transition-colors ${
                                        isSelected
                                            ? 'bg-teal-500/20 text-[#00E5C3] font-bold'
                                            : 'text-slate-300 hover:text-white hover:bg-slate-800'
                                    }`}
                                >
                                    <span>{item.nativeLabel}</span>
                                    {isSelected && <Check className="h-3.5 w-3.5 text-[#00E5C3]" />}
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}
