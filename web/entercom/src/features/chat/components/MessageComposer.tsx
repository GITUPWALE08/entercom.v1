import React, { useState } from 'react';

interface MessageComposerProps {
  onSend: (body: string) => Promise<void>;
  disabled?: boolean;
}

export function MessageComposer({ onSend, disabled }: MessageComposerProps) {
  const [text, setText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const maxLength = 5000;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || isSending || disabled || text.length > maxLength) return;

    try {
      setIsSending(true);
      await onSend(text.trim());
      setText('');
    } catch (err) {
      console.error('Failed to send message', err);
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-4 bg-white border-t border-gray-100 flex flex-col gap-2">
      <div className="flex gap-2 items-end">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type a message..."
          disabled={disabled || isSending}
          maxLength={maxLength}
          rows={Math.min(5, text.split('\\n').length || 1)}
          className="flex-1 resize-none overflow-y-auto p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-ess-purple focus:border-transparent outline-none transition-shadow text-sm"
          style={{ minHeight: '44px', maxHeight: '120px' }}
        />
        <button
          type="submit"
          disabled={!text.trim() || disabled || isSending || text.length > maxLength}
          className="p-3 bg-ess-purple text-white rounded-xl hover:bg-ess-darkPurple transition-colors disabled:opacity-50 disabled:hover:bg-ess-purple shadow-sm flex items-center justify-center shrink-0"
        >
          {isSending ? (
            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          ) : (
            <svg className="w-5 h-5 translate-x-[-1px] translate-y-[1px]" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
            </svg>
          )}
        </button>
      </div>
      <div className="flex justify-between items-center text-xs text-gray-400">
        <span>Press Enter to send, Shift+Enter for new line</span>
        <span className={text.length > maxLength * 0.9 ? 'text-red-500' : ''}>
          {text.length}/{maxLength}
        </span>
      </div>
    </form>
  );
}
