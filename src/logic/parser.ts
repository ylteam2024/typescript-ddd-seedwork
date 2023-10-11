import { Validation } from '@model/invariant-validation';
import { BaseException, BaseExceptionBhv } from './exception.base';
import { Either, NEA, pipe } from './fp';
import { isArray } from 'util';

export interface BasicAssertParam {
  message?: string;
  exception?: BaseException;
  loc?: string[];
  code?: string;
  isWithKey?: boolean;
  key?: string;
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
  message: aMessage,
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
  message: aMessage,
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
  message: aMessage,
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
  message: aMessage,
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
  message: aMessage,
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

export const shouldBeArray =
  <A>({ code, message }: { code: string; message: string }) =>
  (v: unknown) =>
    pipe(
      v,
      Either.fromPredicate(isArray, () =>
        NEA.of(BaseExceptionBhv.construct(message, code)),
      ),
      Either.map((a) => a as A[]),
    );
