import { Validation } from '@model/invariant-validation';
import { BaseException, BaseExceptionBhv } from './exception.base';
import { Either, NEA, pipe } from './fp';

export interface BasicAssertParam {
  aMessage?: string;
  exception?: BaseException;
  loc?: string[];
  code?: string;
}

export function constructException(
  aMessage?: string,
  exception?: BaseException,
  loc?: string[],
  code?: string,
) {
  return NEA.of(exception || BaseExceptionBhv.construct(aMessage, code, loc));
}
export function assertArgumentNotEmpty({
  aString,
  aMessage,
  exception,
  loc,
  code,
}: { aString: string } & BasicAssertParam): Validation<string> {
  const isEmpty = (v: string) => v == undefined || v.length === 0;

  return pipe(
    aString,
    Either.fromPredicate(isEmpty, () =>
      constructException(aMessage, exception, loc, code),
    ),
  );
}

export function assertArgumentNotNull({
  aValue,
  aMessage,
  exception,
  loc,
  code,
}: { aValue: any } & BasicAssertParam): Validation<string> {
  const isNull = (v: any) => v == undefined;
  return pipe(
    aValue,
    Either.fromPredicate(isNull, () =>
      constructException(aMessage, exception, loc, code),
    ),
  );
}

export function assertStateTrue({
  aBoolean,
  aMessage,
  exception,
  loc,
  code,
}: { aBoolean: boolean } & BasicAssertParam): Validation<boolean> {
  return pipe(
    aBoolean,
    Either.fromPredicate(
      (v) => v,
      () => constructException(aMessage, exception, loc, code),
    ),
  );
}

export function assertStateFalse({
  aBoolean,
  aMessage,
  exception,
  loc,
  code,
}: { aBoolean: boolean } & BasicAssertParam): Validation<boolean> {
  return pipe(
    aBoolean,
    Either.fromPredicate(
      (v) => !v,
      () => constructException(aMessage, exception, loc, code),
    ),
  );
}

export function assertLargerThanOrEqual({
  aNumber,
  threshold,
  allowEqual = true,
  aMessage,
  exception,
  loc,
  code,
}: {
  aNumber: number;
  threshold: number;
  allowEqual?: boolean;
} & BasicAssertParam): Validation<number> {
  const isNot = (v: number) =>
    (!allowEqual && v <= threshold) || (allowEqual && v < threshold);
  return pipe(
    aNumber,
    Either.fromPredicate(
      (v: number) => !isNot(v),
      () => constructException(aMessage, exception, loc, code),
    ),
  );
}
