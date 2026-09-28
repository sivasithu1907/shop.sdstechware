import { useEffect, useRef, useState } from 'react';
import { writeJSON, type WriteResult } from '../lib/storage';

/**
 * useState that loads once from browser storage (via a normalising loader)
 * and writes back whenever the value changes. Write failures are reported to
 * `onWriteError` (once per failure streak) instead of being swallowed.
 */
export function usePersistentState<T>(
  key: string,
  load: () => T,
  onWriteError?: (key: string, message: string) => void,
  serialize: (value: T) => unknown = v => v,
) {
  const [value, setValue] = useState<T>(load);
  const failing = useRef(false);

  useEffect(() => {
    const result: WriteResult = writeJSON(key, serialize(value));
    if (!result.ok && !failing.current) {
      failing.current = true;
      onWriteError?.(key, result.error ?? 'Could not save to browser storage.');
    } else if (result.ok) {
      failing.current = false;
    }
    // serialize/onWriteError are treated as stable for the lifetime of the provider.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, value]);

  return [value, setValue] as const;
}
