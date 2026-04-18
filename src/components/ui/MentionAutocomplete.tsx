import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { motion, AnimatePresence } from 'framer-motion';
import { AtSign } from 'lucide-react';

interface MentionAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onKeyDown?: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  placeholder?: string;
  rows?: number;
  className?: string;
}

export function MentionAutocomplete({
  value,
  onChange,
  onKeyDown,
  placeholder,
  rows = 3,
  className = '',
}: MentionAutocompleteProps) {
  const [showDropdown, setShowDropdown] = useState(false);
  const [mentionSearch, setMentionSearch] = useState('');
  const [mentionStartIndex, setMentionStartIndex] = useState(-1);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const searchResults = useQuery(
    api.communication.searchTeamMembers,
    showDropdown && mentionSearch.length > 0 ? { searchTerm: mentionSearch } : 'skip'
  );

  // Detect @ mentions as user types
  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const newValue = e.target.value;
      const cursorPos = e.target.selectionStart;
      onChange(newValue);

      // Look backwards from cursor for an @ that starts a mention
      const textBeforeCursor = newValue.slice(0, cursorPos);
      const lastAtIndex = textBeforeCursor.lastIndexOf('@');

      if (lastAtIndex >= 0) {
        const textAfterAt = textBeforeCursor.slice(lastAtIndex + 1);
        // Only show dropdown if @ is at start or preceded by whitespace, and no spaces in the search term
        const charBeforeAt = lastAtIndex > 0 ? newValue[lastAtIndex - 1] : ' ';
        if (/\s/.test(charBeforeAt) || lastAtIndex === 0) {
          if (!/\s/.test(textAfterAt) && textAfterAt.length <= 20) {
            setMentionSearch(textAfterAt);
            setMentionStartIndex(lastAtIndex);
            setShowDropdown(true);
            setSelectedIndex(0);
            return;
          }
        }
      }

      setShowDropdown(false);
      setMentionSearch('');
      setMentionStartIndex(-1);
    },
    [onChange]
  );

  const insertMention = useCallback(
    (name: string) => {
      if (mentionStartIndex < 0 || !textareaRef.current) return;

      const cursorPos = textareaRef.current.selectionStart;
      // Replace @searchTerm with @Name (using first word of name for the mention)
      const mentionName = name.split(' ')[0]; // Use first name for mention
      const before = value.slice(0, mentionStartIndex);
      const after = value.slice(cursorPos);
      const newValue = `${before}@${mentionName} ${after}`;
      onChange(newValue);

      setShowDropdown(false);
      setMentionSearch('');
      setMentionStartIndex(-1);

      // Focus textarea and set cursor after the inserted mention
      setTimeout(() => {
        if (textareaRef.current) {
          const newCursorPos = mentionStartIndex + mentionName.length + 2; // @name + space
          textareaRef.current.selectionStart = newCursorPos;
          textareaRef.current.selectionEnd = newCursorPos;
          textareaRef.current.focus();
        }
      }, 0);
    },
    [mentionStartIndex, value, onChange]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (showDropdown && searchResults && searchResults.length > 0) {
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          setSelectedIndex((prev) => Math.min(prev + 1, searchResults.length - 1));
          return;
        }
        if (e.key === 'ArrowUp') {
          e.preventDefault();
          setSelectedIndex((prev) => Math.max(prev - 1, 0));
          return;
        }
        if (e.key === 'Enter' || e.key === 'Tab') {
          e.preventDefault();
          insertMention(searchResults[selectedIndex].name);
          return;
        }
        if (e.key === 'Escape') {
          e.preventDefault();
          setShowDropdown(false);
          return;
        }
      }

      // Pass through to parent handler
      onKeyDown?.(e);
    },
    [showDropdown, searchResults, selectedIndex, insertMention, onKeyDown]
  );

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        textareaRef.current &&
        !textareaRef.current.contains(e.target as Node)
      ) {
        setShowDropdown(false);
      }
    }
    if (showDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showDropdown]);

  return (
    <div className="relative">
      <textarea
        ref={textareaRef}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        rows={rows}
        className={className}
      />

      <AnimatePresence>
        {showDropdown && mentionSearch.length > 0 && (
          <motion.div
            ref={dropdownRef}
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.12 }}
            className="absolute left-0 right-0 top-full mt-1 z-50 border-2 border-black dark:border-white bg-white dark:bg-neutral-900 shadow-[4px_4px_0px_0px_#000] dark:shadow-[4px_4px_0px_0px_#fff] max-h-[200px] overflow-y-auto"
          >
            {searchResults === undefined ? (
              <div className="px-4 py-3 flex items-center gap-2">
                <div className="w-3 h-3 border-2 border-black dark:border-white border-t-transparent animate-spin" />
                <span className="text-xs font-bold text-neutral-400">Searching...</span>
              </div>
            ) : searchResults.length === 0 ? (
              <div className="px-4 py-3">
                <span className="text-xs font-bold text-neutral-400 uppercase tracking-wide">
                  No matches for "@{mentionSearch}"
                </span>
              </div>
            ) : (
              (searchResults as Array<{ name: string; email: string }>).map((result, i) => (
                <button
                  key={`${result.name}-${result.email}`}
                  onClick={() => insertMention(result.name)}
                  className={`w-full text-left px-4 py-2.5 flex items-center gap-3 transition-colors cursor-pointer ${
                    i === selectedIndex
                      ? 'bg-[#6D28D9]/10 dark:bg-[#6D28D9]/20'
                      : 'hover:bg-neutral-100 dark:hover:bg-neutral-800'
                  }`}
                >
                  <div className="w-7 h-7 flex-shrink-0 border border-black dark:border-white bg-black dark:bg-white text-white dark:text-black flex items-center justify-center text-[10px] font-black">
                    {result.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-black dark:text-white truncate">
                      {result.name}
                    </p>
                    {result.email && (
                      <p className="text-[10px] text-neutral-400 truncate">{result.email}</p>
                    )}
                  </div>
                  <AtSign size={12} className="text-[#6D28D9] flex-shrink-0" />
                </button>
              ))
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
