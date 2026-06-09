"use client"

import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { cn } from '@/lib/utils';

type MarkdownRendererProps = {
  children: string;
  className?: string;
};

export function MarkdownRenderer({ children, className }: MarkdownRendererProps) {
  if (!children) return <p className="text-sm text-muted-foreground leading-relaxed">N/A</p>;
  
  return (
    <ReactMarkdown
      className={cn("prose prose-sm dark:prose-invert max-w-none text-sm text-muted-foreground", className)}
      remarkPlugins={[remarkGfm]}
      components={{
        ul: ({ node, ...props }) => <ul className="list-disc list-inside space-y-1 mt-2" {...props} />,
        ol: ({ node, ...props }) => <ol className="list-decimal list-inside space-y-1 mt-2" {...props} />,
        li: ({ node, ...props }) => <li className="leading-relaxed" {...props} />,
        p: ({ node, ...props }) => <p className="leading-relaxed my-2" {...props} />,
        strong: ({node, ...props}) => <strong className="font-semibold text-foreground" {...props} />,
        h1: ({node, ...props}) => <h1 className="text-xl font-semibold text-foreground mt-4 mb-2" {...props} />,
        h2: ({node, ...props}) => <h2 className="text-lg font-semibold text-foreground mt-3 mb-1" {...props} />,
        h3: ({node, ...props}) => <h3 className="text-base font-semibold text-foreground mt-2 mb-1" {...props} />,
        a: ({node, ...props}) => <a className="text-primary hover:underline" {...props} />,
        blockquote: ({ node, ...props }) => <blockquote className="border-l-4 border-muted pl-4 italic my-4 text-muted-foreground" {...props} />,
        del: ({ node, ...props }) => <del className="line-through opacity-70" {...props} />,
      }}
    >
      {children}
    </ReactMarkdown>
  );
}
