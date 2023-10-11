import { Optics, Option, pipe } from '@logic/fp';
import { FirstArgumentType } from '@type_util/function';

export class DomainModel<T = unknown> {
  readonly props: T;
  readonly _tag: string;
}

export type GetProps<T extends DomainModel> = T['props'];

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

const getTag = <T>(m: DomainModel<T>) => m._tag;

const unpack = <T>(m: DomainModel<T>) => m.props;

export class DomainModelTrait<T extends DomainModel> {
  simpleQuery = <R>(a: FirstArgumentType<typeof simpleQuery<T, R>>) =>
    simpleQuery<T, R>(a);
  simpleQueryOpt = <R>(a: FirstArgumentType<typeof simpleQueryOpt<T, R>>) =>
    simpleQueryOpt<T, R>(a);
  getTag = getTag<T>;
  unpack = unpack<T>;
}
