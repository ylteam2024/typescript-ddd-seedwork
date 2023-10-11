import { BaseException } from '@logic/exception.base';
import { TE, IO, Either } from '@logic/fp';
import { pipe } from 'fp-ts/lib/function';

export interface IEntityManager {
  begin(): TE.TaskEither<BaseException, IO.IO<unknown>>;
  commit(): TE.TaskEither<BaseException, IO.IO<unknown>>;
  rollback(): TE.TaskEither<BaseException, IO.IO<unknown>>;
}

export type Transaction<EM extends IEntityManager, RT> = {
  (em: EM): TE.TaskEither<BaseException, IO.IO<RT>>;
};

const of = <A>(a: A) => TE.rightIO(IO.of(a));

const map =
  <A, B>(f: (a: A) => B) =>
  <EM extends IEntityManager>(fa: Transaction<EM, A>) =>
  (em: EM) =>
    pipe(em, fa, TE.map(IO.map(f)));

const chain =
  <A, B, EM extends IEntityManager>(f: (a: A) => Transaction<EM, B>) =>
  (fa: Transaction<EM, A>) =>
  (em: EM) =>
    pipe(
      fa(em),
      TE.flatMap((ioa) => {
        const a = ioa(); // compute io - side effect
        return f(a)(em);
      }),
    );
const run =
  <EM extends IEntityManager, B>(transaction: Transaction<EM, B>) =>
  async (em: EM) => {
    const eitherIO = await pipe(
      em.begin(),
      TE.flatMap(() => transaction(em)),
      TE.flatMap(() => em.commit()),
      TE.tapError((err) => {
        console.error('[Transaction Monad Err] ', err);
        return pipe(
          em.rollback(),
          TE.flatMap(() => TE.left(err)),
        );
      }),
    )();
    return pipe(
      eitherIO,
      Either.map((io) => io()),
    );
  };
export const TransactionMonad = {
  of,
  map,
  chain,
  run,
};
