export type ThemeMode = 'light' | 'dark' | 'system';

const STORAGE_KEY = 'calendar_theme';

export function getStoredTheme(): ThemeMode {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === 'light' || saved === 'dark' || saved === 'system') {
      return saved;
    }
  } catch {}
  return 'system';
}

export function getSystemTheme(): 'light' | 'dark' {
  if (typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    return 'dark';
  }
  return 'light';
}

export function applyTheme(mode: ThemeMode): 'light' | 'dark' {
  const effectiveMode = mode === 'system' ? getSystemTheme() : mode;
  const isDark = effectiveMode === 'dark';

  if (typeof document !== 'undefined') {
    if (isDark) {
      document.documentElement.classList.add('dark');
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.setAttribute('data-theme', 'light');
    }
  }

  try {
    localStorage.setItem(STORAGE_KEY, mode);
  } catch {}

  return effectiveMode;
}
