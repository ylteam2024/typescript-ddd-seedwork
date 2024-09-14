/**
 * @desc ValueObjects are objects that we determine their
 * equality through their structrual property.
 */

import { Either, Eq, Option, RRecord, Record, S } from '@logic/fp';
import { pipe } from 'fp-ts/lib/function';
import { equals } from 'ramda';
import {
  Liken,
  Parser,
  ParsingInput,
  Validation,
  ValidationErr,
  ValidationTrait,
} from './invariant-validation';
import {
  BaseDMTraitFactoryConfig,
  DomainModelTrait,
  GenericDomainModelTrait,
  StdPropsParser,
  getBaseDMTrait,
} from './domain-model.base';

import { DomainModel } from './domain-model.base.type';
import { structSummarizerParsing } from './parser';
import { BaseException, BaseExceptionTrait } from '@logic/exception.base';

export interface ValueObject<
  T extends Record<string, any> = RRecord.ReadonlyRecord<string, any>,
> extends DomainModel<Readonly<T>> {}

export const getVoEqual = <VO extends ValueObject>() =>
  Eq.struct({
    _tag: S.Eq,
    props: {
      equals: (p1, p2) => equals(p1, p2),
    },
  }) as Eq.Eq<VO>;

const isEqual = <VO extends ValueObject>(v1: VO, v2: VO) =>
  getVoEqual<VO>().equals(v1, v2);

const factory =
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

export type VOLiken<T extends ValueObject, OV = unknown> = T extends {
  likenType: infer U;
}
  ? U
  : OV extends Record<string, any>
    ? {
        [K in keyof Omit<
          T['props'],
          keyof OV
        >]: T['props'][K] extends Option.Option<infer OU>
          ? Option.Option<RecursiveWithArray<OU>>
          : RecursiveWithArray<T['props'][K]>;
      } & OV
    : {
        [K in keyof Omit<
          T['props'],
          keyof OV
        >]: T['props'][K] extends Option.Option<infer OU>
          ? Option.Option<RecursiveWithArray<OU>>
          : RecursiveWithArray<T['props'][K]>;
      };

type RecursiveWithArray<I> = I extends ValueObject
  ? VOLiken<I>
  : I extends Array<unknown> & {
        [key: number]: ValueObject;
      }
    ? VOLiken<I[0]>[]
    : Liken<I>;

const structParsing = <ET extends ValueObject>(
  raw: ParsingInput<ET['props']>,
) => structSummarizerParsing<ET['props']>(raw);

export interface ValueObjectTrait<
  VO extends ValueObject,
  NewParam = VOLiken<VO>,
  ParseParam = VOLiken<VO>,
> extends DomainModelTrait<VO, NewParam, ParseParam> {}

export interface PrimitiveVOTrait<VO, E extends ValidationErr = BaseException> {
  parse: Parser<VO>;
  new: (params: any) => Validation<VO, E>;
}

export const VOGenericTrait = {
  construct: factory,
  isEqual: isEqual,
  structParsingProps: GenericDomainModelTrait.structParsingProps,
  getTag: GenericDomainModelTrait.getTag,
  unpack: GenericDomainModelTrait.unpack,
  simpleQuery: GenericDomainModelTrait.simpleQuery,
  simpleQueryOpt: GenericDomainModelTrait.simpleQueryOpt,
};

export const getVOGenricTraitForType = <VO extends ValueObject>() => ({
  construct: factory<VO>,
  isEqual: isEqual<VO>,
  structParsingProps: GenericDomainModelTrait.structParsingProps<VO>,
  getTag: GenericDomainModelTrait.getTag,
  unpack: GenericDomainModelTrait.unpack,
  simpleQuery: GenericDomainModelTrait.simpleQuery,
  simpleQueryOpt: GenericDomainModelTrait.simpleQueryOpt,
});

export type VOStdPropsParser<
  VO extends ValueObject,
  I = unknown,
> = StdPropsParser<VO, I>;

export const getPrimitiveVOTrait = <T>(config: {
  predicate: (v: unknown) => boolean;
  exceptionMsg?: string;
  exceptionCode?: string;
}): PrimitiveVOTrait<T, BaseException> => {
  const parse = (v: unknown) =>
    ValidationTrait.fromPredicate(config.predicate, () =>
      BaseExceptionTrait.construct(
        config.exceptionMsg || 'invalid value',
        config.exceptionCode || 'INVALID_VALUE',
      ),
    )(v) as Validation<T, BaseException>;

  return {
    parse,
    new: parse,
  };
};

export const getBaseVOTrait = <VO extends ValueObject, I = VOLiken<VO>, P = I>(
  config: BaseDMTraitFactoryConfig<VO, I, P>,
) => getBaseDMTrait<VO, I, P>(VOGenericTrait.construct)(config);

export const ValueObjectAuFn = {
  construct: factory,
  isEqual,
  structParsing,
  getBaseVOTrait,
};
