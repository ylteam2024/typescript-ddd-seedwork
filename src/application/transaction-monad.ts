import { BaseException } from '@logic/exceptions';
import { TaskEither, IO, Either } from '@logic/fp';
import { pipe } from 'fp-ts/lib/function';

export interface IEntityManager {
  begin(): TaskEither.TaskEither<BaseException, IO.IO<unknown>>;
  commit(): TaskEither.TaskEither<BaseException, IO.IO<unknown>>;
  rollback(): TaskEither.TaskEither<BaseException, IO.IO<unknown>>;
}

export type Transaction<EM extends IEntityManager, RT> = {
  (em: EM): TaskEither.TaskEither<BaseException, IO.IO<RT>>;
};

const of = <A>(a: A) => TaskEither.rightIO(IO.of(a));

const map =
  <A, B>(f: (a: A) => B) =>
  <EM extends IEntityManager>(fa: Transaction<EM, A>) =>
  (em: EM) =>
    pipe(em, fa, TaskEither.map(IO.map(f)));

const chain =
  <A, B, EM extends IEntityManager>(f: (a: A) => Transaction<EM, B>) =>
  (fa: Transaction<EM, A>) =>
  (em: EM) =>
    pipe(
      fa(em),
      TaskEither.flatMap((ioa) => {
        const a = ioa(); // compute io - side effect
        return f(a)(em);
      }),
    );
const run =
  <EM extends IEntityManager, B>(transaction: Transaction<EM, B>) =>
  async (em: EM) => {
    const eitherIO = await pipe(
      em.begin(),
      TaskEither.flatMap(() => transaction(em)),
      TaskEither.flatMap(() => em.commit()),
      TaskEither.tapError((err) => {
        console.error('[Transaction Monad Err] ', err);
        return pipe(
          em.rollback(),
          TaskEither.flatMap(() => TaskEither.left(err)),
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
