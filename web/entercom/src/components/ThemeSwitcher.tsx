import { Sun, Moon, Monitor } from 'lucide-react';
import { useThemeStore } from '../store/themeStore';
import { useState, useRef, useEffect } from 'react';

export function ThemeSwitcher() {
  const { theme, setTheme } = useThemeStore();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getIcon = () => {
    if (theme === 'dark') return <Moon size={20} />;
    if (theme === 'light') return <Sun size={20} />;
    return <Monitor size={20} />;
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="text-gray-500 hover:text-gray-900 focus:outline-none p-2 rounded-lg hover:bg-gray-100 transition-colors"
        title="Toggle Theme"
      >
        {getIcon()}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-36 bg-white border border-gray-200 rounded-xl shadow-lg py-1 z-50">
          <button
            onClick={() => { setTheme('light'); setIsOpen(false); }}
            className={`w-full flex items-center gap-3 px-4 py-2 text-sm text-left transition-colors ${theme === 'light' ? 'bg-purple-50 text-ess-purple font-medium' : 'text-gray-700 hover:bg-gray-50'}`}
          >
            <Sun size={16} /> Light
          </button>
          <button
            onClick={() => { setTheme('dark'); setIsOpen(false); }}
            className={`w-full flex items-center gap-3 px-4 py-2 text-sm text-left transition-colors ${theme === 'dark' ? 'bg-purple-50 text-ess-purple font-medium' : 'text-gray-700 hover:bg-gray-50'}`}
          >
            <Moon size={16} /> Dark
          </button>
          <button
            onClick={() => { setTheme('system'); setIsOpen(false); }}
            className={`w-full flex items-center gap-3 px-4 py-2 text-sm text-left transition-colors ${theme === 'system' ? 'bg-purple-50 text-ess-purple font-medium' : 'text-gray-700 hover:bg-gray-50'}`}
          >
            <Monitor size={16} /> System
          </button>
        </div>
      )}
    </div>
  );
}
