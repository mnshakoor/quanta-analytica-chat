import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ChatMessage, ChatRole, GroundingSource, FileData } from './types.ts';
import { streamChat } from './services/geminiService.ts';
import Header from './components/Header.tsx';
import MessageList from './components/MessageList.tsx';
import ChatInput from './components/ChatInput.tsx';
import { WELCOME_MESSAGE, GEMINI_MODEL } from './constants.ts';

const App: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: ChatRole.Model,
      parts: [{ text: WELCOME_MESSAGE }],
      timestamp: Date.now(),
    },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [useGoogleSearch, setUseGoogleSearch] = useState<boolean>(false);

  const sendMessage = useCallback(async (prompt: string, file: FileData | null) => {
    if (isLoading || (!prompt.trim() && !file)) return;

    setIsLoading(true);
    setError(null);

    const userMessage: ChatMessage = {
      role: ChatRole.User,
      parts: [{ text: prompt }],
      timestamp: Date.now(),
    };
    if (file) {
      userMessage.parts.push({ fileData: file });
    }
    
    const currentMessages = [...messages, userMessage];
    setMessages(currentMessages);

    const modelResponse: ChatMessage = {
      role: ChatRole.Model,
      parts: [{ text: '' }],
      timestamp: Date.now(),
    };
    setMessages(prev => [...prev, modelResponse]);

    try {
      // The history sent to the backend is the list of messages *before* the user's current prompt
      const history = messages; 
      const stream = await streamChat(prompt, file, history, useGoogleSearch);
      
      let fullResponseText = '';
      let sources: GroundingSource[] = [];

      for await (const chunk of stream) {
        fullResponseText += chunk.text;
        if (chunk.sources && chunk.sources.length > 0) {
          // Use a Map to efficiently deduplicate sources
          const sourceMap = new Map(sources.map(s => [s.uri, s]));
          chunk.sources.forEach(s => sourceMap.set(s.uri, s));
          sources = Array.from(sourceMap.values());
        }

        setMessages(prev =>
          prev.map((msg, index) =>
            index === prev.length - 1
              ? { ...msg, parts: [{ text: fullResponseText }], sources: sources.length > 0 ? sources : undefined }
              : msg
          )
        );
      }
    } catch (e: any) {
      const errorMessage = `Error: ${e.message || 'An unknown error occurred.'}`;
      setError(errorMessage);
       setMessages(prev =>
        prev.map((msg, index) =>
          index === prev.length - 1
            ? { ...msg, parts: [{ text: errorMessage }], isError: true }
            : msg
        )
      );
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, messages, useGoogleSearch]);

  return (
    <div className="flex flex-col h-screen bg-gray-900 text-gray-200 font-sans">
      <Header />
      <MessageList messages={messages} />
      <div className="px-4 pb-4">
        <ChatInput
          onSendMessage={sendMessage}
          isLoading={isLoading}
          useGoogleSearch={useGoogleSearch}
          setUseGoogleSearch={setUseGoogleSearch}
        />
        <p className="text-center text-xs text-gray-500 mt-2">
          Using model: {GEMINI_MODEL}. All conversations are processed by Gemini.
        </p>
      </div>
    </div>
  );
};

export default App;