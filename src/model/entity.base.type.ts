import { Either, RRecord } from '@logic/fp';
import { DomainModel } from './domain-model.base.type';
import { ObjectWithId } from 'src/typeclasses';
import { WithTime } from 'src/typeclasses/withtime';
import { Liken, Parser, ValidationErr } from './invariant-validation';
import { BehaviorMonad } from './domain-model-behavior.monad';

// use type here can break the EntityLiken
export interface Entity<
  T extends RRecord.ReadonlyRecord<string, any> = RRecord.ReadonlyRecord<
    string,
    any
  >,
> extends DomainModel<T>,
    ObjectWithId,
    WithTime {}

export type EntityCommonProps = Omit<Entity, 'props'>;

export type EntityLiken<T extends Entity> = Liken<
  Omit<EntityCommonProps, '_tag'>
> & {
  [K in keyof T['props']]: T['props'][K] extends Entity
    ? EntityLiken<T['props'][K]>
    : T['props'][K] extends Array<unknown> & { [key: number]: Entity }
      ? EntityLiken<T['props'][K][0]>[]
      : Liken<T['props'][K]>;
};

export type EntityInvariantParser<
  T extends Entity,
  IsPropAttr extends boolean,
  V extends IsPropAttr extends true ? T['props'][keyof T['props']] : unknown,
> = (entity: T) => Parser<V>;

export type SimpleSeter<T extends Entity, V> = (
  newV: V,
) => (domainModel: T) => Either.Either<ValidationErr, BehaviorMonad<T>>;

export type SimpleAdder<ET extends Entity, V> = (
  v: V,
) => (entity: ET) => Either.Either<ValidationErr, BehaviorMonad<ET>>;

export type SimpleRemover<ET extends Entity, V> = SimpleAdder<ET, V>;
