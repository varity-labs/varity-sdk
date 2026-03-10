'use client';

import React, { useState, useRef, useEffect } from 'react';
import { LucideIcon } from 'lucide-react';

export interface DropdownMenuItem {
  label: string;
  onClick: () => void;
  icon?: LucideIcon;
  disabled?: boolean;
  danger?: boolean;
}

export interface DropdownMenuProps {
  trigger: React.ReactNode;
  items: (DropdownMenuItem | 'divider')[];
  align?: 'left' | 'right';
  className?: string;
}

export function DropdownMenu({
  trigger,
  items,
  align = 'right',
  className = '',
}: DropdownMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState<number>(-1);
  const menuRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  // Get only the actual menu items (not dividers)
  const menuItems = items.filter((item): item is DropdownMenuItem => item !== 'divider');

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setFocusedIndex(-1);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
        e.preventDefault();
        setIsOpen(true);
        setFocusedIndex(0);
      }
      return;
    }

    switch (e.key) {
      case 'Escape':
        e.preventDefault();
        setIsOpen(false);
        setFocusedIndex(-1);
        triggerRef.current?.focus();
        break;

      case 'ArrowDown':
        e.preventDefault();
        setFocusedIndex((prev) => {
          const nextIndex = prev + 1;
          return nextIndex >= menuItems.length ? 0 : nextIndex;
        });
        break;

      case 'ArrowUp':
        e.preventDefault();
        setFocusedIndex((prev) => {
          const nextIndex = prev - 1;
          return nextIndex < 0 ? menuItems.length - 1 : nextIndex;
        });
        break;

      case 'Enter':
      case ' ':
        e.preventDefault();
        if (focusedIndex >= 0 && focusedIndex < menuItems.length) {
          const item = menuItems[focusedIndex];
          if (!item.disabled) {
            item.onClick();
            setIsOpen(false);
            setFocusedIndex(-1);
          }
        }
        break;

      case 'Tab':
        // Focus trap: keep focus within menu
        e.preventDefault();
        if (e.shiftKey) {
          // Shift+Tab: move backwards
          setFocusedIndex((prev) => {
            const nextIndex = prev - 1;
            return nextIndex < 0 ? menuItems.length - 1 : nextIndex;
          });
        } else {
          // Tab: move forwards
          setFocusedIndex((prev) => {
            const nextIndex = prev + 1;
            return nextIndex >= menuItems.length ? 0 : nextIndex;
          });
        }
        break;
    }
  };

  const handleItemClick = (item: DropdownMenuItem) => {
    if (!item.disabled) {
      item.onClick();
      setIsOpen(false);
      setFocusedIndex(-1);
    }
  };

  return (
    <div className={`relative inline-block ${className}`}>
      <button
        ref={triggerRef}
        onClick={() => setIsOpen(!isOpen)}
        onKeyDown={handleKeyDown}
        className="focus:outline-none"
        aria-haspopup="true"
        aria-expanded={isOpen}
      >
        {trigger}
      </button>

      {isOpen && (
        <div
          ref={menuRef}
          className={`
            absolute z-50 mt-2 w-56 rounded-md shadow-lg
            bg-white dark:bg-gray-800
            border border-gray-200 dark:border-gray-700
            ${align === 'right' ? 'right-0' : 'left-0'}
          `}
          role="menu"
          aria-orientation="vertical"
        >
          <div className="py-1">
            {items.map((item, index) => {
              if (item === 'divider') {
                return (
                  <div
                    key={`divider-${index}`}
                    className="my-1 border-t border-gray-200 dark:border-gray-700"
                    role="separator"
                  />
                );
              }

              const Icon = item.icon;
              const menuItemIndex = menuItems.indexOf(item);
              const isFocused = menuItemIndex === focusedIndex;

              return (
                <button
                  key={index}
                  onClick={() => handleItemClick(item)}
                  disabled={item.disabled}
                  role="menuitem"
                  className={`
                    w-full flex items-center gap-3 px-4 py-2 text-sm text-left
                    transition-colors
                    ${
                      item.disabled
                        ? 'opacity-50 cursor-not-allowed'
                        : item.danger
                          ? 'text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20'
                          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }
                    ${isFocused ? 'bg-gray-100 dark:bg-gray-700' : ''}
                  `}
                >
                  {Icon && <Icon className="w-4 h-4 flex-shrink-0" />}
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
