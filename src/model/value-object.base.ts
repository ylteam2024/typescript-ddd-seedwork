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

export interface ValueObject<T = unknown> extends DomainModel<T> {}

export const getVoEqual = <VO extends ValueObject>() =>
  Eq.struct({
    _tag: S.Eq,
    props: {
      equals: (p1, p2) => equals(p1, p2),
    },
  }) as Eq.Eq<VO>;

const isEqual = <VO extends ValueObject>(v1: VO, v2: VO) =>
  getVoEqual<VO>().equals(v1, v2);

const construct =
  <T extends ValueObject>(parser: Parser<T['props']>) =>
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

export type VOLiken<T extends ValueObject> = T extends {
  likenType: infer U;
}
  ? U
  : {
      [K in keyof T['props']]: T['props'][K] extends ValueObject
        ? VOLiken<T['props'][K]>
        : T['props'][K] extends Array<unknown> & {
            [key: number]: ValueObject;
          }
        ? VOLiken<T['props'][K][0]>[]
        : Liken<T['props'][K]>;
    };

const structParsing = <ET extends ValueObject>(
  raw: ParsingInput<ET['props']>,
) => structSummarizerParsing<ET['props']>(raw);

export const ValueObjectAuFn = {
  construct,
  isEqual,
  structParsing,
};

export abstract class ValueObjectTrait<
  VO extends ValueObject,
> extends DomainModelTrait<VO> {
  abstract parse: Parser<VO>;
  abstract new: (params: unknown) => Validation<VO>;
  factory = construct<VO>;
  isEqual = isEqual<VO>;
  structParsing = structParsing<VO>;
}

export interface PrimitiveVOTrait<VO> {
  parse: Parser<VO>;
  new: (params: unknown) => Validation<VO>;
}

export const getVOGenricTrait = <VO extends ValueObject>() => ({
  construct: construct<VO>,
  isEqual: isEqual<VO>,
  structParsing: structParsing<VO>,
});
