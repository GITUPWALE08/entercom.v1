import React, { useState, useRef } from 'react';
import { useAuthStore } from '../../../store/authStore';

interface MessageComposerProps {
  onSend: (body: string, type: 'text' | 'internal_note', files: File[]) => Promise<void>;
  disabled?: boolean;
}

export function MessageComposer({ onSend, disabled }: MessageComposerProps) {
  const { user } = useAuthStore();
  const [text, setText] = useState('');
  const [isInternal, setIsInternal] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [isSending, setIsSending] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const maxLength = 5000;
  
  const canSendInternal = user && ['admin', 'manager', 'staff'].includes(user.role);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!text.trim() && files.length === 0) || isSending || disabled || text.length > maxLength) return;

    try {
      setIsSending(true);
      await onSend(text.trim(), isInternal ? 'internal_note' : 'text', files);
      setText('');
      setFiles([]);
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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selected = Array.from(e.target.files);
      setFiles(prev => [...prev, ...selected]);
    }
    // reset input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <form onSubmit={handleSubmit} className="p-4 bg-white border-t border-gray-100 flex flex-col gap-2">
      {files.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-2">
          {files.map((file, i) => (
            <div key={i} className="flex items-center gap-1 bg-gray-100 px-2 py-1 rounded text-sm text-gray-700">
              <span className="truncate max-w-[150px]" title={file.name}>{file.name}</span>
              <button type="button" onClick={() => removeFile(i)} className="text-gray-500 hover:text-red-500">
                &times;
              </button>
            </div>
          ))}
        </div>
      )}
      
      {canSendInternal && (
        <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
          <label className="flex items-center gap-1 cursor-pointer">
            <input 
              type="checkbox" 
              checked={isInternal} 
              onChange={(e) => setIsInternal(e.target.checked)}
              className="rounded border-gray-300 text-yellow-500 focus:ring-yellow-500"
            />
            <span>Internal Note (hidden from customer)</span>
          </label>
        </div>
      )}
      
      <div className="flex gap-2 items-end">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled || isSending}
          className="p-3 text-gray-400 hover:text-ess-purple transition-colors disabled:opacity-50"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"></path></svg>
        </button>
        <input 
          type="file" 
          multiple 
          className="hidden" 
          ref={fileInputRef} 
          onChange={handleFileChange}
          accept="image/jpeg,image/png,image/webp,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"
        />
        
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={isInternal ? "Type an internal note..." : "Type a message..."}
          disabled={disabled || isSending}
          maxLength={maxLength}
          rows={Math.min(5, text.split('\n').length || 1)}
          className={`flex-1 resize-none overflow-y-auto p-3 border rounded-xl focus:ring-2 focus:border-transparent outline-none transition-shadow text-sm ${isInternal ? 'bg-yellow-50 border-yellow-200 focus:ring-yellow-400' : 'bg-gray-50 border-gray-200 focus:ring-ess-purple'}`}
          style={{ minHeight: '44px', maxHeight: '120px' }}
        />
        <button
          type="submit"
          disabled={(!text.trim() && files.length === 0) || disabled || isSending || text.length > maxLength}
          className={`p-3 text-white rounded-xl transition-colors disabled:opacity-50 shadow-sm flex items-center justify-center shrink-0 ${isInternal ? 'bg-yellow-500 hover:bg-yellow-600 disabled:hover:bg-yellow-500' : 'bg-ess-purple hover:bg-ess-darkPurple disabled:hover:bg-ess-purple'}`}
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
