
import React, { useState, useRef, useCallback } from 'react';
import { IconSend, IconPaperclip, IconGoogle, IconClose } from './Icons';
import type { FileData } from '../types';

interface ChatInputProps {
  onSendMessage: (message: string, file: FileData | null) => void;
  isLoading: boolean;
  useGoogleSearch: boolean;
  setUseGoogleSearch: React.Dispatch<React.SetStateAction<boolean>>;
}

const ChatInput: React.FC<ChatInputProps> = ({
  onSendMessage,
  isLoading,
  useGoogleSearch,
  setUseGoogleSearch,
}) => {
  const [prompt, setPrompt] = useState('');
  const [attachedFile, setAttachedFile] = useState<FileData | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSendMessage = useCallback(() => {
    if ((prompt.trim() || attachedFile) && !isLoading) {
      onSendMessage(prompt.trim(), attachedFile);
      setPrompt('');
      setAttachedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  }, [prompt, attachedFile, isLoading, onSendMessage]);
  
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
            const base64String = (event.target.result as string).split(',')[1];
            setAttachedFile({
                name: file.name,
                mimeType: file.type,
                data: base64String,
            });
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const removeAttachment = () => {
      setAttachedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
  };

  return (
    <div className="bg-gray-800 rounded-xl p-2 shadow-lg">
      {attachedFile && (
        <div className="px-3 pt-2">
          <div className="bg-gray-700/50 rounded-lg p-2 flex items-center justify-between text-sm">
            <span className="text-gray-300 truncate">Attached: {attachedFile.name}</span>
            <button onClick={removeAttachment} className="p-1 rounded-full hover:bg-gray-600">
                <IconClose className="w-4 h-4 text-gray-400" />
            </button>
          </div>
        </div>
      )}
      <div className="flex items-end p-2 gap-2">
        <button
            title="Attach File"
            onClick={() => fileInputRef.current?.click()}
            className="p-2 rounded-full hover:bg-gray-700 transition-colors flex-shrink-0"
        >
          <IconPaperclip className="w-6 h-6 text-gray-400" />
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
          />
        </button>
        <button
          onClick={() => setUseGoogleSearch(!useGoogleSearch)}
          title={useGoogleSearch ? "Disable Google Search" : "Enable Google Search"}
          className={`p-2 rounded-full transition-colors flex-shrink-0 ${
            useGoogleSearch ? 'bg-blue-500/20' : 'hover:bg-gray-700'
          }`}
        >
          <IconGoogle className={`w-6 h-6 ${useGoogleSearch ? 'text-blue-400' : 'text-gray-400'}`} />
        </button>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type your message..."
          rows={1}
          className="flex-1 bg-transparent resize-none focus:outline-none text-gray-200 placeholder-gray-500 max-h-48"
        />
        <button
          onClick={handleSendMessage}
          disabled={isLoading || (!prompt.trim() && !attachedFile)}
          className="p-2 rounded-full bg-blue-600 hover:bg-blue-500 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors flex-shrink-0"
        >
          <IconSend className="w-6 h-6 text-white" />
        </button>
      </div>
    </div>
  );
};

export default ChatInput;
