"use client";

import React from "react";

interface TableProps {
  children: React.ReactNode;
  className?: string;
}

export function Table({ children, className = "" }: TableProps) {
  return (
    <div className={`border border-border rounded-[24px] overflow-hidden bg-surface ${className}`}>
      <table className="w-full border-collapse text-[15px]">{children}</table>
    </div>
  );
}

export function Thead({ children }: { children: React.ReactNode }) {
  return (
    <thead className="bg-background-secondary border-b border-border">
      <tr>{children}</tr>
    </thead>
  );
}

export function Th({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <th
      className={`px-4 py-3 text-left text-[12px] font-semibold text-text-muted uppercase tracking-[0.5px] ${className}`}
    >
      {children}
    </th>
  );
}

export function Tbody({ children }: { children: React.ReactNode }) {
  return <tbody className="divide-y divide-border">{children}</tbody>;
}

export function Tr({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <tr className={`transition-colors duration-100 hover:bg-background-secondary/50 ${className}`}>
      {children}
    </tr>
  );
}

export function Td({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <td className={`px-4 py-3.5 text-text-primary align-middle ${className}`}>{children}</td>;
}
