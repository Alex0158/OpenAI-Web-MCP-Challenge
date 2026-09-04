"use client";

import React from "react";

interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  action?: React.ReactNode;
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-16 px-6 gap-4">
      <div className="w-14 h-14 rounded-[16px] bg-brand-mint flex items-center justify-center text-brand-2 text-2xl">
        {icon}
      </div>
      <h3 className="text-[22px] font-bold text-text-primary tracking-[-0.3px]">{title}</h3>
      <p className="text-[15px] text-text-muted max-w-sm leading-relaxed">{description}</p>
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
