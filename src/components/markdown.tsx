"use client";

import ReactMarkdown from "react-markdown";

function autoLinkUrls(text: string): string {
  // Convert raw URLs to markdown links, but skip URLs already in markdown link syntax
  return text.replace(
    /(?<!\]\()(?<!\()(https?:\/\/[^\s\)<>]+)/g,
    (url) => `[${url}](${url})`
  );
}

export function Markdown({ content, className = "" }: { content: string; className?: string }) {
  return (
    <div className={className}>
    <ReactMarkdown
      components={{
        a: ({ href, children }) => (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-400 hover:text-blue-300 underline"
          >
            {children}
          </a>
        ),
        strong: ({ children }) => <strong className="text-white font-semibold">{children}</strong>,
        h1: ({ children }) => <h1 className="text-xl font-bold text-white mt-4 mb-2">{children}</h1>,
        h2: ({ children }) => <h2 className="text-lg font-bold text-white mt-4 mb-2">{children}</h2>,
        h3: ({ children }) => <h3 className="text-base font-bold text-white mt-3 mb-1">{children}</h3>,
        p: ({ children }) => <p className="mb-3">{children}</p>,
        ul: ({ children }) => <ul className="list-disc list-inside mb-3 space-y-1">{children}</ul>,
        ol: ({ children }) => <ol className="list-decimal list-inside mb-3 space-y-1">{children}</ol>,
        li: ({ children }) => <li>{children}</li>,
        hr: () => <hr className="border-slate-700 my-4" />,
      }}
    >
      {autoLinkUrls(content)}
    </ReactMarkdown>
    </div>
  );
}
