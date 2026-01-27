"use client";

import React, { useMemo } from 'react';
import dynamic from 'next/dynamic';
import 'easymde/dist/easymde.min.css';
import type { Options } from 'easymde';

const SimpleMDE = dynamic(() => import('react-simplemde-editor'), { ssr: false });

type MarkdownEditorProps = {
  value: string;
  onChange: (value: string) => void;
};

export function MarkdownEditor({ value, onChange }: MarkdownEditorProps) {
  const options = useMemo(() => {
    return {
      autofocus: false,
      spellChecker: false,
      toolbar: [
        "bold", "italic", "strikethrough", "heading", "|", 
        "quote", "unordered-list", "ordered-list", "|", 
        "link", "|", 
        "preview", "side-by-side", "fullscreen"
      ],
      minHeight: "150px",
    } as Options;
  }, []);

  return <SimpleMDE value={value} onChange={onChange} options={options} />;
}
