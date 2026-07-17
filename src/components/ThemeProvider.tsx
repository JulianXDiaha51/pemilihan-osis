"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

export type Theme = 'light' | 'dark' | 'system';

interface ThemeContextValue {
  theme: Theme;
  resolvedTheme: 'light' | 'dark';
  setTheme: (t: Theme) => Promise<void>;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: 'system',
  resolvedTheme: 'light',
  setTheme: async () => {},
});

function resolve(theme: Theme): 'light' | 'dark' {
  if (theme === 'system') {
    if (typeof window === 'undefined') return 'light';
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  return theme;
}

function applyClass(mode: 'light' | 'dark') {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  root.classList.remove('light', 'dark');
  root.classList.add(mode);
  root.style.colorScheme = mode;
}

export function ThemeProvider({
  initial = 'system',
  children,
}: {
  initial?: Theme;
  children: React.ReactNode;
}) {
  const [theme, setThemeState] = useState<Theme>(initial);
  const [resolved, setResolved] = useState<'light' | 'dark'>(() => resolve(initial));

  useEffect(() => {
    const r = resolve(theme);
    setResolved(r);
    applyClass(r);
  }, [theme]);

  useEffect(() => {
    if (theme !== 'system') return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const listener = () => {
      const r = mq.matches ? 'dark' : 'light';
      setResolved(r);
      applyClass(r);
    };
    mq.addEventListener('change', listener);
    return () => mq.removeEventListener('change', listener);
  }, [theme]);

  const setTheme = useCallback(async (t: Theme) => {
    setThemeState(t);
    try {
      const form = new FormData();
      form.append('theme', t);
      await fetch('/api/settings', { method: 'PUT', body: form });
    } catch {}
  }, []);

  const value = useMemo(
    () => ({ theme, resolvedTheme: resolved, setTheme }),
    [theme, resolved, setTheme]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  return useContext(ThemeContext);
}
