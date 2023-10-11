import { apply, flow, pipe } from 'fp-ts/lib/function';
import { Arr, Either, parseUsernameFromStr } from 'src';

describe('test Person', () => {
  it('test username parser', () => {
    const goods = ['tuan', 'hai', 'hau', 'hau123'];
    const bads = ['tuan_', 'hai__', '_hau', 'ha***i'];
    // Check good result
    pipe(
      Arr.map,
      apply(
        flow(
          parseUsernameFromStr({}),
          Either.match(
            () => {
              fail();
            },
            () => {},
          ),
        ),
      ),
      apply(goods),
    );
    // Check good result
    pipe(
      Arr.map,
      apply(
        flow(
          parseUsernameFromStr({}),
          Either.match(
            () => {},
            () => {
              fail();
            },
          ),
        ),
      ),
      apply(bads),
    );
  });
});
