import { useCallback, useSyncExternalStore } from 'react';

export function useMediaQuery(query: string): boolean {
  const subscribe = useCallback(
    (onChange: () => void) => {
      const media = window.matchMedia(query);
      media.addEventListener('change', onChange);
      return () => media.removeEventListener('change', onChange);
    },
    [query],
  );

  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(query).matches,
    () => false,
  );
}

/** Devices with a real pointer get hover previews; touch devices only use taps. */
export const HOVER_QUERY = '(hover: hover) and (pointer: fine)';
export const DESKTOP_QUERY = '(min-width: 1024px)';
export const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)';
