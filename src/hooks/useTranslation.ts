
import { useCallback } from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import { t } from '@/lib/i18n';

export function useTranslation() {
  const { language } = useTheme();
  const translate = useCallback((key: string) => t(key, language), [language]);
  return {
    t: translate,
    lang: language,
  };
}
