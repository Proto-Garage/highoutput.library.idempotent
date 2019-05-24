import { FibonacciStrategy, Backoff } from 'backoff';

export type Request<T = any> = {
  id: string;
} & (
  | {
      status: 'STARTED';
    }
  | {
      status: 'DONE';
      result: T;
    });

export interface IdempotentStore {
  get(id: string): Promise<Request | null>;
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
    try {
      await this.store.set(request, { status: 'STARTED' });
    } catch (err) {
      if (err.code !== 'REQUEST_EXISTS') {
        throw err;
      }

      return new Promise((resolve, reject) => {
        const handler = async () => {
          const requestDocument = await this.store.get(request);

          if (requestDocument && requestDocument.status === 'DONE') {
            resolve(requestDocument.result);
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

    const result = await fn();

    await this.store.set(request, { status: 'DONE', result });
    return result;
  }
}

export default Idempotent;
