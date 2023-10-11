import { BaseExceptionBhv } from '@logic/exception.base';
import { Either, NEA, Option, flow } from '@logic/fp';
import { ValueObjectTrait } from '@model/value-object.base';
import { toValidationErr } from '..';

export const isEmptyStringMaxNLength =
  <T>(maxLength: number) =>
  (v: unknown): v is T => {
    return typeof v === 'string' && v.length > 0 && v.length <= maxLength;
  };

interface NonEmptyStringVOTrait<T> extends ValueObjectTrait<T> {}

export function getTrait<T>({
  max,
  exceptionCode,
  message,
  key,
}: {
  max: number;
  exceptionCode: string;
  message: string;
  key?: string;
}): NonEmptyStringVOTrait<T> {
  const parse = flow(
    Either.fromPredicate(isEmptyStringMaxNLength<T>(max), () =>
      NEA.of(BaseExceptionBhv.construct(message, exceptionCode)),
    ),
    toValidationErr(Option.fromNullable(key)),
  );
  return {
    parse,
    new: parse,
  };
}

export const NEStringAuFn = {
  getTrait,
};
