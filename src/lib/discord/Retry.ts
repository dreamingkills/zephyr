import { StatsD } from "../StatsD";

export const wait: (ms: number) => Promise<void> = (ms: number) =>
  new Promise((r) => setTimeout(r, ms));

export function retryOperation<T>(
  operation: (...args: any) => Promise<T>,
  delay: number,
  retries: number
): Promise<T> {
  return new Promise(async (resolve, reject) => {
    try {
      return resolve(await operation());
    } catch (e) {
      if (retries <= 0) return reject(e);

      if (retries > 0) {
        await wait(delay);
        StatsD.increment(`zephyr.message.retry`, 1)
        return resolve(retryOperation(operation, delay, retries - 1));
      }
    }
  }) as Promise<T>;
}
