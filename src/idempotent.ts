export interface IdempotentStore {
  get<T = any>(request: string): Promise<{ found: boolean; result: T }>;
  set<T>(request: string, response: T): Promise<boolean>;
  lock(request: string): Promise<boolean>;
  release(request: string): Promise<boolean>;
}

export class LockError extends Error {
  constructor() {
    super('Failed to lock the request id');
  }
}

export class Idempotent {
  constructor(private store: IdempotentStore) {}

  async execute<T = any>(fn: () => Promise<T>, request: string): Promise<T> {
    const lock = await this.store.lock(request);
    if (!lock) {
      throw new LockError();
    }
    const response = await this.store.get(request);
    if (response && response.found) {
      return response.result;
    }

    let res = await fn();
    await this.store.set(request, res);

    await this.store.release(request);
    return res;
  }
}

export default Idempotent;
