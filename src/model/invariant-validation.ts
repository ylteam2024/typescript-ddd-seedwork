import { BaseException } from '@logic/exception.base';
import { Apply, Either, NEA, Option, pipe, Record } from '@logic/fp';
import { randomUUID } from 'crypto';
import { Magma } from 'fp-ts/lib/Magma';
import { Semigroup } from 'fp-ts/lib/Semigroup';
import { apply } from 'fp-ts/lib/function';
import { match, P } from 'ts-pattern';
import { isObject } from 'util';

type NormalValidationErr = BaseException | NEA.NonEmptyArray<BaseException>;
type StructValidationErr = Record<string, NormalValidationErr>;

export type ValidationErr = NormalValidationErr | StructValidationErr;

type ValidationErrByKey = [Option.Option<string>, ValidationErr];

const getErrorFromErrByKey = (vEBK: ValidationErrByKey) => vEBK[1];

export const getValidationErrByKeySemigroup: () => Semigroup<ValidationErrByKey> =
  () => {
    const mutualKey = randomUUID();
    return {
      concat: (a: ValidationErrByKey, b: ValidationErrByKey) => {
        const getStructErr = (err: ValidationErrByKey) =>
          pipe(
            err[0],
            Option.matchW(
              () => ({ unknown: [err[1]] }),
              (keyA: string) =>
                match([keyA, err[1]])
                  .with(
                    [mutualKey, P.when(isObject)],
                    () => err[1] as StructValidationErr,
                  )
                  .with([mutualKey, P.not(P.when(isObject))], () => ({
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
          Option.some(mutualKey),
          pipe(
            Record.union,
            apply(m),
            apply(getStructErr(a)),
            apply(getStructErr(b)),
          ) as StructValidationErr,
        ];
      },
    };
  };

export type ParsingInput<T> = {
  [K in keyof T]: Validation<T[K]>;
};

export const structSummarizerParsing = <T>(struct: ParsingInput<T>) => {
  const recordWithKeyValidation = Record.mapWithIndex(
    (k: string, a: Validation<unknown>) =>
      pipe(a, toValidationErr(Option.some(k))) as Either.Either<
        ValidationErrByKey,
        ValueOfValidation<typeof a>
      >,
  );
  const structValidate = Apply.sequenceS(
    Either.getApplicativeValidation(getValidationErrByKeySemigroup()),
  );
  return pipe(
    struct,
    recordWithKeyValidation,
    structValidate,
    Either.mapLeft(getErrorFromErrByKey),
  ) as Validation<T>;
};

export type Validation<A> = Either.Either<ValidationErr, A>;
export type ValueOfValidation<B> = B extends Validation<infer A> ? A : unknown;
export type ValidationWithKey<A> = Either.Either<ValidationErrByKey, A>;

export const toValidationErr = (key: Option.Option<string>) =>
  Either.mapLeft((e: ValidationErr) => [key, e] as ValidationErrByKey);

export type Parser<A, I = unknown> = (value: I) => Validation<A>;

export const identityParser = <A>(value: unknown) => Either.of(value as A);

export type StructValidation<A> = Either.Either<
  Record<string, NEA.NonEmptyArray<BaseException>>,
  A
>;

export interface IValidate<T> {
  (state: T): StructValidation<T>;
}

type Prim = string | number | boolean | Date | Option.Option<unknown>;

type PrimLiken<T extends Prim> = T extends Option.Option<unknown>
  ? Option.Option<unknown>
  : unknown;

export type Liken<T> = T extends Prim
  ? PrimLiken<T>
  : T extends Record<string | number | symbol, unknown> | Array<unknown>
  ? {
      [K in keyof T]: Liken<T[K]>;
    }
  : never;

export const optionizeParser =
  <T>(parser: Parser<T>) =>
  (optionV: Option.Option<unknown>) =>
    pipe(
      optionV,
      Option.map((v) => parser(v)),
      Option.sequence(Either.Applicative),
    );
