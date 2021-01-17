export const wait: (ms: number) => Promise<void> = (ms: number) =>
  new Promise((r) => setTimeout(r, ms));

export const retryOperation: <T>(
  operation: (...args: any) => Promise<T>,
  delay: number,
  retries: number
) => Promise<T> = <T>(
  operation: (...args: any) => Promise<T>,
  delay: number,
  retries: number
) =>
  new Promise(async (resolve, reject) => {
    return operation()
      .then(resolve)
      .catch((reason) => {
        if (retries > 0) {
          return wait(delay)
            .then(
              retryOperation.bind(
                null,
                operation,
                delay,
                retries - 1
              ) as () => Promise<T>
            )
            .then(resolve)
            .catch(reject);
        }
        return reject(reason);
      });
  }) as Promise<T>;
