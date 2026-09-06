import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type Theme = 'dark' | 'light';
type Language = 'fr' | 'en';

interface ThemeContextType {
  theme: Theme;
  setTheme: (t: Theme) => void;
  language: Language;
  setLanguage: (l: Language) => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: 'dark',
  setTheme: () => {},
  language: 'fr',
  setLanguage: () => {},
});

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(() => {
    const saved = localStorage.getItem('devora-theme');
    return (saved === 'light' || saved === 'dark') ? saved : 'dark';
  });
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem('devora-lang');
    return (saved === 'fr' || saved === 'en') ? saved : 'fr';
  });

  useEffect(() => {
    localStorage.setItem('devora-theme', theme);
    document.documentElement.classList.toggle('light', theme === 'light');
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('devora-lang', language);
  }, [language]);

  const setTheme = (t: Theme) => setThemeState(t);
  const setLanguage = (l: Language) => setLanguageState(l);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, language, setLanguage }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
