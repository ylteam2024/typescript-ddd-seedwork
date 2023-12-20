import { BaseException } from '@logic/exception.base';
import { Either, NEA, Option, Record, pipe } from '@logic/fp';

type NormalValidationErr = BaseException | NEA.NonEmptyArray<BaseException>;
export type StructValidationErr = Record<string, NormalValidationErr>;

export type ValidationErr = NormalValidationErr | StructValidationErr;

export type ValidationErrByKey = [Option.Option<string>, ValidationErr];

export const getErrorFromErrByKey = (vEBK: ValidationErrByKey) => vEBK[1];

export type ParsingInput<T> = {
  [K in keyof T]: Validation<T[K]>;
};

export type Validation<A> = Either.Either<ValidationErr, A>;

export const ValidationTrait = {
  left: <A>(error: ValidationErr) => Either.left(error) as Validation<A>,
  right: <A>(a: A) => Either.right(a) as Validation<A>,
  fromEither: <A>(either: Either.Either<ValidationErr, A>) =>
    either as Validation<A>,

  fromEitherWithCasting: <A>(either: Either.Either<ValidationErr, any>) =>
    either as Validation<A>,

  fromPredicate:
    <T>(aBool: boolean, onFalse: () => BaseException) =>
    (value: T) =>
      aBool ? ValidationTrait.right(value) : ValidationTrait.left<T>(onFalse()),
};

export type ValueOfValidation<B> = B extends Validation<infer A> ? A : unknown;
export type ValidationWithKey<A> = Either.Either<ValidationErrByKey, A>;

export const toValidationErr = (key: Option.Option<string>) =>
  Either.mapLeft((e: ValidationErr) => [key, e] as ValidationErrByKey);

export const mapErrorWithKey =
  (key: string) =>
  <E, T>(e: Either.Either<E, T>) =>
    pipe(
      e,
      Either.mapLeft((e) => ({ [key]: e }) as StructValidationErr),
    );

export type Parser<A, I = any> = (value: I) => Validation<A>;

export type StructValidation<A> = Either.Either<
  Record<string, NEA.NonEmptyArray<BaseException>>,
  A
>;

type Prim = string | number | boolean | Date | Option.Option<unknown>;

type PrimLiken<T extends Prim> = T extends Option.Option<unknown>
  ? Option.Option<unknown>
  : unknown;

export type Liken<T> = T extends {
  likenType: infer U;
}
  ? U
  : T extends Prim
    ? PrimLiken<T>
    : T extends Record<string | number | symbol, unknown> | Array<unknown>
      ? {
          [K in keyof T]: Liken<T[K]>;
        }
      : unknown;

export type CustomLiken<T, L> = T & {
  likenType: L;
};
