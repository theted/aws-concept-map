import { describe, expect, it, vi } from 'vitest';
import { createStore } from './store';

describe('createStore', () => {
  it('merges patches into a new state object', () => {
    const store = createStore({ a: 1, b: 'x' });
    const before = store.get();
    store.set({ a: 2 });
    expect(store.get()).toEqual({ a: 2, b: 'x' });
    expect(store.get()).not.toBe(before);
  });

  it('accepts patch functions', () => {
    const store = createStore({ count: 1 });
    store.set(({ count }) => ({ count: count + 1 }));
    expect(store.get().count).toBe(2);
  });

  it('notifies listeners with the previous state', () => {
    const store = createStore({ a: 1 });
    const listener = vi.fn();
    store.subscribe(listener);
    store.set({ a: 5 });
    expect(listener).toHaveBeenCalledWith({ a: 5 }, { a: 1 });
  });

  it('skips notifications when nothing changed', () => {
    const store = createStore({ a: 1 });
    const listener = vi.fn();
    store.subscribe(listener);
    store.set({ a: 1 });
    store.set({});
    expect(listener).not.toHaveBeenCalled();
  });

  it('stops notifying after unsubscribe', () => {
    const store = createStore({ a: 1 });
    const listener = vi.fn();
    const unsubscribe = store.subscribe(listener);
    unsubscribe();
    store.set({ a: 2 });
    expect(listener).not.toHaveBeenCalled();
  });
});
