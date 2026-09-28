import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { chatApi } from '../../api/chatApi';
import { ChatMessage } from './ChatMessage';
import {
  Sparkles,
  Send,
  X,
  RotateCcw,
  ArrowRight
} from 'lucide-react';

const SUGGESTIONS = {
  PUBLIC: [
    'Find Core Java books',
    'How many seats are available at KIET 2?',
    'What are the library operating hours?',
    'How do I log in as a student?'
  ],
  STUDENT: [
    'What books do I currently have?',
    'When are my borrowed books due?',
    'Check my outstanding fines',
    'Which libraries can I access?'
  ],
  FACULTY: [
    'What books do I currently have?',
    'Which libraries can faculty use?',
    'Search Python machine learning books',
    'Show me the library operating hours'
  ],
  LIBRARIAN: [
    'How many copies are available in inventory?',
    'Where do I register a new student?',
    'Find book with Book ID',
    'Open the Issue Book terminal'
  ],
  ADMIN: [
    'Show operational inventory summary',
    'Where can I manage library branches?',
    'Open Master Books Catalog',
    'Check KIET seat occupancy'
  ]
};

export const ChatbotWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isWaitingForResponse, setIsWaitingForResponse] = useState(false);
  const [isTypingInProgress, setIsTypingInProgress] = useState(false);

  const { user, role } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const scrollContainerRef = useRef(null);
  const userScrolledUpRef = useRef(false);
  const inputRef = useRef(null);

  const userRole = role || 'PUBLIC';
  const roleSuggestions = SUGGESTIONS[userRole] || SUGGESTIONS.PUBLIC;

  // Track user manual scroll
  const handleScroll = () => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const distanceToBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    userScrolledUpRef.current = distanceToBottom > 60;
  };

  // Scroll to bottom helper
  const scrollToBottom = useCallback((smooth = true) => {
    if (userScrolledUpRef.current) return;
    const el = scrollContainerRef.current;
    if (el) {
      el.scrollTo({
        top: el.scrollHeight,
        behavior: smooth ? 'smooth' : 'auto'
      });
    }
  }, []);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 150);
      userScrolledUpRef.current = false;
      scrollToBottom(false);
    }
  }, [isOpen, scrollToBottom]);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const handleSend = async (textToSend = null) => {
    const messageContent = (textToSend || input).trim();
    if (!messageContent || isWaitingForResponse || isTypingInProgress) return;

    setInput('');
    userScrolledUpRef.current = false;

    const newHistory = [
      ...messages.map((m) => ({ ...m, isNew: false })),
      { role: 'user', content: messageContent }
    ];
    setMessages(newHistory);
    setIsWaitingForResponse(true);

    setTimeout(() => scrollToBottom(true), 40);

    try {
      // Send last 6 messages as bounded conversation context
      const formattedHistory = newHistory.slice(-6).map((m) => ({
        role: m.role,
        content: m.content
      }));

      const res = await chatApi.sendMessage({
        message: messageContent,
        conversationHistory: formattedHistory,
        currentRoute: location.pathname
      });

      const responseData = res?.data || res;
      const botMessage = {
        role: 'assistant',
        content: responseData?.message || 'I have processed your inquiry.',
        actions: responseData?.actions || [],
        isNew: true,
        isError: false
      };

      setIsTypingInProgress(true);
      setMessages((prev) => [...prev, botMessage]);
    } catch (err) {
      console.error('Chatbot error:', err);
      // Clean, user-friendly error response without exposing internal stack traces or secrets
      const errorBotMessage = {
        role: 'assistant',
        content:
          "**I couldn't retrieve that information right now.**\n\nPlease try again shortly, or use the navigation options.",
        actions: [],
        isNew: true,
        isError: true
      };
      setMessages((prev) => [...prev, errorBotMessage]);
    } finally {
      setIsWaitingForResponse(false);
    }
  };

  const handleTypingProgress = () => {
    if (!userScrolledUpRef.current) {
      const el = scrollContainerRef.current;
      if (el) {
        el.scrollTop = el.scrollHeight;
      }
    }
  };

  const handleTypingComplete = () => {
    setIsTypingInProgress(false);
    setMessages((prev) =>
      prev.map((msg, idx) => (idx === prev.length - 1 ? { ...msg, isNew: false } : msg))
    );
  };

  const handleClearChat = () => {
    setMessages([]);
    setIsWaitingForResponse(false);
    setIsTypingInProgress(false);
  };

  const handleActionClick = (action) => {
    if (action.type === 'navigate' && action.route) {
      navigate(action.route);
      // On mobile viewports, minimize chat modal upon navigating
      if (window.innerWidth < 640) {
        setIsOpen(false);
      }
    }
  };

  const isInputDisabled = isWaitingForResponse || isTypingInProgress;

  return (
    <>
      {/* Floating Toggle Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-5 right-5 sm:bottom-6 sm:right-6 z-50 flex items-center space-x-2.5 px-4 py-3 sm:py-3.5 rounded-full bg-[#8D6B94] hover:bg-[#A37B9F] text-[#FFF4E9] shadow-xl shadow-[#8D6B94]/35 transition-all duration-300 hover:scale-105 active:scale-95 border border-[#B185A7]/40 cursor-pointer group"
          aria-label="Open KDL Library Assistant"
        >
          <div className="relative flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-[#FFF4E9] animate-pulse" />
            <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-[#E8DBC5]" />
          </div>
          <span className="text-xs sm:text-sm font-bold tracking-tight pr-1">
            KDL Assistant
          </span>
        </button>
      )}

      {/* Floating Chat Modal / Panel */}
      {isOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="kdl-chat-title"
          className="fixed bottom-0 right-0 sm:bottom-6 sm:right-6 z-50 w-full sm:w-[440px] max-w-full h-[100dvh] sm:h-[640px] max-h-[100dvh] sm:max-h-[88vh] flex flex-col bg-[#FFF4E9] dark:bg-[#1E1922] sm:rounded-3xl shadow-2xl border border-[#E8DBC5] dark:border-[#3B3142] overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        >
          {/* Header */}
          <div className="relative shrink-0 flex items-center justify-between px-5 py-4 bg-[#8D6B94] text-[#FFF4E9] shadow-xs">
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center p-0.5 border border-white/30 shrink-0">
                <img
                  src="/clms-logo.png"
                  alt="KDL"
                  className="w-full h-full rounded-full object-cover"
                />
              </div>
              <div>
                <h3 id="kdl-chat-title" className="text-sm font-extrabold tracking-tight leading-none text-white">
                  KDL Library Assistant
                </h3>
                <span className="text-[10px] text-[#E8DBC5] font-semibold flex items-center mt-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mr-1.5 animate-pulse" />
                  KIET Digital Library AI &bull; {userRole}
                </span>
              </div>
            </div>

            <div className="flex items-center space-x-1">
              <button
                onClick={handleClearChat}
                title="Clear Conversation"
                className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/15 transition-colors cursor-pointer"
                aria-label="Clear chat history"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                title="Close Assistant"
                className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/15 transition-colors cursor-pointer"
                aria-label="Close assistant panel"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Conversation Area */}
          <div
            ref={scrollContainerRef}
            onScroll={handleScroll}
            role="log"
            aria-live="polite"
            className="flex-1 overflow-y-auto px-4 py-4 space-y-3.5 bg-gradient-to-b from-[#FFF4E9] to-white/60 dark:from-[#1E1922] dark:to-[#261E2B]"
          >
            {/* Welcome message when conversation is empty */}
            {messages.length === 0 && (
              <div className="space-y-4 py-3">
                <div className="p-4 rounded-2xl bg-white/90 dark:bg-[#2B232E]/90 border border-[#E8DBC5] dark:border-[#3B3142] shadow-xs text-left space-y-2">
                  <p className="text-xs sm:text-sm font-semibold text-[#2B232E] dark:text-[#FFF4E9]">
                    Hello, {user?.username || 'Guest'}! 👋 I am your official KDL AI Assistant.
                  </p>
                  <p className="text-xs text-[#7A697E] dark:text-[#C3A29E] leading-relaxed">
                    I can help you search books, verify live seat availability, check due dates and fines, explain campus library policies, and navigate the CLMS portal.
                  </p>
                </div>

                <div className="space-y-1.5 text-left">
                  <span className="text-[11px] font-bold text-[#8D6B94] dark:text-[#D5A8FF] uppercase tracking-wider px-1">
                    Suggested Questions
                  </span>
                  <div className="flex flex-col gap-1.5">
                    {roleSuggestions.map((promptText, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleSend(promptText)}
                        disabled={isInputDisabled}
                        className="text-left text-xs px-3.5 py-2.5 rounded-xl bg-white hover:bg-[#E8DBC5]/50 dark:bg-[#2B232E] dark:hover:bg-[#3B3142] text-[#2B232E] dark:text-[#FFF4E9] border border-[#E8DBC5]/80 dark:border-[#3B3142] shadow-2xs transition-all hover:scale-[1.01] active:scale-98 flex items-center justify-between group cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <span className="truncate pr-2">{promptText}</span>
                        <ArrowRight className="w-3.5 h-3.5 text-[#8D6B94] dark:text-[#D5A8FF] opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Render Messages */}
            {messages.map((msg, idx) => (
              <ChatMessage
                key={idx}
                message={msg}
                isLatest={idx === messages.length - 1}
                onActionClick={handleActionClick}
                onTypingProgress={handleTypingProgress}
                onTypingComplete={handleTypingComplete}
              />
            ))}

            {/* Subtle Typing / Awaiting Backend Indicator */}
            {isWaitingForResponse && (
              <div className="flex items-center space-x-2 text-left animate-in fade-in duration-200">
                <div className="bg-white dark:bg-[#2B232E] border border-[#E8DBC5] dark:border-[#3B3142] px-3.5 py-2.5 rounded-2xl rounded-bl-xs shadow-xs flex items-center space-x-2">
                  <div className="w-2 h-2 rounded-full bg-[#8D6B94] dark:bg-[#D5A8FF] animate-bounce [animation-delay:-0.3s]" />
                  <div className="w-2 h-2 rounded-full bg-[#8D6B94] dark:bg-[#D5A8FF] animate-bounce [animation-delay:-0.15s]" />
                  <div className="w-2 h-2 rounded-full bg-[#8D6B94] dark:bg-[#D5A8FF] animate-bounce" />
                  <span className="text-[11px] text-[#7A697E] dark:text-[#C3A29E] font-medium pl-1">
                    KDL Assistant is thinking...
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Input Box Footer */}
          <div className="shrink-0 p-3 sm:p-4 bg-white dark:bg-[#251E27] border-t border-[#E8DBC5]/80 dark:border-[#3B3142] space-y-2">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="flex items-center space-x-2"
            >
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={
                  isInputDisabled
                    ? 'KDL Assistant is responding...'
                    : 'Ask about books, seats, rules, loans...'
                }
                disabled={isInputDisabled}
                maxLength={1000}
                className="flex-1 h-11 px-4 text-xs sm:text-sm rounded-full bg-[#FFF4E9] dark:bg-[#1E1922] text-[#2B232E] dark:text-[#FFF4E9] border border-[#E8DBC5] dark:border-[#3B3142] focus:outline-none focus:ring-2 focus:ring-[#8D6B94] dark:focus:ring-[#D5A8FF] placeholder:text-[#7A697E]/70 dark:placeholder:text-[#C3A29E]/60 transition-all disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={!input.trim() || isInputDisabled}
                className="w-11 h-11 rounded-full bg-[#8D6B94] hover:bg-[#A37B9F] disabled:opacity-40 disabled:cursor-not-allowed text-[#FFF4E9] flex items-center justify-center shadow-md transition-all active:scale-95 cursor-pointer shrink-0"
                aria-label="Send message"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
            <div className="text-[10px] text-[#7A697E] dark:text-[#C3A29E]/80 text-center select-none">
              KDL Assistant queries authorized live CLMS records.
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ChatbotWidget;
