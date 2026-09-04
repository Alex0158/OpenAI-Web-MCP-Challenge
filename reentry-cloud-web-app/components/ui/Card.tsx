"use client";

import React from "react";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  padding?: "none" | "normal" | "large";
  hover?: boolean;
}

const paddingClasses = {
  none: "",
  normal: "p-5",
  large: "p-6",
};

export function Card({
  children,
  padding = "normal",
  hover = true,
  className = "",
  ...props
}: CardProps) {
  return (
    <div
      className={`bg-surface rounded-[16px] border border-border ${paddingClasses[padding]} ${
        hover ? "transition-all duration-150 hover:shadow-[var(--shadow-card)] hover:-translate-y-0.5" : ""
      } ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

interface MetricCardProps extends React.HTMLAttributes<HTMLDivElement> {
  label: string;
  value: string | number;
  delta?: { value: string; positive: boolean } | null;
  icon?: React.ReactNode;
}

export function MetricCard({
  label,
  value,
  delta,
  icon,
  className = "",
  ...props
}: MetricCardProps) {
  return (
    <div
      className={`bg-surface rounded-[16px] border border-border p-5 flex flex-col gap-2 transition-all duration-150 hover:shadow-[var(--shadow-card)] hover:-translate-y-0.5 ${className}`}
      {...props}
    >
      <div className="flex items-center gap-3">
        {icon && (
          <div className="w-10 h-10 rounded-lg bg-brand-1/10 flex items-center justify-center text-brand-1">
            {icon}
          </div>
        )}
        <span className="text-[12px] font-semibold uppercase tracking-[0.5px] text-text-muted">
          {label}
        </span>
      </div>
      <div className="flex items-end justify-between">
        <span className="text-[32px] font-bold text-text-primary leading-none tracking-[-1px]">
          {value}
        </span>
        {delta && (
          <span
            className={`text-[13px] font-semibold ${
              delta.positive ? "text-success-text" : "text-error-text"
            }`}
          >
            {delta.value}
          </span>
        )}
      </div>
    </div>
  );
}
