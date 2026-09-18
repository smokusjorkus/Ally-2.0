import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkBreaks from 'remark-breaks';
import remarkGfm from 'remark-gfm';

const isSafeExternalUrl = (href) => /^https?:\/\//i.test(href || '');

const markdownComponents = {
  p: ({ children }) => <p className="my-3 whitespace-pre-line leading-7">{children}</p>,
  ul: ({ children }) => <ul className="my-3 list-disc space-y-2 pl-5">{children}</ul>,
  ol: ({ children }) => <ol className="my-3 list-decimal space-y-2 pl-5">{children}</ol>,
  li: ({ children }) => <li className="leading-7">{children}</li>,
  h1: ({ children }) => <h1 className="mb-2 mt-4 text-xl font-semibold">{children}</h1>,
  h2: ({ children }) => <h2 className="mb-2 mt-4 text-lg font-semibold">{children}</h2>,
  h3: ({ children }) => <h3 className="mb-2 mt-3 text-base font-semibold">{children}</h3>,
  a: ({ href, children }) => {
    if (!isSafeExternalUrl(href)) {
      return <span>{children}</span>;
    }

    return (
      <a
        href={href}
        target="_blank"
        rel="noreferrer"
        className="font-medium underline underline-offset-2"
      >
        {children}
      </a>
    );
  },
  table: ({ children }) => (
    <div className="my-3 overflow-x-auto">
      <table className="min-w-full border-collapse text-left text-sm">{children}</table>
    </div>
  ),
  thead: ({ children }) => <thead className="bg-black/10">{children}</thead>,
  th: ({ children }) => (
    <th className="border-b-2 border-black/30 px-3 py-2 font-semibold">{children}</th>
  ),
  tr: ({ children }) => <tr className="even:bg-black/[0.03]">{children}</tr>,
  td: ({ children }) => <td className="border-b border-black/20 px-3 py-2 align-top">{children}</td>,
  code: ({ children }) => (
    <code className="rounded bg-black/10 px-1 py-0.5 font-mono text-[0.95em]">{children}</code>
  ),
};

const MarkdownText = ({ text, className = '' }) => {
  // Some model responses escape table delimiters as "\\|". Unescape those
  // delimiters so remark-gfm can recognize the table structure.
  const normalizedText = String(text || '').replace(/\\\|/g, '|');

  return (
    <div className={className}>
      <ReactMarkdown remarkPlugins={[remarkGfm, remarkBreaks]} components={markdownComponents}>
        {normalizedText}
      </ReactMarkdown>
    </div>
  );
};

export default MarkdownText;
