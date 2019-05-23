import { expect } from 'chai';
import sinon from 'sinon';
import { delay } from 'highoutput-utilities';
import R from 'ramda';

import Idempotent from '../src/idempotent';

const randomDelay = () => delay(5 + Math.random() * 20);
describe('Idempotent', function() {
  beforeEach(function() {
    this.store = {};

    this.idempotent = new Idempotent({
      set: async (
        id: string,
        params:
          | {
              status: 'STARTED';
            }
          | {
              status: 'DONE';
              result: any;
            }
      ) => {
        await randomDelay();

        if (params.status === 'STARTED') {
          if (this.store[id]) {
            throw { code: 'REQUEST_EXISTS' };
          }
        }

        this.store[id] = params;
        return true;
      },

      get: async (id: string) => {
        await randomDelay();
        const request = this.store[id];

        if (request && request.status === 'DONE') {
          return request.result;
        }

        return null;
      },
    });
  });

  describe('execute', () => {
    it('should execute the function and store the result', async function() {
      const handler = sinon.fake(async () => 'hello');

      let result = await this.idempotent.execute(handler, '1');

      expect(result).to.equal('hello');
      expect(this.store)
        .to.has.property('1')
        .to.be.deep.equal({ status: 'DONE', result: 'hello' });
      expect(handler.calledOnce).to.be.ok;
    });

    describe('when executed multiple times at the same time', () => {
      it('should run handler only once', async function() {
        const handler = sinon.fake(async () => 'hello');

        await Promise.all(
          R.times(() => this.idempotent.execute(handler, '1'))(1000)
        );

        expect(handler.calledOnce).to.be.ok;
      });
    });
  });
});
