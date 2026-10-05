import { useSyncExternalStore } from "react";

const subscribe = () => () => {};

/** false during SSR and hydration, true after; for output that depends on the client clock/timezone. */
export function useIsClient(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
}
