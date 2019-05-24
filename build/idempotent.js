"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const backoff_1 = require("backoff");
const highoutput_utilities_1 = require("highoutput-utilities");
class TimeoutError extends Error {
    constructor() {
        super('Timeout');
    }
}
exports.TimeoutError = TimeoutError;
class RequestExistsError extends Error {
    constructor() {
        super('Request exists');
    }
}
exports.RequestExistsError = RequestExistsError;
class Idempotent {
    constructor(store, options = {}) {
        this.store = store;
        this.options = options;
    }
    async execute(fn, request) {
        try {
            await this.store.set(request, { status: 'STARTED' });
        }
        catch (err) {
            if (!(err instanceof RequestExistsError)) {
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
                const backoff = new backoff_1.Backoff(new backoff_1.FibonacciStrategy({
                    initialDelay: 1,
                    maxDelay: 100,
                    randomisationFactor: 0.5,
                }));
                backoff.on('backoff', handler);
                handler();
                highoutput_utilities_1.delay(this.options.timeout || '1m').then(() => {
                    backoff.removeAllListeners();
                    reject(new TimeoutError());
                });
            });
        }
        const result = await fn();
        await this.store.set(request, { status: 'DONE', result });
        return result;
    }
}
exports.Idempotent = Idempotent;
exports.default = Idempotent;
//# sourceMappingURL=idempotent.js.map