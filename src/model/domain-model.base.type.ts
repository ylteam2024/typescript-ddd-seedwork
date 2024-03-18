import { RRecord, Option } from '@logic/fp';
import { ParsingInput, Validation } from './invariant-validation';
import { GetProps, HasProps, KeyProps } from 'src/typeclasses/has-props';

export type DomainModel<
  T extends RRecord.ReadonlyRecord<string, any> = RRecord.ReadonlyRecord<
    string,
    any
  >,
> = HasProps<T> & {
  readonly _tag: string;
};

export type SimpleQuery<T extends DomainModel, R> = (domainModel: T) => R;
export type SimpleQueryOpt<T extends DomainModel, R> = (
  domainModel: T,
) => Option.Option<R>;

export interface IGenericDomainModelTrait {
  simpleQuery: <T extends DomainModel, R>(a: KeyProps<T>) => SimpleQuery<T, R>;
  simpleQueryOpt: <T extends DomainModel, R>(
    a: KeyProps<T>,
  ) => SimpleQueryOpt<T, R>;
  getTag: (dV: DomainModel) => string;
  unpack: <T extends DomainModel>(dV: T) => GetProps<T>;
  structParsingProps: <T extends DomainModel>(
    raw: ParsingInput<GetProps<T>>,
  ) => Validation<GetProps<T>>;
}
