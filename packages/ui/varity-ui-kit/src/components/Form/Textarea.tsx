'use client';

import React, { type TextareaHTMLAttributes } from 'react';

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

const baseInput =
  'block w-full rounded-lg border px-3 py-2 text-sm transition-colors focus:outline-none focus:ring-1';
const normalInput =
  'border-gray-300 focus:border-primary-500 focus:ring-primary-500';
const errorInput =
  'border-red-300 text-red-900 placeholder-red-300 focus:border-red-500 focus:ring-red-500';

export function Textarea({ label, error, id, className = '', ...props }: TextareaProps) {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');

  return (
    <div>
      {label && (
        <label htmlFor={inputId} className="mb-1 block text-sm font-medium text-gray-700">
          {label}
        </label>
      )}
      <textarea
        id={inputId}
        className={`${baseInput} ${error ? errorInput : normalInput} ${className}`}
        aria-invalid={error ? 'true' : undefined}
        {...props}
      />
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
}
