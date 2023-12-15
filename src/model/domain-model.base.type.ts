import { RRecord, Option } from '@logic/fp';
import { ParsingInput, Validation } from './invariant-validation';

export type DomainModel<T = RRecord.ReadonlyRecord<string, any>> = {
  readonly props: T;
  readonly _tag: string;
};

export type GetProps<T extends DomainModel> = T['props'];

export type KeyProps<T extends DomainModel> = keyof T['props'];

export type SimpleQuery<T extends DomainModel, R> = (domainModel: T) => R;
export type SimpleQueryOpt<T extends DomainModel, R> = (
  domainModel: T,
) => Option.Option<R>;

export interface IGenericDomainModelTrait {
  simpleQuery: <T extends DomainModel, R>(
    a: keyof T['props'],
  ) => SimpleQuery<T, R>;
  simpleQueryOpt: <T extends DomainModel, R>(
    a: keyof T['props'],
  ) => SimpleQueryOpt<T, R>;
  getTag: (dV: DomainModel) => string;
  unpack: (dV: DomainModel) => RRecord.ReadonlyRecord<string, any>;
  structParsingProps: <T extends DomainModel>(
    raw: ParsingInput<T['props']>,
  ) => Validation<T['props']>;
}
