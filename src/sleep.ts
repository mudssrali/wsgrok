/**
 * Delays execution for the specified number of milliseconds.
 * 
 * @param ms - The number of milliseconds to wait before resolving the promise.
 * @returns A promise that resolves after the specified delay.
 */
const delay = (ms: number): Promise<number> => {
  return new Promise((resolve) => {
    setTimeout(() => resolve(ms), ms);
  });
};

export default delay;
