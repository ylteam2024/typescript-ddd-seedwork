import { BaseException, BaseExceptionBhv } from './exception.base';

export interface BasicAssertParam {
  aMessage?: string;
  exception?: BaseException;
  loc?: string[];
  code?: string;
}

export function simpleHandleABoolean(
  aBoolean: boolean,
  aMessage?: string,
  exception?: BaseException,
  loc?: string[],
  code?: string,
) {
  if (aBoolean) {
    throw exception || BaseExceptionBhv.construct(aMessage, code, loc);
  }
}
export function assertArgumentNotEmpty({
  aString,
  aMessage,
  exception,
  loc,
  code,
}: { aString: string } & BasicAssertParam) {
  const isEmpty = aString == undefined || aString.length === 0;
  simpleHandleABoolean(isEmpty, aMessage, exception, loc, code);
}

export function assertArgumentNotNull({
  aValue,
  aMessage,
  exception,
  loc,
  code,
}: { aValue: any } & BasicAssertParam) {
  const isNull = aValue == undefined;
  simpleHandleABoolean(isNull, aMessage, exception, loc, code);
}

export function assertStateTrue({
  aBoolean,
  aMessage,
  exception,
  loc,
  code,
}: { aBoolean: boolean } & BasicAssertParam) {
  simpleHandleABoolean(!aBoolean, aMessage, exception, loc, code);
}

export function assertStateFalse({
  aBoolean,
  aMessage,
  exception,
  loc,
  code,
}: { aBoolean: boolean } & BasicAssertParam) {
  simpleHandleABoolean(aBoolean, aMessage, exception, loc, code);
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
} & BasicAssertParam) {
  const isNot =
    (!allowEqual && aNumber <= threshold) ||
    (allowEqual && aNumber < threshold);
  simpleHandleABoolean(isNot, aMessage, exception, loc, code);
}
