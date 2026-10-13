import React, { useState } from 'react';
import Markdown from 'react-markdown';
import { Brain, User, Copy, Check, Sparkles } from 'lucide-react';

export const ChatMessage = ({ message, userInitials = 'U' }) => {
  const [copied, setCopied] = useState(false);

  const isUser = message.sender === 'user' || message.role === 'user';
  const content = message.text || message.content || message.message || '';
  const timestamp = message.timestamp || message.createdAt;

  const formattedTime = timestamp
    ? new Date(timestamp).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      })
    : '';

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy message:', err);
    }
  };

  return (
    <div
      className={`flex items-start gap-3 w-full animate-fade-in ${
        isUser ? 'flex-row-reverse' : 'flex-row'
      }`}
    >
      {/* Avatar */}
      {isUser ? (
        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-700 to-violet-600 border border-purple-400/30 flex items-center justify-center text-xs font-semibold text-white flex-shrink-0 shadow-md">
          {userInitials}
        </div>
      ) : (
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-600 to-violet-700 flex items-center justify-center text-white flex-shrink-0 shadow-md shadow-purple-900/30">
          <Brain className="w-4 h-4 text-purple-200" />
        </div>
      )}

      {/* Bubble Container */}
      <div
        className={`flex flex-col max-w-[85%] sm:max-w-[78%] ${
          isUser ? 'items-end' : 'items-start'
        }`}
      >
        <div
          className={`relative group rounded-2xl p-4 shadow-sm text-sm transition-all ${
            isUser
              ? 'bg-purple-600/20 border border-purple-500/30 text-purple-100 rounded-tr-none'
              : 'bg-gray-800/90 border border-gray-700 text-gray-200 rounded-tl-none'
          }`}
        >
          {/* Header indicator for AI if synthesized */}
          {!isUser && message.isSynthesis && (
            <div className="flex items-center gap-1 text-[11px] font-semibold text-purple-400 uppercase tracking-wider mb-2 pb-1.5 border-b border-gray-700/60">
              <Sparkles className="w-3.5 h-3.5 text-purple-400" />
              <span>OmniMind Synthesis Report</span>
            </div>
          )}

          {/* Referenced Media Chips if provided */}
          {message.referencedMedia && message.referencedMedia.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-2.5">
              {message.referencedMedia.map((m, idx) => (
                <span
                  key={idx}
                  className="text-[11px] bg-gray-900/80 border border-purple-500/30 text-purple-300 px-2 py-0.5 rounded-full"
                >
                  📎 {typeof m === 'string' ? m : m.name || m.originalName}
                </span>
              ))}
            </div>
          )}

          {/* Message Content */}
          {isUser ? (
            <p className="whitespace-pre-wrap leading-relaxed break-words">{content}</p>
          ) : (
            <div className="prose break-words">
              <Markdown
                components={{
                  code({ node, inline, className, children, ...props }) {
                    const match = /language-(\w+)/.exec(className || '');
                    return !inline && match ? (
                      <div className="relative my-2">
                        <div className="text-[10px] uppercase font-mono text-gray-400 bg-gray-900 px-3 py-1 rounded-t border-t border-l border-r border-gray-800">
                          {match[1]}
                        </div>
                        <pre className="bg-gray-950 p-3 rounded-b overflow-x-auto text-sm font-mono text-purple-200 border border-gray-800 m-0">
                          <code className={className} {...props}>
                            {children}
                          </code>
                        </pre>
                      </div>
                    ) : (
                      <code
                        className="bg-gray-950/80 text-purple-300 px-1.5 py-0.5 rounded font-mono text-xs border border-gray-800"
                        {...props}
                      >
                        {children}
                      </code>
                    );
                  },
                }}
              >
                {content}
              </Markdown>
            </div>
          )}

          {/* Copy Button on AI messages */}
          {!isUser && (
            <button
              onClick={handleCopy}
              className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 p-1.5 rounded-lg bg-gray-900/80 border border-gray-700 text-gray-400 hover:text-white transition-all"
              title="Copy response"
            >
              {copied ? (
                <Check className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
            </button>
          )}
        </div>

        {/* Timestamp */}
        {formattedTime && (
          <span className="text-[10px] text-gray-400 mt-1 px-1">
            {formattedTime}
          </span>
        )}
      </div>
    </div>
  );
};

export default ChatMessage;
