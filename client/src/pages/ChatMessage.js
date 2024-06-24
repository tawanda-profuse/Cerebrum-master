import React from 'react';
import useTypewriterEffect from './useTypewriterEffect';

const ChatMessage = ({ message, logo }) => {
    const typedContent = useTypewriterEffect(message.content, 50);
    
    const content = message.role === 'assistant' && message.isNew 
        ? typedContent 
        : message.content;

    return (
        <div
            className={`chat-message p-4 rounded-lg shadow-sm flex flex-col mb-4 ${
                message.role === 'user'
                    ? 'self-end ml-12 bg-white'
                    : 'self-start mr-12 bg-green-500'
            }`}
        >
            <div className="flex gap-4 items-start">
                {message.role === 'assistant' && (
                    <img
                        src={logo}
                        alt="Assistant"
                        className="w-8 h-8 rounded-full object-cover"
                    />
                )}
                <div className={`flex-1 overflow-hidden ${
                    message.role === 'user' ? 'text-gray-700' : 'text-white'
                }`}>
                    {content}
                </div>
            </div>
            <span className={`self-end text-xs mt-2 ${
                message.role === 'user' ? 'text-gray-500' : 'text-white text-opacity-70'
            }`}>
                {new Date(message.timestamp).toLocaleTimeString('en-US', {
                    hour: '2-digit',
                    minute: '2-digit',
                })}
            </span>
        </div>
    );
};

export default ChatMessage;