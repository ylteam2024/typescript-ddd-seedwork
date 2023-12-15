import { BaseExceptionBhv } from '@logic/exception.base';
import { Arr, Either, pipe } from '@logic/fp';
import { DateFromISOString, NumberFromString } from 'io-ts-types';
import { Parser } from '..';
export * from './Kyc';
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
    Either.alt<any, number>(() => NumberFromString.decode(v)),
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
      Either.alt<any, Date>(() => DateFromISOString.decode(v)),
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
    Arr.traverse(Either.Applicative)(parser)(v);
