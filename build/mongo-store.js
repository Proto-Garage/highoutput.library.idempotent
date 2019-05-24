"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
class default_1 {
    constructor(connection, expires = 3 * 24 * 60) {
        const schema = new mongoose_1.Schema({
            _id: {
                type: String,
                required: true,
            },
            status: {
                type: String,
                enum: ['STARTED', 'DONE'],
                required: true,
            },
            result: {
                type: mongoose_1.Schema.Types.Mixed,
                default: null,
            },
            dateTimeCreated: {
                type: mongoose_1.Schema.Types.Date,
                default: Date.now,
                expires,
            },
        });
        this.model = connection.model('IdempotentRequest', schema);
    }
    async get(id) {
        const request = await this.model.findById(id);
        if (request) {
            return request.toJSON();
        }
        return null;
    }
    async set(request, params) {
        if (params.status === 'STARTED') {
            await this.model.create(Object.assign({ _id: request }, params));
        }
        if (params.status === 'DONE') {
            await this.model.updateOne({ _id: request }, params);
        }
        return true;
    }
}
exports.default = default_1;
//# sourceMappingURL=mongo-store.js.map