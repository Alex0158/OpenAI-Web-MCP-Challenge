"use client";

import { useTheme } from "@/lib/ThemeContext";
import { FiSun, FiMoon } from "react-icons/fi";
import { useEffect, useState } from "react";

export default function ThemeToggle({
  className = "",
  iconClassName = "",
}: {
  className?: string;
  iconClassName?: string;
}) {
  const { theme, toggleTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    queueMicrotask(() => setMounted(true));
  }, []);

  // Prevent hydration mismatch
  if (!mounted) {
    return <div className="w-10 h-10 rounded-full" />;
  }

  const isDark = theme === "dark";

  return (
    <button
      onClick={toggleTheme}
      className={`flex h-10 w-10 items-center justify-center rounded-full transition-all duration-200 hover:bg-surface-secondary ${className}`}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      title={isDark ? "Light mode" : "Dark mode"}
    >
      {isDark ? (
        <FiMoon className={`h-5 w-5 text-text-secondary ${iconClassName}`} />
      ) : (
        <FiSun className={`h-5 w-5 text-text-secondary ${iconClassName}`} />
      )}
    </button>
  );
}
