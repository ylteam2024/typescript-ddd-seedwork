import { Either, RRecord } from '@logic/fp';
import { DomainModel } from './domain-model.base.type';
import { ObjectWithId } from 'src/typeclasses';
import { WithTime } from 'src/typeclasses/withtime';
import { Liken, Parser, ValidationErr } from './invariant-validation';
import { BehaviorMonad } from './domain-model-behavior.monad';
import { VOLiken, ValueObject } from './value-object.base';

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

export type EntityLiken<T extends Entity> = { id?: unknown } & Liken<
  Omit<EntityCommonProps, '_tag' | 'id'>
> & {
    [K in keyof T['props']]: T['props'][K] extends Entity
      ? EntityLiken<T['props'][K]>
      : T['props'][K] extends Array<unknown> & { [key: number]: Entity }
        ? EntityLiken<T['props'][K][0]>[]
        : T['props'][K] extends ValueObject
          ? VOLiken<T['props'][K]>
          : T['props'][K] extends Array<unknown> & {
                [key: number]: ValueObject;
              }
            ? VOLiken<T['props'][K][0]>[]
            : Liken<T['props'][K]>;
  };

export type EntityInvariantParser<
  T extends Entity,
  IsPropAttr extends boolean,
  V extends IsPropAttr extends true ? T['props'][keyof T['props']] : unknown,
> = (entity: T) => Parser<V>;

export type CommandOnModel<DM extends Entity> = (
  domainModel: DM,
) => Either.Either<ValidationErr, BehaviorMonad<DM>>;

export type SimpleSeter<DM extends Entity, V> = (newV: V) => CommandOnModel<DM>;

export type SimpleAdder<ET extends Entity, V> = (v: V) => CommandOnModel<ET>;

export type SimpleRemover<ET extends Entity, V> = SimpleAdder<ET, V>;
