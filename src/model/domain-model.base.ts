import { Optics, Option, pipe } from '@logic/fp';
import { FirstArgumentType } from '@type_util/function';
import { Parser, ParsingInput, Validation } from './invariant-validation';
import { structSummarizerParsing } from './parser';
import {
  DomainModel,
  IGenericDomainModelTrait,
} from './domain-model.base.type';

const modelPropsLen = <A extends DomainModel<unknown>>() =>
  Optics.id<A>().at('props') as Optics.Lens<A, A['props']>;

const simpleQuery =
  <T extends DomainModel, R>(key: keyof T['props']) =>
  (entity: T) =>
    pipe(entity, Optics.get(modelPropsLen<T>().at(key))) as R;

const simpleQueryOpt =
  <T extends DomainModel, R>(key: keyof T['props']) =>
  (entity: T) =>
    pipe(entity, Optics.get(modelPropsLen<T>().at(key))) as Option.Option<R>;

const getTag = <T extends DomainModel>(m: T) => m._tag;

const unpack = <T extends DomainModel>(m: T): T['props'] => m.props;

export const structParsingProps = <ET extends DomainModel>(
  raw: ParsingInput<ET['props']>,
) => structSummarizerParsing<ET['props']>(raw);

export const GenericDomainModelTrait: IGenericDomainModelTrait = {
  simpleQuery: <T extends DomainModel, R>(
    a: FirstArgumentType<typeof simpleQuery<T, R>>,
  ) => simpleQuery<T, R>(a),
  simpleQueryOpt: <T extends DomainModel, R>(
    a: FirstArgumentType<typeof simpleQueryOpt<T, R>>,
  ) => simpleQueryOpt<T, R>(a),
  getTag: getTag,
  unpack: unpack,
  structParsingProps,
};

export interface DomainModelTrait<D extends DomainModel> {
  parse: Parser<D>;
  new: (params: any) => Validation<D>;
}

export type IsEqual<T extends DomainModel = DomainModel> = (
  a: T,
  b: T,
) => boolean;
