import { useEffect, useState } from 'react';

type ColorSchemeOverride = 'light' | 'dark' | null;

const STORAGE_KEY = 'color-scheme';

function getStoredOverride(): ColorSchemeOverride {
  if (typeof window === 'undefined') return null;
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    return v === 'light' || v === 'dark' ? v : null;
  } catch {
    return null;
  }
}

function getSystemPrefersDark(): boolean {
  if (typeof window === 'undefined' || !window.matchMedia) return false;
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

function syncMeta(override: ColorSchemeOverride) {
  if (typeof document === 'undefined') return;
  const meta = document.querySelector('meta[name="color-scheme"]');
  if (meta) {
    meta.setAttribute('content', override ?? 'light dark');
  }
}

/**
 * Theme Controller using a daisyUI-style swap (Sun / Moon rotate transition)
 * backed by <meta name="color-scheme"> and localStorage persistence.
 */
export function ThemeSwap() {
  const [override, setOverride] = useState<ColorSchemeOverride>(() => getStoredOverride());
  const [systemDark, setSystemDark] = useState<boolean>(() => getSystemPrefersDark());

  useEffect(() => {
    syncMeta(override);
  }, [override]);

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const onMediaChange = (e: MediaQueryListEvent) => setSystemDark(e.matches);
    mq.addEventListener('change', onMediaChange);

    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) {
        const next = e.newValue === 'light' || e.newValue === 'dark' ? e.newValue : null;
        setOverride(next);
      }
    };
    window.addEventListener('storage', onStorage);

    return () => {
      mq.removeEventListener('change', onMediaChange);
      window.removeEventListener('storage', onStorage);
    };
  }, []);

  const isDark = override !== null ? override === 'dark' : systemDark;

  const handleToggle = () => {
    const target: 'light' | 'dark' = isDark ? 'light' : 'dark';
    const systemPref: 'light' | 'dark' = systemDark ? 'dark' : 'light';
    const nextOverride: ColorSchemeOverride = target === systemPref ? null : target;

    try {
      if (nextOverride === null) {
        localStorage.removeItem(STORAGE_KEY);
      } else {
        localStorage.setItem(STORAGE_KEY, nextOverride);
      }
    } catch {}

    setOverride(nextOverride);
    syncMeta(nextOverride);
  };

  const label = isDark ? 'Switch to light theme' : 'Switch to dark theme';

  return (
    <label className="theme-swap tap-square" title={label}>
      <input
        type="checkbox"
        className="theme-swap-input"
        checked={isDark}
        onChange={handleToggle}
        aria-label={label}
      />
      <span className="sr-only">{label}</span>

      {/* Sun icon (shown in light mode) */}
      <svg
        className="theme-swap-icon theme-swap-sun"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
      </svg>

      {/* Moon icon (shown in dark mode) */}
      <svg
        className="theme-swap-icon theme-swap-moon"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
      </svg>
    </label>
  );
}
