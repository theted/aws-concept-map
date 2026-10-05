// `>` is harmless in text and quoted attributes, and leaving it keeps ids like "a->b" byte-exact.
const ENTITIES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '"': '&quot;',
  "'": '&#39;',
};

/** Escapes text for safe interpolation into HTML strings (content and quoted attributes). */
export const esc = (value: string | number): string => String(value).replace(/[&<"']/g, (ch) => ENTITIES[ch]);

export const qs = <T extends Element = HTMLElement>(root: ParentNode, selector: string): T => {
  const el = root.querySelector<T>(selector);
  if (!el) throw new Error(`Missing element: ${selector}`);
  return el;
};

/** Nearest ancestor (or self) carrying `data-<attr>`, for delegated event handling. */
export const closestWithData = (target: EventTarget | null, attr: string): HTMLElement | null =>
  target instanceof Element ? target.closest<HTMLElement>(`[data-${attr}]`) : null;

const TEXT_INPUT_TYPES = new Set(['text', 'search', 'email', 'number', 'password', 'tel', 'url']);

/** True when keystrokes belong to a text field, so global shortcuts should stand aside. */
export const isTypingTarget = (target: EventTarget | null): boolean => {
  if (!(target instanceof HTMLElement)) return false;
  if (target instanceof HTMLInputElement) return TEXT_INPUT_TYPES.has(target.type);
  return target.isContentEditable || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT';
};

export const prefersReducedMotion = (): boolean =>
  typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
