import type { AppState, ThemeName } from '../types';
import { qs } from '../utils/dom';

export interface HeaderCallbacks {
  onQuery: (query: string) => void;
  onSubmitQuery: () => void;
  onToggleTheme: () => void;
  onToggleGuide: () => void;
}

export interface HeaderView {
  render: (state: AppState, matchCount: number) => void;
  focusSearch: () => void;
}

const THEME_LABEL: Record<ThemeName, string> = {
  dark: 'Switch to light theme',
  light: 'Switch to dark theme',
};

export const createHeaderView = (root: HTMLElement, callbacks: HeaderCallbacks): HeaderView => {
  const input = qs<HTMLInputElement>(root, '#search');
  const status = qs(root, '.search-status');
  const themeBtn = qs<HTMLButtonElement>(root, '[data-action="theme"]');
  const guideBtn = qs<HTMLButtonElement>(root, '[data-action="guide"]');

  input.addEventListener('input', () => callbacks.onQuery(input.value));
  input.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      callbacks.onSubmitQuery();
    } else if (event.key === 'Escape') {
      event.stopPropagation();
      if (input.value) callbacks.onQuery('');
      else input.blur();
    }
  });
  themeBtn.addEventListener('click', callbacks.onToggleTheme);
  guideBtn.addEventListener('click', callbacks.onToggleGuide);

  const render = (state: AppState, matchCount: number): void => {
    if (input.value !== state.query) input.value = state.query;
    const hasQuery = state.query.trim() !== '';
    status.textContent = hasQuery ? `${matchCount} ${matchCount === 1 ? 'match' : 'matches'}` : '';
    root.classList.toggle('has-query', hasQuery);
    themeBtn.setAttribute('aria-label', THEME_LABEL[state.theme]);
    themeBtn.title = THEME_LABEL[state.theme];
    guideBtn.setAttribute('aria-expanded', String(state.guideOpen));
  };

  const focusSearch = (): void => {
    input.focus();
    input.select();
  };

  return { render, focusSearch };
};
