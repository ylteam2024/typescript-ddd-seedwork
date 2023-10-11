/**
 * @desc ValueObjects are objects that we determine their
 * equality through their structrual property.
 */

import { Either, Eq, S } from '@logic/fp';
import { pipe } from 'fp-ts/lib/function';
import { equals } from 'ramda';
import {
  Parser,
  ParsingInput,
  Validation,
  structSummarizerParsing,
} from './invariant-validation';

export type ValueObject<T> = {
  readonly props: T;
  readonly _tag: string;
};

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

const getTag = <T>(vo: ValueObject<T>) => vo._tag;

const unpack = <T>(vo: ValueObject<T>) => vo.props;

export const structParsing = <ET extends ValueObject<unknown>>(
  raw: ParsingInput<ET['props']>,
) => structSummarizerParsing<ET['props']>(raw);

export const ValueObjectAuFn = {
  construct,
  isEqual,
  getTag,
  unpack,
  structParsing,
};

export interface ValueObjectTrait<VO> {
  parse: Parser<VO>;
  new: (params: unknown) => Validation<VO>;
}
