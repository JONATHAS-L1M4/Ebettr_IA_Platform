import React from 'react';
import { ConfigField } from '../../types';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkBreaks from 'remark-breaks';

interface AnnotationFieldProps {
  field: ConfigField;
}

export const AnnotationField: React.FC<AnnotationFieldProps> = ({ field }) => {
  const content = String(field.defaultValue || field.value || '');

  if (!content) return null;

  return (
      <div className="text-xs text-gray-600 prose prose-sm max-w-none 
                prose-p:my-0.5 
                prose-headings:my-1 
                prose-ul:my-0.5 
                prose-li:my-0 
                break-words">
      <ReactMarkdown remarkPlugins={[remarkGfm, remarkBreaks]}>
        {content}
      </ReactMarkdown>
    </div>
  );
};