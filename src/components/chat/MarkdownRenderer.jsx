import React, { memo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useNavigate } from 'react-router-dom';
import { ExternalLink, ArrowRight } from 'lucide-react';

// Refined, web-safe editorial serif stack for AI Assistant responses
const SERIF_FONT_STACK = 'ui-serif, Georgia, Cambria, "Times New Roman", Times, serif';
// Clean monospace stack for code blocks
const MONO_FONT_STACK = 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace';

/**
 * MarkdownRenderer converts Markdown strings into clean, elegant,
 * editorial serif typography for CLMS AI Assistant responses,
 * preserving existing UI fonts for the rest of the application.
 */
export const MarkdownRenderer = memo(({ content, onActionClick }) => {
  const navigate = useNavigate();

  if (!content) return null;

  const handleLinkClick = (e, href) => {
    if (!href) return;
    if (href.startsWith('/')) {
      e.preventDefault();
      if (onActionClick) {
        onActionClick({ type: 'navigate', route: href });
      } else {
        navigate(href);
      }
    }
  };

  return (
    <div
      className="markdown-content text-[15px] sm:text-[15.5px] leading-[1.68] sm:leading-[1.72] text-[#2B232E] dark:text-[#FFF4E9] break-words tracking-[0.008em]"
      style={{ fontFamily: SERIF_FONT_STACK }}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ node, ...props }) => (
            <h1
              className="text-[17px] sm:text-[18.5px] font-bold text-[#8D6B94] dark:text-[#D5A8FF] mt-3 mb-1.5 pb-1 border-b border-[#E8DBC5]/60 dark:border-[#3B3142] flex items-center gap-1.5 leading-snug tracking-tight"
              style={{ fontFamily: SERIF_FONT_STACK }}
              {...props}
            />
          ),
          h2: ({ node, ...props }) => (
            <h2
              className="text-[15.5px] sm:text-[17px] font-bold text-[#8D6B94] dark:text-[#D5A8FF] mt-2.5 mb-1 flex items-center gap-1 leading-snug tracking-tight"
              style={{ fontFamily: SERIF_FONT_STACK }}
              {...props}
            />
          ),
          h3: ({ node, ...props }) => (
            <h3
              className="text-[14.5px] sm:text-[15.5px] font-semibold text-[#8D6B94] dark:text-[#D5A8FF] mt-2 mb-1 leading-snug"
              style={{ fontFamily: SERIF_FONT_STACK }}
              {...props}
            />
          ),
          p: ({ node, ...props }) => (
            <p
              className="mb-2.5 last:mb-0 leading-[1.68] sm:leading-[1.72] text-[#2B232E] dark:text-[#FFF4E9]"
              {...props}
            />
          ),
          strong: ({ node, ...props }) => (
            <strong
              className="font-bold text-[#2B232E] dark:text-[#FFF4E9]"
              {...props}
            />
          ),
          em: ({ node, ...props }) => (
            <em
              className="italic text-[#4A3B4D] dark:text-[#E8DBC5]"
              {...props}
            />
          ),
          ul: ({ node, ...props }) => (
            <ul
              className="list-disc pl-4 sm:pl-5 my-2 space-y-1.5 text-[15px] sm:text-[15.5px] leading-[1.68] marker:text-[#8D6B94] dark:marker:text-[#D5A8FF]"
              {...props}
            />
          ),
          ol: ({ node, ...props }) => (
            <ol
              className="list-decimal pl-4 sm:pl-5 my-2 space-y-1.5 text-[15px] sm:text-[15.5px] leading-[1.68] marker:text-[#8D6B94] dark:marker:text-[#D5A8FF] font-medium"
              {...props}
            />
          ),
          li: ({ node, ...props }) => (
            <li
              className="text-[#2B232E] dark:text-[#FFF4E9] pl-0.5 leading-[1.68]"
              {...props}
            />
          ),
          blockquote: ({ node, ...props }) => (
            <blockquote
              className="border-l-3 border-[#8D6B94] dark:border-[#D5A8FF] pl-3 py-1.5 my-2.5 bg-[#8D6B94]/5 dark:bg-[#8D6B94]/10 rounded-r-lg italic text-[14.5px] sm:text-[15px] text-[#7A697E] dark:text-[#C3A29E] leading-[1.65]"
              {...props}
            />
          ),
          hr: () => (
            <hr className="my-2.5 border-t border-[#E8DBC5] dark:border-[#3B3142]" />
          ),
          table: ({ node, ...props }) => (
            <div className="overflow-x-auto my-2.5 max-w-full rounded-xl border border-[#E8DBC5] dark:border-[#3B3142] shadow-2xs">
              <table
                className="w-full text-left text-[13.5px] sm:text-[14.5px] border-collapse min-w-[280px] leading-normal"
                style={{ fontFamily: SERIF_FONT_STACK }}
                {...props}
              />
            </div>
          ),
          thead: ({ node, ...props }) => (
            <thead
              className="bg-[#8D6B94]/10 dark:bg-[#8D6B94]/25 text-[#8D6B94] dark:text-[#D5A8FF] font-bold text-[12px] sm:text-[13px] uppercase tracking-wider"
              {...props}
            />
          ),
          th: ({ node, ...props }) => (
            <th
              className="px-3.5 py-2 font-bold border-b border-[#E8DBC5] dark:border-[#3B3142] text-[12px] sm:text-[13px]"
              {...props}
            />
          ),
          td: ({ node, ...props }) => (
            <td
              className="px-3.5 py-2.5 border-b border-[#E8DBC5]/40 dark:border-[#3B3142]/40 text-[#2B232E] dark:text-[#FFF4E9] last:border-b-0 leading-[1.6]"
              {...props}
            />
          ),
          tr: ({ node, ...props }) => (
            <tr
              className="hover:bg-[#FFF4E9]/50 dark:hover:bg-[#3B3142]/30 transition-colors"
              {...props}
            />
          ),
          code: ({ node, inline, className, children, ...props }) => {
            const isInline = !className && typeof children === 'string' && !children.includes('\n');
            if (isInline) {
              return (
                <code
                  style={{ fontFamily: MONO_FONT_STACK }}
                  className="px-1.5 py-0.5 rounded text-[12px] bg-[#8D6B94]/10 dark:bg-[#D5A8FF]/15 text-[#8D6B94] dark:text-[#D5A8FF] border border-[#8D6B94]/20 dark:border-[#D5A8FF]/25 font-semibold inline-block not-italic leading-none align-baseline mx-0.5"
                  {...props}
                >
                  {children}
                </code>
              );
            }
            return (
              <pre
                style={{ fontFamily: MONO_FONT_STACK }}
                className="my-2.5 rounded-xl overflow-x-auto bg-[#24202A] text-[#FFF7F0] p-3 text-xs border border-[#3B3142] leading-relaxed"
              >
                <code style={{ fontFamily: MONO_FONT_STACK }} className={className} {...props}>
                  {children}
                </code>
              </pre>
            );
          },
          a: ({ node, href, children, ...props }) => {
            const isInternal = href && href.startsWith('/');
            if (isInternal) {
              return (
                <button
                  type="button"
                  onClick={(e) => handleLinkClick(e, href)}
                  className="inline-flex items-center gap-1 font-semibold text-[#8D6B94] dark:text-[#D5A8FF] hover:underline underline-offset-2 cursor-pointer transition-colors"
                >
                  <span>{children}</span>
                  <ArrowRight className="w-3 h-3 inline-block shrink-0" />
                </button>
              );
            }
            return (
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 font-medium text-[#8D6B94] dark:text-[#D5A8FF] hover:underline underline-offset-2"
                {...props}
              >
                <span>{children}</span>
                <ExternalLink className="w-3 h-3 inline-block shrink-0 opacity-70" />
              </a>
            );
          }
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
});

MarkdownRenderer.displayName = 'MarkdownRenderer';
export default MarkdownRenderer;
