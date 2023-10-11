import { BaseExceptionBhv } from '@logic/exception.base';
import { Array, Either, pipe } from '@logic/fp';
import { decodeWithValidationErr } from '@model/io-related-auxiliry-func';
import { apply } from 'fp-ts/lib/function';
import { NumberFromString } from 'io-ts-types';
import { Parser } from '..';

export * from './NoneEmptyString';

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
  return pipe(
    decodeWithValidationErr<number>,
    apply(NumberFromString),
    apply({
      message: 'Should be number',
      code: 'INVALID_NUMBER',
    }),
  )(v);
};

export const parseArray =
  <T>(parser: Parser<T>) =>
  (v: unknown[]) =>
    Array.traverse(Either.Applicative)(parser)(v);
