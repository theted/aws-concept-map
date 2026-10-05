export type Listener<S> = (state: S, prev: S) => void;
export type Patch<S> = Partial<S> | ((state: S) => Partial<S>);

export interface Store<S> {
  get: () => S;
  set: (patch: Patch<S>) => void;
  subscribe: (listener: Listener<S>) => () => void;
}

/** Minimal observable store: immutable snapshots, listeners get the previous state for diffing. */
export const createStore = <S extends object>(initial: S): Store<S> => {
  let state = initial;
  const listeners = new Set<Listener<S>>();

  const set = (patch: Patch<S>): void => {
    const changes = typeof patch === 'function' ? patch(state) : patch;
    const changed = Object.entries(changes).some(([key, value]) => state[key as keyof S] !== value);
    if (!changed) return;
    const prev = state;
    state = { ...state, ...changes };
    listeners.forEach((listener) => listener(state, prev));
  };

  const subscribe = (listener: Listener<S>): (() => void) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
  };

  return { get: () => state, set, subscribe };
};
