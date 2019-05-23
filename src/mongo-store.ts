import { Connection, Document, Model, Schema } from 'mongoose';
import { IdempotentStore } from './idempotent';

type IdempotentRequestAttributes<T = any> = {
  id: string;
} & (
  | {
      status: 'STARTED';
    }
  | {
      status: 'DONE';
      result: T;
    });

export default class implements IdempotentStore {
  private model: Model<Document & IdempotentRequestAttributes>;
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

    this.model = connection.model<Document & IdempotentRequestAttributes>(
      'IdempotentRequest',
      schema
    );
  }

  async get(id: string) {
    const request = await this.model.findById(id);

    if (request && request.status === 'DONE') {
      return request.result;
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
