import { Connection } from 'mongoose';
import { IdempotentStore } from './idempotent';
export default class implements IdempotentStore {
    private model;
    constructor(connection: Connection, expires?: number);
    get(id: string): Promise<any>;
    set(request: string, params: {
        status: 'STARTED';
    } | {
        status: 'DONE';
        result: any;
    }): Promise<boolean>;
}
