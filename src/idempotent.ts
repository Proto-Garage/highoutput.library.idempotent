import { FibonacciStrategy, Backoff } from 'backoff';

export interface IdempotentStore {
  get(id: string): Promise<any | null>;
  set(
    id: string,
    params:
      | {
          status: 'STARTED';
        }
      | {
          status: 'DONE';
          result: any;
        }
  ): Promise<boolean>;
}

export class Idempotent {
  constructor(private readonly store: IdempotentStore) {}

  async execute<T = any>(fn: () => Promise<T>, request: string): Promise<T> {
    let result: T | null;
    try {
      await this.store.set(request, { status: 'STARTED' });
    } catch (err) {
      if (err.code !== 'REQUEST_EXISTS') {
        throw err;
      }

      return new Promise((resolve, reject) => {
        const handler = async () => {
          result = await this.store.get(request);

          if (result) {
            resolve(result);
            return;
          }

          backoff.backoff();
        };

        const backoff = new Backoff(
          new FibonacciStrategy({
            initialDelay: 1,
            maxDelay: 100,
            randomisationFactor: 0.5,
          })
        );

        backoff.failAfter(10);

        backoff.on('backoff', handler);

        backoff.on('fail', async () => {
          reject(new Error('Timeout'));
        });

        handler();
      });
    }

    result = await fn();

    await this.store.set(request, { status: 'DONE', result });
    return result;
  }
}

export default Idempotent;
