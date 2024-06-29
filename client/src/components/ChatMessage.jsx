import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import useTypewriterEffect from "../useTypewriterEffect";

const ChatMessage = ({ message, logo, initialLoadComplete }) => {
  const typedContent = useTypewriterEffect(message.content, 50);
  const content =
    message.role === "assistant" && initialLoadComplete && message.isNew
      ? typedContent
      : message.content;

  return (
    <div
      className={`chat-message transition-all p-4 rounded-lg shadow-sm flex flex-col ${
        message.role === "user"
          ? "self-end max-w-2/3 bg-yedu-light-gray text-gray-800"
          : "self-start max-w-3/4 bg-gradient-to-br from-gray-100 to-gray-200 text-gray-800"
      }`}
    >
      <div className="flex gap-4 items-start">
        {message.role === "assistant" ? (
          <img
            src={logo}
            alt="Assistant"
            className="w-8 h-8 rounded-full object-cover"
          />
        ) : (
          <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="w-5 h-5 text-gray-600"
            >
              <path
                fillRule="evenodd"
                d="M7.5 6a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM3.751 20.105a8.25 8.25 0 0116.498 0 .75.75 0 01-.437.695A18.683 18.683 0 0112 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 01-.437-.695z"
                clipRule="evenodd"
              />
            </svg>
          </div>
        )}
        <div className="flex-1 overflow-hidden">
          <ReactMarkdown
            children={content}
            remarkPlugins={[remarkGfm]}
            className="markdown-content prose prose-sm max-w-none"
          />
          {message.imageUrl &&
            (initialLoadComplete ? (
              <div className="mt-4 rounded-md overflow-hidden">
                <img
                  src={message.imageUrl}
                  alt={`Message ${message.messageId} from ${message.role}`}
                  className="w-full max-w-sm object-cover"
                />
              </div>
            ) : (
              ""
            ))}
        </div>
      </div>
      <span className="self-end text-xs text-[gray-500] mt-2">
        {new Date(message.timestamp).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })}
      </span>
    </div>
  );
};

export default ChatMessage;
