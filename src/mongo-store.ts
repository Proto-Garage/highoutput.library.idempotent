import { Connection, Document, Model, Schema } from 'mongoose';
import { IdempotentStore, Request } from './idempotent';

export default class implements IdempotentStore {
  private model: Model<Document & Request>;
  constructor(connection: Connection, expires: number = 3 * 24 * 60) {
    const schema = new Schema(
      {
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
          type: Schema.Types.Mixed,
          default: null,
          expires,
        },
      },
      { _id: false }
    );

    this.model = connection.model<Document & Request>(
      'IdempotentRequest',
      schema
    );
  }

  async get(id: string) {
    const request = await this.model.findById(id);

    if (request) {
      return request.toJSON();
    }

    return null;
  }

  async set(
    request: string,
    params:
      | {
          status: 'STARTED';
        }
      | {
          status: 'DONE';
          result: any;
        }
  ) {
    if (params.status === 'STARTED') {
      await this.model.create({
        _id: request,
        ...params,
      });
    }

    if (params.status === 'DONE') {
      await this.model.updateOne({ _id: request }, params);
    }
    return true;
  }
}
