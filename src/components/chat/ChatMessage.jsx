import React, { useState } from 'react';
import { MarkdownRenderer } from './MarkdownRenderer';
import { useTypingEffect } from './useTypingEffect';
import { ArrowRight, Copy, Check, Sparkles, AlertCircle } from 'lucide-react';

/**
 * Strips markdown symbols for a clean, human-readable clipboard copy.
 */
function stripMarkdown(md) {
  if (!md) return '';
  return md
    .replace(/^#+\s+/gm, '')
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/\*(.*?)\*/g, '$1')
    .replace(/`{1,3}(.*?)`{1,3}/gs, '$1')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/^\s*[-*+]\s+/gm, '• ')
    .replace(/\|[-:\s|]+\|/g, '')
    .replace(/\|/g, ' ')
    .trim();
}

/**
 * ChatMessage renders an individual chat bubble for either the User or the Assistant.
 * For Assistant messages, it provides progressive streaming, Markdown formatting,
 * copy-to-clipboard, and navigation action pills.
 */
export const ChatMessage = ({
  message,
  isLatest = false,
  onActionClick,
  onTypingProgress,
  onTypingComplete
}) => {
  const isUser = message.role === 'user';
  const isError = message.isError;
  const [copied, setCopied] = useState(false);

  // Progressive typing effect for new assistant messages
  const shouldAnimate = !isUser && !isError && message.isNew;
  const { displayedText, isTyping } = useTypingEffect(
    message.content || '',
    shouldAnimate,
    onTypingProgress,
    onTypingComplete
  );

  const handleCopy = async () => {
    try {
      const textToCopy = stripMarkdown(message.content || '');
      await navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy message:', err);
    }
  };

  // User Message Bubble
  if (isUser) {
    return (
      <div className="flex flex-col items-end space-y-1 w-full text-right animate-in fade-in slide-in-from-bottom-2 duration-200">
        <div className="max-w-[85%] sm:max-w-[78%] text-xs sm:text-sm leading-relaxed px-4 py-2.5 rounded-2xl rounded-br-xs bg-[#8D6B94] text-[#FFF4E9] shadow-sm font-medium whitespace-pre-wrap break-words text-left">
          {message.content}
        </div>
      </div>
    );
  }

  // Assistant Error Message
  if (isError) {
    return (
      <div className="flex flex-col items-start space-y-1 w-full text-left animate-in fade-in slide-in-from-bottom-2 duration-200">
        <div className="max-w-[92%] sm:max-w-[85%] p-3.5 rounded-2xl rounded-bl-xs bg-red-50/90 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 shadow-xs space-y-2">
          <div className="flex items-center space-x-2 text-red-700 dark:text-red-300 font-bold text-xs">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>KDL Library Assistant</span>
          </div>
          <div className="text-xs sm:text-sm text-red-800 dark:text-red-200 leading-relaxed">
            <MarkdownRenderer content={message.content} onActionClick={onActionClick} />
          </div>
        </div>
      </div>
    );
  }

  // Standard Assistant Message Card
  return (
    <div className="flex flex-col items-start space-y-2 w-full text-left animate-in fade-in slide-in-from-bottom-2 duration-200">
      <div className="relative group max-w-[94%] sm:max-w-[88%] bg-white dark:bg-[#2B232E] border border-[#E8DBC5]/80 dark:border-[#3B3142] rounded-2xl rounded-bl-xs shadow-xs p-3.5 sm:p-4 transition-all">
        {/* Assistant Header & Copy Action */}
        <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#E8DBC5]/40 dark:border-[#3B3142]/60">
          <div className="flex items-center space-x-2">
            <div className="w-5 h-5 rounded-full bg-[#8D6B94]/15 dark:bg-[#8D6B94]/30 flex items-center justify-center text-[#8D6B94] dark:text-[#D5A8FF]">
              <Sparkles className="w-3 h-3" />
            </div>
            <span className="text-[11px] font-bold text-[#8D6B94] dark:text-[#D5A8FF] tracking-tight">
              KDL Assistant
            </span>
          </div>

          {/* Copy Button */}
          {!isTyping && message.content && (
            <button
              onClick={handleCopy}
              type="button"
              title={copied ? 'Copied to clipboard' : 'Copy response text'}
              aria-label="Copy response text"
              className="flex items-center space-x-1 px-2 py-1 rounded-md text-[10px] font-semibold text-[#7A697E] dark:text-[#C3A29E] hover:text-[#8D6B94] dark:hover:text-[#D5A8FF] hover:bg-[#FFF4E9] dark:hover:bg-[#3B3142] transition-all cursor-pointer"
            >
              {copied ? (
                <>
                  <Check className="w-3 h-3 text-emerald-500 shrink-0" />
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3 shrink-0" />
                  <span className="hidden sm:inline">Copy</span>
                </>
              )}
            </button>
          )}
        </div>

        {/* Formatted Markdown Content */}
        <div className="text-xs sm:text-sm text-[#2B232E] dark:text-[#FFF4E9]">
          <MarkdownRenderer
            content={displayedText}
            onActionClick={onActionClick}
          />
          {isTyping && (
            <span
              className="inline-block w-1.5 h-3.5 ml-1 bg-[#8D6B94] dark:bg-[#D5A8FF] animate-pulse align-middle rounded-xs"
              aria-hidden="true"
            />
          )}
        </div>

        {/* Navigation Action Buttons (Shown after typing finishes or if already finished) */}
        {!isTyping && message.actions && message.actions.length > 0 && (
          <div className="flex flex-wrap gap-2 pt-3 mt-2 border-t border-[#E8DBC5]/40 dark:border-[#3B3142]/60">
            {message.actions.map((act, actIdx) => (
              <button
                key={actIdx}
                type="button"
                onClick={() => onActionClick && onActionClick(act)}
                className="inline-flex items-center text-xs font-bold px-3.5 py-1.5 rounded-full bg-[#8D6B94] hover:bg-[#A37B9F] text-[#FFF4E9] shadow-xs transition-all duration-150 hover:scale-105 active:scale-95 cursor-pointer group"
              >
                <span>{act.label || 'Open Link'}</span>
                <ArrowRight className="w-3.5 h-3.5 ml-1.5 transition-transform group-hover:translate-x-0.5" />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatMessage;
