import { Connection, Document, Model, Schema } from 'mongoose';
import { IdempotentStore } from './idempotent';

interface IdempotentAttributes {
  id: string;
  result: any;
}

export default class implements IdempotentStore {
  private model: Model<Document & IdempotentAttributes>;
  constructor(connection: Connection, expires: number = 3 * 24 * 60) {
    const schema = new Schema({
      _id: {
        type: String,
        required: true,
      },
      result: {
        type: Schema.Types.Mixed,
        required: true,
        expires,
      },
    });

    this.model = connection.model<Document & IdempotentAttributes>(
      'Idempotent',
      schema
    );
  }

  async get(id: string) {
    const found = await this.model.findById(id);

    if (found) {
      return found.result;
    }

    return null;
  }

  async set(request: string, result: any) {
    await this.model.create({
      _id: request,
      result,
    });
    return true;
  }
}
