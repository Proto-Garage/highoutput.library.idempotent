export declare class TimeoutError extends Error {
    constructor();
}
export declare class RequestExistsError extends Error {
    constructor();
}
export declare type Request = {
    id: string;
} & ({
    status: 'STARTED';
} | {
    status: 'DONE';
    result: any;
});
export interface IdempotentStore {
    get(id: string): Promise<Request | null>;
    set(id: string, params: {
        status: 'STARTED';
    } | {
        status: 'DONE';
        result: any;
    }): Promise<boolean>;
}
export declare class Idempotent {
    private readonly store;
    private readonly options;
    constructor(store: IdempotentStore, options?: {
        timeout?: string | number;
    });
    execute<T = any>(fn: () => Promise<T>, request: string): Promise<T>;
}
export default Idempotent;
