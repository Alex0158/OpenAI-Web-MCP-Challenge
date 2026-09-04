"use client";

import React from "react";

interface StatCardProps {
  icon?: React.ReactNode;
  label: string;
  value: string | number;
  sub?: string;
  trend?: "up" | "down" | "neutral";
  onClick?: () => void;
  variant?: "solid" | "glass";
}

export function StatCard({ icon, label, value, sub, trend, onClick, variant = "solid" }: StatCardProps) {
  const Wrapper = onClick ? "button" : "div";
  const bgClass = variant === "glass" ? "glass" : "bg-surface";

  return (
    <Wrapper
      onClick={onClick}
      className={`${bgClass} rounded-[16px] border border-border p-5 text-left transition-all duration-150 hover:shadow-[var(--shadow-card)] hover:-translate-y-0.5 ${
        onClick ? "cursor-pointer" : ""
      }`}
    >
      <div className="flex items-center gap-3 mb-3">
        {icon && (
          <div className="w-10 h-10 rounded-lg bg-brand-1/10 flex items-center justify-center text-brand-1">
            {icon}
          </div>
        )}
        <span className="text-[12px] font-semibold uppercase tracking-[0.5px] text-text-muted">
          {label}
        </span>
        {trend && (
          <span
            className={`text-[11px] font-semibold ${
              trend === "up"
                ? "text-success-text"
                : trend === "down"
                ? "text-error-text"
                : "text-text-muted"
            }`}
          >
            {trend === "up" ? "↑" : trend === "down" ? "↓" : "—"}
          </span>
        )}
      </div>
      <div className="flex items-baseline gap-2">
        <span className="text-[32px] font-bold text-text-primary leading-none tracking-[-1px]">
          {value}
        </span>
        {sub && <span className="text-[13px] text-text-muted">{sub}</span>}
      </div>
    </Wrapper>
  );
}
