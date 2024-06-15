import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import useTypewriterEffect from '../useTypewriterEffect';

const ChatMessage = ({ message, logo, initialLoadComplete }) => {
    const typedContent = useTypewriterEffect(message.content, 50);
    const content = (message.role === 'assistant' && initialLoadComplete && message.isNew) 
        ? typedContent 
        : message.content;

    return (
        <div
            className={`chat-message ${message.role === 'user' ? 'self-end max-w-2/4 bg-yedu-light-gray' : 'font-medium self-start w-[90%] bg-yedu-light-green'} transition-all p-2 rounded-md flex flex-col gap-3 text-sm`}
        >
            <div className="flex gap-4">
                <img
                    src={logo}
                    alt=""
                    className={`w-8 self-start ${message.role === 'assistant' ? 'block' : 'hidden'}`}
                />
                <div className="flex flex-col">
                    <ReactMarkdown
                        children={content}
                        remarkPlugins={[remarkGfm]}
                        className="markdown-content flex flex-col gap-8"
                    />
                </div>
            </div>
            <span className="self-end font-medium">
                {new Date(message.timestamp).toLocaleDateString('en-US', {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                })}
            </span>
        </div>
    );
};

export default ChatMessage;
