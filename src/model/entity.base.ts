import { curry } from 'ramda';
import { IValidate, Parser, Validation } from './invariant-validation';
import {
  Array,
  Either,
  Eq,
  NEA,
  Optics,
  Option,
  ReadonlyRecord,
  S,
} from '@logic/fp';
import { apply, pipe } from 'fp-ts/lib/function';
import { DomainEvent } from './event';
import { BehaviorMonadTrait } from './domain-behavior.monad';
import { isArray } from 'util';
import { BaseExceptionBhv } from '@logic/exception.base';

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

const entityPropsLen = <A extends Entity<unknown>>() =>
  Optics.id<A>().at('props') as Optics.Lens<A, A['props']>;

const createdAt = <T>(state: Entity<T>) =>
  pipe(state, Optics.get(entityMetaLens('createdAt'))) as Date;

const updatedAt = <T>(state: Entity<T>) =>
  pipe(state, Optics.get(entityMetaLens('updatedAt')));

const markUpdate = <T>(state: Entity<T>) =>
  pipe(state, Optics.replace(entityMetaLens('updatedAt'))(new Date()));

const queryProps =
  <A extends Entity<unknown>>(state: A) =>
  (propKey: keyof A['props']) => {
    return pipe(state, Optics.get(entityPropsLen<A>().at(propKey)));
  };

export type Query<T, A> = (entity: T) => A;
export type QueryOpt<T, A> = (entity: T) => Option.Option<A>;

const simpleQuery =
  <T extends Entity<unknown>, R>(key: keyof T['props']) =>
  (entity: T) =>
    queryProps(entity)(key) as R;

const simpleQueryOpt =
  <T extends Entity<unknown>, R>(key: keyof T['props']) =>
  (entity: T) =>
    Option.fromNullable(queryProps(entity)(key) as R);

export type InvariantParser<
  T extends Entity<unknown>,
  IsPropAttr extends boolean,
  V extends IsPropAttr extends true ? T['props'][keyof T['props']] : unknown,
> = (entity: T) => Parser<V>;

export const identityInvariantParser =
  <T extends Entity<unknown>, V extends T['props'][keyof T['props']]>() =>
  (v: V) =>
    Either.of(v);

const setter =
  <T extends Entity<unknown>, V extends T['props'][keyof T['props']]>(
    attributeName: keyof T['props'],
  ) =>
  (validator: InvariantParser<T, true, V>, events: DomainEvent[]) =>
  (newV: unknown) =>
  (entity: T) => {
    return pipe(
      newV,
      validator(entity),
      Either.map((v) =>
        pipe(
          Optics.replace(entityPropsLen<T>().at(attributeName)),
          apply(v),
          apply(entity),
          (updatedEntity: T) => BehaviorMonadTrait.of(updatedEntity, events),
        ),
      ),
    );
  };

const adder =
  <T extends Entity<any>, A>(attributeName: keyof T['props']) =>
  ({
    E,
    validator,
    events,
  }: {
    E: Eq.Eq<A>;
    validator: InvariantParser<T, false, A>;
    events: DomainEvent[];
  }) =>
  (newItem: unknown) =>
  (entity: T) => {
    const lens = entityPropsLen<T>().at(attributeName);
    const getAttr = Optics.get(lens);
    const shouldBeArray = pipe(
      entity,
      getAttr,
      Either.fromPredicate(isArray, () =>
        NEA.of(
          BaseExceptionBhv.construct(
            `property ${attributeName as string} should be an array`,
            'PROP_NOT_ARRAY',
          ),
        ),
      ),
      Either.map((a) => a as A[]),
    );
    const validating = () => pipe(validator, apply(entity), apply(newItem));
    const mustNotExist = (arr: A[]) =>
      Either.fromPredicate(
        (a: A) => !Array.elem(E)(a)(arr),
        () => BaseExceptionBhv.construct('Item existed', 'ITEM_EXISTED'),
      );
    return pipe(
      shouldBeArray,
      Either.bindTo('array'),
      Either.bind('item', validating),
      Either.tap(({ item, array }) =>
        pipe(mustNotExist, apply(array), apply(item)),
      ),
      Either.flatMap(({ item, array }) =>
        Either.tryCatch(
          () =>
            Optics.replace(lens)([
              ...array,
              item,
            ] as T['props'][keyof T['props']])(entity),
          (e: Error) =>
            BaseExceptionBhv.construct(e.message, 'ADDER_OPTICS_CHANGE_ERROR'),
        ),
      ),
      Either.map((updatedEntity) =>
        BehaviorMonadTrait.of(updatedEntity, events),
      ),
    );
  };

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

const isEqual = <T extends Entity<unknown>>(entityLeft: T, entityRight: T) =>
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
  setter,
  simpleQueryOpt,
  propsLen: entityPropsLen,
  adder,
};
