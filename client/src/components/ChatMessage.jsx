import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import useTypewriterEffect from '../useTypewriterEffect';

const ChatMessage = ({ message, logo, initialLoadComplete }) => {
    const typedContent = useTypewriterEffect(message.content, 50);
    const content =
        message.role === 'assistant' && initialLoadComplete && message.isNew
            ? typedContent
            : message.content;

    return (
        <div
            className={`chat-message transition-all p-4 rounded-lg shadow-sm flex flex-col ${
                message.role === 'user'
                    ? 'self-end max-w-2/3 bg-yedu-light-gray text-gray-800'
                    : 'self-start max-w-3/4 custom-gradient text-[white]'
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
                <div className="flex-1 overflow-hidden">
                    <ReactMarkdown
                        children={content}
                        remarkPlugins={[remarkGfm]}
                        className="markdown-content prose prose-sm max-w-none"
                    />
                    {message.imageUrl && (
                        <div className="mt-4 rounded-md overflow-hidden">
                            <img
                                src={message.imageUrl}
                                alt={`Message ${message.messageId} from ${message.role}`}
                                className="w-full max-w-sm object-cover"
                            />
                        </div>
                    )}
                </div>
            </div>
            <span className="self-end text-xs text-[gray-500] mt-2">
                {new Date(message.timestamp).toLocaleDateString('en-US', {
                    month: 'short',
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