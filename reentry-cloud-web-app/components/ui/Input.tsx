"use client";

import React from "react";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className = "", error, ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={`w-full text-[15px] font-normal text-text-primary bg-surface border rounded-[10px] px-3.5 py-2.5 outline-none transition-all duration-150 placeholder:text-text-muted hover:border-border-secondary focus:border-brand-1 focus:ring-2 focus:ring-brand-1/20 ${
          error
            ? "border-error-text focus:border-error-text focus:ring-error-text/20"
            : "border-border-secondary"
        } ${className}`}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  error?: boolean;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className = "", error, children, ...props }, ref) => {
    return (
      <div className="relative">
        <select
          ref={ref}
          className={`w-full appearance-none text-[15px] font-normal text-text-primary bg-surface border rounded-[10px] px-3.5 py-2.5 pr-10 outline-none transition-all duration-150 hover:border-border-secondary focus:border-brand-1 focus:ring-2 focus:ring-brand-1/20 ${
            error
              ? "border-error-text focus:border-error-text focus:ring-error-text/20"
              : "border-border-secondary"
          } ${className}`}
          {...props}
        >
          {children}
        </select>
        <svg
          className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>
    );
  }
);
Select.displayName = "Select";

interface TextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean;
}

export const TextArea = React.forwardRef<HTMLTextAreaElement, TextAreaProps>(
  ({ className = "", error, ...props }, ref) => {
    return (
      <textarea
        ref={ref}
        className={`w-full text-[15px] font-normal text-text-primary bg-surface border rounded-[10px] px-3.5 py-2.5 outline-none transition-all duration-150 placeholder:text-text-muted hover:border-border-secondary focus:border-brand-1 focus:ring-2 focus:ring-brand-1/20 resize-none ${
          error
            ? "border-error-text focus:border-error-text focus:ring-error-text/20"
            : "border-border-secondary"
        } ${className}`}
        {...props}
      />
    );
  }
);
TextArea.displayName = "TextArea";
