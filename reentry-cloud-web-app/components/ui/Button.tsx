"use client";

import React from "react";

type ButtonVariant = "primary" | "secondary" | "danger" | "ghost" | "icon";
type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  children: React.ReactNode;
  isLoading?: boolean;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-brand-1 text-brand-2 hover:bg-brand-pastel",
  secondary:
    "bg-transparent text-text-primary border border-border hover:border-border-secondary hover:bg-surface-secondary",
  danger:
    "bg-error-bg text-error-text border border-error-border hover:bg-error-bg/80",
  ghost:
    "bg-transparent text-text-secondary hover:text-text-primary hover:bg-surface-secondary",
  icon:
    "w-9 h-9 p-0 rounded-full bg-transparent border border-border text-text-secondary hover:bg-surface-secondary hover:text-text-primary",
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "text-[13px] px-3.5 py-1.5 gap-1.5",
  md: "text-[15px] px-5 py-2.5 gap-2",
  lg: "text-[17px] px-6 py-3 gap-2",
};

export function Button({
  variant = "primary",
  size = "md",
  children,
  className = "",
  disabled,
  isLoading,
  ...props
}: ButtonProps) {
  const isIcon = variant === "icon";
  const base =
    "inline-flex items-center justify-center font-semibold rounded-full transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-brand-1/40";
  const scale = isIcon ? "active:scale-95 hover:scale-105" : "hover:scale-[1.04] active:scale-[0.96]";
  const opacity = disabled || isLoading ? "opacity-60 cursor-not-allowed" : "";
  const sizing = isIcon ? "" : sizeClasses[size];

  return (
    <button
      className={`${base} ${scale} ${variantClasses[variant]} ${sizing} ${opacity} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading && (
        <span className="inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
      )}
      {children}
    </button>
  );
}
