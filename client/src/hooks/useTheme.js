import { useState, useEffect } from 'react';

const KEY = 'planme-theme';

export function useTheme() {
  const [theme, setThemeState] = useState(
    () => localStorage.getItem(KEY) || 'dark'
  );

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem(KEY, theme);
  }, [theme]);

  return { theme, setTheme: setThemeState };
}
