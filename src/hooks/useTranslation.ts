
import { useTheme } from '@/contexts/ThemeContext';
import { t } from '@/lib/i18n';

export function useTranslation() {
  const { language } = useTheme();
  return {
    t: (key: string) => t(key, language),
    lang: language,
  };
}
