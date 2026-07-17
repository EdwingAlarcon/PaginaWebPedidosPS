"use client";

import { useLayoutEffect, useState } from "react";

const STORAGE_KEY = "purpleshop.theme";

type Theme = "light" | "dark";

function readInitialTheme(): Theme {
  if (typeof window === "undefined") return "light";
  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (stored === "light" || stored === "dark") return stored;
  const prefersDark = window.matchMedia?.("(prefers-color-scheme: dark)").matches ?? false;
  return prefersDark ? "dark" : "light";
}

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>(() => readInitialTheme());

  useLayoutEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  function toggle() {
    const next: Theme = theme === "dark" ? "light" : "dark";
    setTheme(next);
    document.documentElement.setAttribute("data-theme", next);
    window.localStorage.setItem(STORAGE_KEY, next);
  }

  return (
    <button type="button" className="theme-toggle-btn" onClick={toggle} aria-label="Cambiar tema claro/oscuro">
      {theme === "dark" ? "🌙" : "☀️"}
    </button>
  );
}
