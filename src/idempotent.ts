export interface IdempotentStore {
  get<T = any>(request: string): Promise<{ found: boolean; result: T }>;
  set<T>(request: string, response: T): Promise<boolean>;
}

export class Idempotent {
  constructor(private store: IdempotentStore) {}

  async execute<T = any>(fn: () => Promise<T>, request: string): Promise<T> {
    const response = await this.store.get(request);
    if (response && response.found) {
      return response.result;
    }

    let res = await fn();
    await this.store.set(request, res);
    return res;
  }
}

export default Idempotent;
