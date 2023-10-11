import { apply } from 'fp-ts/lib/function';
import { Either, arrayParser, parseUsernameFromStr, pipe } from 'src';
import { match, P } from 'ts-pattern';

describe('Test validation things', () => {
  it('Test array parser', () => {
    const userNames = [
      'tuan',
      'khang',
      '__failName',
      'hau',
      'failt..name',
      'hai',
    ];

    const badResult = pipe(
      arrayParser,
      apply(parseUsernameFromStr({})),
      apply(userNames),
    );
    Either;
    match(badResult)
      .with({ left: P.select() }, (left) => {
        console.log('correct error', left);
      })
      .otherwise(() => {
        fail();
      });
    const correctsUsername = ['tuan', 'khang', 'hau'];
    const goodResult = pipe(
      arrayParser,
      apply(parseUsernameFromStr({})),
      apply(correctsUsername),
    );
    Either;
    match(goodResult)
      .with({ right: P.select() }, (right) => {
        console.log('right ', right);
        expect(right).toEqual(correctsUsername);
      })
      .otherwise(() => {
        fail();
      });
  });
});
