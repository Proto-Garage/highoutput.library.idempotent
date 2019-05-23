import Idempotent from '../src/idempotent';
import { expect } from 'chai';

describe('Idempotent', function() {
  describe('execute', function() {
    it('executes the function and store the result', async function() {
      const store = {};
      const idempotent = new Idempotent({
        async set(request: string, response: any) {
          store[request] = response;
          return true;
        },

        async get(request: string) {
          return {
            found: Object.getOwnPropertyNames(store).includes(request),
            result: store[request],
          };
        },
      });

      let called = 0;

      for (let i = 0; i < 5; i++) {
        await idempotent.execute(async () => {
          called++;
          return 'hello';
        }, '1');
      }

      expect(called).to.equal(1);
      expect(store).to.deep.equal({ '1': 'hello' });
    });
  });
});
