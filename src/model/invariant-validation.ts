import { BaseException } from '@logic/exceptions';
import { Either } from '@logic/fp';

export type Validation<A> = Either.Either<
  Record<string, Array<BaseException>>,
  A
>;

export interface IValidate<T> {
  (state: T): Validation<T>;
}
