import { THEME_STORAGE_KEY } from '../config/constants';
import type { ThemeName } from '../types';

const isTheme = (value: unknown): value is ThemeName => value === 'light' || value === 'dark';

/** index.html sets `data-theme` before first paint (stored choice, else system); trust it. */
export const initialTheme = (): ThemeName => {
  const fromDom = document.documentElement.dataset.theme;
  return isTheme(fromDom) ? fromDom : 'dark';
};

export const applyTheme = (theme: ThemeName, persist: boolean): void => {
  document.documentElement.dataset.theme = theme;
  if (!persist) return;
  // Storage can throw in private mode or when site data is blocked; the theme still applies.
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    /* ignore */
  }
};
