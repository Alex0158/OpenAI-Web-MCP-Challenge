"use client";

interface LogoProps {
  className?: string;
}

export function Logo({ className = "" }: LogoProps) {
  return (
    <svg
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="Application logo"
    >
      <rect width="40" height="40" rx="12" fill="#9fe870" />
      <path
        d="M12 20C12 15.5817 15.5817 12 20 12V12C24.4183 12 28 15.5817 28 20V20C28 24.4183 24.4183 28 20 28V28C15.5817 28 12 24.4183 12 20V20Z"
        stroke="#163300"
        strokeWidth="2.5"
      />
      <path
        d="M17 20L19.5 22.5L24 17.5"
        stroke="#163300"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="30" cy="14" r="4" fill="#163300" />
      <path
        d="M28.5 14L29.75 15.25L32.25 12.75"
        stroke="#9fe870"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
