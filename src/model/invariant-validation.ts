import { BaseException, BaseExceptionBhv } from '@logic/exception.base';
import {
  Apply,
  Array as A,
  Either,
  io,
  NEA,
  Option,
  pipe,
  Record,
} from '@logic/fp';
import { Magma } from 'fp-ts/lib/Magma';
import { Semigroup } from 'fp-ts/lib/Semigroup';
import { apply, flow } from 'fp-ts/lib/function';
import { match, P } from 'ts-pattern';
import { isObject } from 'util';

type NormalValidationErr = BaseException | NEA.NonEmptyArray<BaseException>;
type StructValidationErr = Record<string, NormalValidationErr>;

export type ValidationErr = NormalValidationErr | StructValidationErr;

type ValidationErrByKey = [Option.Option<string>, ValidationErr];

export const getValidationErrByKeySemigroup: (
  key: string,
) => Semigroup<ValidationErrByKey> = (key) => ({
  concat: (a: ValidationErrByKey, b: ValidationErrByKey) => {
    const getStructErr = (err: ValidationErrByKey) =>
      pipe(
        err[0],
        Option.matchW(
          () => ({ unknown: [err[1]] }),
          (keyA: string) =>
            match([keyA, err[1]])
              .with(
                [key, P.when(isObject)],
                () => err[1] as StructValidationErr,
              )
              .with([key, P.not(P.when(isObject))], () => ({
                abnormal: [err[1]],
              }))
              .otherwise(() => ({ [keyA]: err[1] })),
        ),
      );
    const m: Magma<unknown> = {
      concat: (a, b) => {
        const isJoinOfArray = Array.isArray(a) && Array.isArray(b);
        return isJoinOfArray ? [...a, ...b] : b;
      },
    };
    return [
      Option.some(key),
      pipe(
        Record.union,
        apply(m),
        apply(getStructErr(a)),
        apply(getStructErr(b)),
      ) as StructValidationErr,
    ];
  },
});

export const structSummarizerValidating =
  <T>(key: string) =>
  (struct: Record<string, Validation<unknown>>) => {
    const recordWithKeyValidation = Record.mapWithIndex(
      (k: string, a: Validation<unknown>) =>
        pipe(a, toValidationErr(Option.some(k))),
    )(struct);
    const structValidate = Apply.sequenceS(
      Either.getApplicativeValidation(getValidationErrByKeySemigroup(key)),
    );
    return structValidate(recordWithKeyValidation) as Either.Either<
      ValidationErrByKey,
      T
    >;
  };

export type Validation<A> = Either.Either<ValidationErr, A>;
export type ValidationWithKey<A> = Either.Either<ValidationErrByKey, A>;

export const toValidationErr = (key: Option.Option<string>) =>
  Either.mapLeft((e: ValidationErr) => [key, e] as ValidationErrByKey);

export const decodeWithValidationErr = <T extends io.Props>(
  ioType: io.ExactC<io.TypeC<T>> | io.TypeC<T>,
) =>
  flow(
    ioType.decode,
    Either.mapLeft((e) =>
      NEA.fromArray(
        pipe(
          e,
          A.map((e) => BaseExceptionBhv.construct(e.message, String(e.value))),
        ),
      ),
    ),
  );

export type Parser<A> = (value: unknown) => Validation<A>;

export const identityParser = <A>(value: unknown) => Either.of(value as A);

export type StructValidation<A> = Either.Either<
  Record<string, NEA.NonEmptyArray<BaseException>>,
  A
>;

export interface IValidate<T> {
  (state: T): StructValidation<T>;
}
