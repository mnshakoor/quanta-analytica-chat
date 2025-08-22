
import React from 'react';
import { ChatMessage, ChatRole, GroundingSource } from '../types.ts';
import { IconUser, IconGemini, IconSource } from './Icons.tsx';
import { marked } from 'marked';

interface ChatMessageProps {
  message: ChatMessage;
}

const SourceLink: React.FC<{ source: GroundingSource; index: number }> = ({ source, index }) => (
  <a
    href={source.uri}
    target="_blank"
    rel="noopener noreferrer"
    className="flex items-center bg-gray-700/50 hover:bg-gray-600/50 rounded-lg p-2 transition-colors duration-200 text-sm"
  >
    <div className="flex-shrink-0 w-5 h-5 bg-gray-600 rounded-full flex items-center justify-center mr-2 text-xs text-gray-300">
      {index + 1}
    </div>
    <span className="truncate text-gray-300 hover:text-gray-100">{source.title}</span>
  </a>
);

const ChatMessageItem: React.FC<ChatMessageProps> = ({ message }) => {
  const isUserModel = message.role === ChatRole.User;
  
  const createMarkup = (text: string) => {
    return { __html: marked(text, { breaks: true, gfm: true }) };
  };

  const filePart = message.parts.find(p => p.fileData);
  const textPart = message.parts.find(p => p.text);

  return (
    <div className={`flex items-start gap-4 ${isUserModel ? 'justify-end' : ''}`}>
      {!isUserModel && (
         <div className="w-8 h-8 flex-shrink-0 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-full flex items-center justify-center">
            <IconGemini className="w-5 h-5 text-white" />
         </div>
      )}
      <div className={`max-w-2xl w-full ${isUserModel ? 'order-1' : 'order-2'}`}>
        <div
          className={`px-4 py-3 rounded-2xl ${
            isUserModel
              ? 'bg-blue-600 text-white rounded-br-none'
              : `bg-gray-800 text-gray-200 rounded-bl-none ${message.isError ? 'border border-red-500/50' : ''}`
          }`}
        >
          {filePart && filePart.fileData && (
            <div className="mb-2 p-2 bg-gray-700/50 rounded-lg">
                {filePart.fileData.mimeType.startsWith('image/') ? (
                    <img src={`data:${filePart.fileData.mimeType};base64,${filePart.fileData.data}`} alt={filePart.fileData.name} className="max-w-xs max-h-48 rounded-md"/>
                ) : (
                    <p className="text-sm text-gray-400">Attached file: {filePart.fileData.name}</p>
                )}
            </div>
          )}

          {textPart && textPart.text && (
            <div
              className="prose prose-invert prose-sm max-w-none"
              dangerouslySetInnerHTML={createMarkup(textPart.text)}
            />
          )}

           {message.parts.length === 1 && message.parts[0].text === '' && (
            <div className="flex items-center justify-center space-x-1">
              <span className="w-2 h-2 bg-gray-500 rounded-full animate-pulse" style={{ animationDelay: '0s' }}></span>
              <span className="w-2 h-2 bg-gray-500 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></span>
              <span className="w-2 h-2 bg-gray-500 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></span>
            </div>
           )}

        </div>
        {message.sources && message.sources.length > 0 && (
            <div className="mt-3">
                <h4 className="text-sm font-semibold text-gray-400 mb-2 flex items-center"><IconSource className="w-4 h-4 mr-2"/> Sources</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {message.sources.map((source, index) => (
                        <SourceLink key={index} source={source} index={index} />
                    ))}
                </div>
            </div>
        )}
      </div>
      {isUserModel && (
         <div className="w-8 h-8 flex-shrink-0 bg-gray-700 rounded-full flex items-center justify-center order-2">
            <IconUser className="w-5 h-5 text-gray-300" />
         </div>
      )}
    </div>
  );
};

export default ChatMessageItem;