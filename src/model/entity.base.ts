import { curry } from 'ramda';
import { IValidate } from './invariant-validation';
import { Either, Eq, Optics, Option, ReadonlyRecord, S } from '@logic/fp';
import { pipe } from 'fp-ts/lib/function';

export type Identifier = string;

export interface EntityCommonProps {
  readonly id: Identifier;
  readonly createdAt: Date;
  readonly updatedAt: Option.Option<Date>;
  readonly _tag: string;
}

export interface Entity<T> extends EntityCommonProps {
  readonly props: T;
}

const construct =
  <T>(validate: IValidate<T>) =>
  (tag: string) =>
  ({ id, createdAt, updatedAt }: Omit<EntityCommonProps, '_tag'>) =>
  (props: T) => {
    const state: Entity<T> = {
      id,
      createdAt,
      updatedAt,
      props: props,
      _tag: tag,
    };
    const a = pipe(validate(props), Either.as(state));
    return a;
  };

const idLens = <T>() => Optics.id<Entity<T>>().at('id');

const id = <T>(state: Entity<T>) => pipe(state, Optics.get(idLens<T>()));

const setId = curry(<T>(id: Identifier, state: Entity<T>) => {
  return pipe(state, Optics.replace(idLens<T>())(id));
});

const entityMetaLens = <T>(key: keyof EntityCommonProps) =>
  Optics.id<Entity<T>>().at(key);

const entityPropsLen = <T>(key: keyof T) =>
  Optics.id<Entity<T>>().at('props').at(key);

const createdAt = <T>(state: Entity<T>) =>
  pipe(state, Optics.get(entityMetaLens('createdAt'))) as Date;

const updatedAt = <T>(state: Entity<T>) =>
  pipe(state, Optics.get(entityMetaLens('updatedAt')));

const markUpdate = <T>(state: Entity<T>) =>
  pipe(state, Optics.replace(entityMetaLens('updatedAt'))(new Date()));

const queryProps =
  <T>(state: Entity<T>) =>
  (propKey: keyof T) => {
    return pipe(state, Optics.get(entityPropsLen(propKey)));
  };

export type Query<T, A> = (entity: T) => A;
export type QueryOpt<T, A> = (entity: T) => Option.Option<A>;

const simpleQuery =
  <T, R>(key: keyof T) =>
  (entity: Entity<T>) =>
    queryProps(entity)(key) as R;

const simpleQueryOpt =
  <T, R>(key: keyof T) =>
  (entity: Entity<T>) =>
    Option.fromNullable(queryProps(entity)(key) as R);

export const EntityEq: Eq.Eq<Entity<unknown>> = Eq.contramap(
  (entity: Entity<unknown>) => ({
    tag: entity._tag,
    id: entity.id,
  }),
)(
  Eq.struct({
    tag: S.Eq,
    id: S.Eq,
  }),
);

const isEqual = <T>(entityLeft: Entity<T>, entityRight: Entity<T>) =>
  EntityEq.equals(entityLeft, entityRight);

const getSnapshot = <T>(state: Entity<T>) =>
  ReadonlyRecord.fromRecord({
    createdAt: state.createdAt,
    updatedAt: state.createdAt,
    id: state.id,
    ...state.props,
  });

export const entityTrait = {
  construct,
  id,
  setId,
  createdAt,
  updatedAt,
  markUpdate,
  getSnapshot,
  isEqual,
  queryProps,
  simpleQuery,
  simpleQueryOpt,
  propsLen: entityPropsLen,
};
