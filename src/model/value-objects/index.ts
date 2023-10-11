import { BaseExceptionBhv } from '@logic/exception.base';
import { Array, Either, pipe } from '@logic/fp';
import { DateFromISOString, NumberFromString } from 'io-ts-types';
import { Parser } from '..';

export * from './NoneEmptyString';
export * from './Person';

export const parseString = (v: unknown) => {
  return Either.fromPredicate(
    (v): v is string => typeof v === 'string',
    () => BaseExceptionBhv.construct('Should be string', 'INVALID_STRING'),
  )(v);
};

export const parseNumber = (v: unknown) => {
  return pipe(
    v,
    Either.fromPredicate(
      (v: unknown): v is number => typeof v === 'number',
      () => ({}),
    ),
    Either.alt(() => NumberFromString.decode(v)),
    Either.mapLeft(() =>
      BaseExceptionBhv.construct('invalid number', 'INVALID_NUMBER'),
    ),
  );
};

export const parseDate =
  ({
    exeMessage,
    code,
  }: {
    exeMessage?: string;
    code?: string;
  }): Parser<Date> =>
  (v: unknown) =>
    pipe(
      Either.fromPredicate(
        (v): v is Date => v instanceof Date,
        () => ({}),
      )(v),
      Either.alt(() => DateFromISOString.decode(v)),
      Either.mapLeft(() =>
        BaseExceptionBhv.construct(
          exeMessage || 'Date is not valid',
          code || 'DATE_INVALID',
        ),
      ),
    );

export const parseArray =
  <T>(parser: Parser<T>) =>
  (v: unknown[]) =>
    Array.traverse(Either.Applicative)(parser)(v);
