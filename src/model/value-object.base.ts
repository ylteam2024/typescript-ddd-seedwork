/**
 * @desc ValueObjects are objects that we determine their
 * equality through their structrual property.
 */

import { Either, Eq, S } from '@logic/fp';
import { pipe } from 'fp-ts/lib/function';
import { equals } from 'ramda';
import {
  Liken,
  Parser,
  ParsingInput,
  Validation,
  structSummarizerParsing,
} from './invariant-validation';
import { DomainModel, DomainModelTrait } from './domain-model.base';

export interface ValueObject<T> extends DomainModel<T> {}

const voEqual = Eq.struct({
  _tag: S.Eq,
  props: {
    equals: (p1, p2) => equals(p1, p2),
  },
});

const isEqual = <T>(v1: ValueObject<T>, v2: ValueObject<T>) =>
  voEqual.equals(v1, v2);

const construct =
  <T extends ValueObject<unknown>>(parser: Parser<T['props']>) =>
  (tag: string) =>
  (props: unknown) => {
    return pipe(
      parser(props),
      Either.as({
        _tag: tag,
        props,
      } as T),
    );
  };

export type VOLiken<T extends ValueObject<unknown>> = {
  [K in keyof T['props']]: T['props'][K] extends ValueObject<unknown>
    ? VOLiken<T['props'][K]>
    : T['props'][K] extends Array<unknown> & {
        [key: number]: ValueObject<unknown>;
      }
    ? VOLiken<T['props'][K][0]>[]
    : Liken<T['props'][K]>;
};

const structParsing = <ET extends ValueObject<unknown>>(
  raw: ParsingInput<ET['props']>,
) => structSummarizerParsing<ET['props']>(raw);

export const ValueObjectAuFn = {
  construct,
  isEqual,
  structParsing,
};

export abstract class ValueObjectTrait<
  VO extends ValueObject<unknown>,
> extends DomainModelTrait<VO> {
  abstract parse: Parser<VO>;
  abstract new: (params: unknown) => Validation<VO>;
  construct = construct<VO>;
  isEqual = isEqual<VO>;
  structParsing = structParsing<VO>;
}

export interface PrimitiveVOTrait<VO> {
  parse: Parser<VO>;
  new: (params: unknown) => Validation<VO>;
}

export const getVOGenricTrait = <VO extends ValueObject<unknown>>() => ({
  construct: construct<VO>,
  isEqual: isEqual<VO>,
  structParsing: structParsing<VO>,
});
