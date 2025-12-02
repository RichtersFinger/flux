import { useSyncExternalStore } from "react";

type Subscriber = Set<() => void> | undefined;

/**
 * Returns store-hook factory. The generic type T must not contain optional
 * fields in top level/the initial state-factory must return all top
 * level properties. If this condition is not satisfied, the application will
 * likely break!
 * @param getInitialState factory that returns the store's initial state
 * @returns store-hook; use as
 *   ```typescript
 *   // create store-object factory
 *   export const exampleStore = createShallowStore<..>((get, set) => { prop1: ..., action1: () => ..., ... });
 *   ...
 *   // in component
 *   function ExampleComponent(...) {
 *     // use properties
 *     const { prop1, action1 } = exampleStore();
 *     ...
 *   }
 *   ```
 */
export function createShallowStore<T extends object>(
  getInitialState: (
    get: () => T,
    set: (newState: Partial<T> | ((state: T) => Partial<T>)) => void,
    reset: () => void
  ) => T
) {
  const state: T = {} as T;
  const initialState: T = {} as T;
  const store: {
    subscribers: Record<keyof T, Subscriber>;
    subscribe: (key: keyof T, callback: () => void) => () => void;
    get: () => T;
    set: (newState: Partial<T> | ((state: T) => Partial<T>)) => void;
    reset: () => void;
  } = {
    subscribers: {} as Record<keyof T, Subscriber>,
    subscribe: (key, callback) => {
      if (!store.subscribers[key as keyof T])
        store.subscribers[key as keyof T] = new Set<() => void>();
      if (key) store.subscribers[key as keyof T]!.add(callback);
      return () => store.subscribers[key as keyof T]!.delete(callback);
    },
    get: () => ({ ...state }),
    set: (newStateOrAction) => {
      if (typeof newStateOrAction === "function") {
        newStateOrAction = newStateOrAction(store.get());
      }
      Object.assign(state, newStateOrAction);
      // notify all affected subscribers
      for (const key of Object.keys(newStateOrAction)) {
        store.subscribers[key as keyof T]?.forEach((callback) => callback());
      }
    },
    reset: () => {
      Object.assign(state, {
        // reset all existing data to undefined
        ...Object.fromEntries(
          Object.entries(state).map(([key]) => [key, undefined])
        ),
        // re-apply initial state
        ...initialState,
      });
    },
  };
  Object.assign(initialState, {
    ...getInitialState(store.get, store.set, store.reset),
  });
  store.reset();

  return () => {
    const useStore = {} as T;
    for (const key of Object.keys(state)) {
      // looping over React hook 'useSyncExternalStore' is fine here,
      // because the keys of state are always the same
      // eslint-disable-next-line react-hooks/rules-of-hooks
      useStore[key as keyof T] = useSyncExternalStore(
        (callback) => store.subscribe(key as keyof T, callback),
        () => store.get()[key as keyof T]
      );
    }
    return useStore;
  };
}
