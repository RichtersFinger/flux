/**
 * Throttles callback.
 * @returns a function to be called instead of callback which limits
 * number of calls to once per interval
 */
export function throttle(callback: (...args: unknown[]) => void, interval: number) {
  let valid = true;

  return (...args: unknown[]) => {
    if (!valid) return;
    valid = false;
    setTimeout(() => (valid = true), interval);
    callback(...args);
  };
}
