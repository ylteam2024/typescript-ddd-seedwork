import { BaseExceptionBhv } from '@logic/exception.base';
import { Either, NEA, flow } from '@logic/fp';
import { PrimitiveVOTrait } from '@model/value-object.base';

export const isEmptyStringMaxNLength =
  <T>(maxLength: number) =>
  (v: unknown): v is T => {
    return typeof v === 'string' && v.length > 0 && v.length <= maxLength;
  };

interface NonEmptyStringVOTrait<T> extends PrimitiveVOTrait<T> {}

export function getTrait<T>({
  max,
  exceptionCode,
  message,
}: {
  max: number;
  exceptionCode: string;
  message: string;
}): NonEmptyStringVOTrait<T> {
  const parse = flow(
    Either.fromPredicate(isEmptyStringMaxNLength<T>(max), () =>
      NEA.of(BaseExceptionBhv.construct(message, exceptionCode)),
    ),
  );
  return {
    parse,
    new: parse,
  };
}

export const NEStringAuFn = {
  getTrait,
};
