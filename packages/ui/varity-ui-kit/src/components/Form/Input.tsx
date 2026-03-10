'use client';

import React, { type InputHTMLAttributes } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

const baseInput =
  'block w-full rounded-lg border px-3 py-2 text-sm transition-colors focus:outline-none focus:ring-1';
const normalInput =
  'border-gray-300 focus:border-primary-500 focus:ring-primary-500';
const errorInput =
  'border-red-300 text-red-900 placeholder-red-300 focus:border-red-500 focus:ring-red-500';

export function Input({ label, error, hint, id, className = '', ...props }: InputProps) {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');

  return (
    <div>
      {label && (
        <label
          htmlFor={inputId}
          className="mb-1 block text-sm font-medium text-gray-700"
        >
          {label}
          {props.required && <span className="ml-0.5 text-red-500">*</span>}
        </label>
      )}
      <input
        id={inputId}
        className={`${baseInput} ${error ? errorInput : normalInput} ${className}`}
        aria-invalid={error ? 'true' : undefined}
        aria-describedby={error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined}
        {...props}
      />
      {error && (
        <p id={`${inputId}-error`} className="mt-1 text-sm text-red-600">
          {error}
        </p>
      )}
      {hint && !error && (
        <p id={`${inputId}-hint`} className="mt-1 text-sm text-gray-500">
          {hint}
        </p>
      )}
    </div>
  );
}
