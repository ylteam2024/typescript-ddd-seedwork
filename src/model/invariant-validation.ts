import { BaseException } from '@logic/exception.base';
import { Either, NEA } from '@logic/fp';

export type Validation<A> = Either.Either<NEA.NonEmptyArray<BaseException>, A>;

export type Parser<A> = (value: unknown) => Validation<A>;

export type StructValidation<A> = Either.Either<
  Record<string, NEA.NonEmptyArray<BaseException>>,
  A
>;

export interface IValidate<T> {
  (state: T): StructValidation<T>;
}
