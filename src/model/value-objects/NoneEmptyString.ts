import { BaseExceptionBhv } from '@logic/exception.base';
import { Either, NEA, flow } from '@logic/fp';
import { PrimitiveVOTrait } from '@model/value-object.base';
import { Brand } from '@type_util/index';

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

export type NonEmptyStringMax10 = Brand<string, 'NonEmptyStringMax10'>;

export type NonEmptyStringMax100 = Brand<string, 'NonEmptyStringMax100'>;

export const nonEmptyStringMax10Trait =
  NEStringAuFn.getTrait<NonEmptyStringMax10>({
    max: 10,
    message: 'should not be empty and large than 10',
    exceptionCode: 'INVALID_NON_EMPTY_STRING_MAX_10',
  });

export const nonEmptyStringMax100Trait =
  NEStringAuFn.getTrait<NonEmptyStringMax100>({
    max: 100,
    message: 'should not be empty and large than 100',
    exceptionCode: 'INVALID_NON_EMPTY_STRING_MAX_100',
  });
