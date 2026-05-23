import React from 'react';

const inlinePatterns = /(\*\*\*[^*]+\*\*\*|\*\*[^*]+\*\*|__[^_]+__|\*[^*]+\*|_[^_]+_|`[^`]+`|\[[^\]]+\]\([^)]+\))/g;

const renderInline = (text) => {
  if (!text) return null;

  return text.split(inlinePatterns).filter(Boolean).map((part, index) => {
    if (part.startsWith('***') && part.endsWith('***')) {
      return (
        <strong key={index}>
          <em>{part.slice(3, -3)}</em>
        </strong>
      );
    }

    if ((part.startsWith('**') && part.endsWith('**')) || (part.startsWith('__') && part.endsWith('__'))) {
      return <strong key={index}>{part.slice(2, -2)}</strong>;
    }

    if ((part.startsWith('*') && part.endsWith('*')) || (part.startsWith('_') && part.endsWith('_'))) {
      return <em key={index}>{part.slice(1, -1)}</em>;
    }

    if (part.startsWith('`') && part.endsWith('`')) {
      return (
        <code key={index} className="rounded bg-black/10 px-1 py-0.5 font-mono text-[0.95em]">
          {part.slice(1, -1)}
        </code>
      );
    }

    const linkMatch = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
    if (linkMatch) {
      const [, label, href] = linkMatch;
      const isSafeLink = /^https?:\/\//i.test(href);

      return isSafeLink ? (
        <a
          key={index}
          href={href}
          target="_blank"
          rel="noreferrer"
          className="font-medium underline underline-offset-2"
        >
          {label}
        </a>
      ) : (
        <span key={index}>{label}</span>
      );
    }

    return <React.Fragment key={index}>{part}</React.Fragment>;
  });
};

const MarkdownText = ({ text, className = '' }) => {
  const lines = String(text || '').split(/\r?\n/);
  const blocks = [];
  let listItems = [];

  const flushList = () => {
    if (listItems.length === 0) return;
    blocks.push(
      <ul key={`list-${blocks.length}`} className="my-2 list-disc space-y-1 pl-5">
        {listItems.map((item, index) => (
          <li key={index}>{renderInline(item)}</li>
        ))}
      </ul>
    );
    listItems = [];
  };

  lines.forEach((line, index) => {
    const trimmed = line.trim();

    if (!trimmed) {
      flushList();
      blocks.push(<div key={`space-${index}`} className="h-2" />);
      return;
    }

    const bulletMatch = trimmed.match(/^[-*]\s+(.+)$/);
    if (bulletMatch) {
      listItems.push(bulletMatch[1]);
      return;
    }

    flushList();

    if (trimmed.startsWith('### ')) {
      blocks.push(
        <h3 key={index} className="mb-1 mt-2 text-base font-semibold">
          {renderInline(trimmed.slice(4))}
        </h3>
      );
      return;
    }

    if (trimmed.startsWith('## ')) {
      blocks.push(
        <h2 key={index} className="mb-1 mt-2 text-lg font-semibold">
          {renderInline(trimmed.slice(3))}
        </h2>
      );
      return;
    }

    if (trimmed.startsWith('# ')) {
      blocks.push(
        <h1 key={index} className="mb-1 mt-2 text-xl font-semibold">
          {renderInline(trimmed.slice(2))}
        </h1>
      );
      return;
    }

    blocks.push(
      <p key={index} className="my-1">
        {renderInline(line)}
      </p>
    );
  });

  flushList();

  return <div className={className}>{blocks}</div>;
};

export default MarkdownText;
