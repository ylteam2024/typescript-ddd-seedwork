import { RRecord, Record } from '@logic/fp';
import { DomainModel } from './domain-model.base.type';
import { ObjectWithId } from 'src/typeclasses';
import { WithTime } from 'src/typeclasses/withtime';
import { Liken, Parser } from './invariant-validation';
import { VOLiken, ValueObject } from './value-object.base';
import { ParserFactory } from './domain-model.base';
import { CommandOnModel } from './entity.command-on-model';

// use type here can break the EntityLiken
export interface Entity<
  T extends Record<string, any> = RRecord.ReadonlyRecord<string, any>,
> extends DomainModel<Readonly<T>>,
    ObjectWithId,
    WithTime {}

export type EntityCommonProps = Omit<Entity, 'props'>;

export type EntityLiken<T extends Entity, OV = {}> = WithEntityMetaInput<
  {
    [K in keyof Omit<T['props'], keyof OV>]: T['props'][K] extends Entity
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
  } & OV
>;

export type WithEntityMetaInput<OriginInput> = OriginInput &
  Liken<Omit<EntityCommonProps, '_tag' | 'id'>> & { id?: unknown };

export type EntityInvariantParser<
  T extends Entity,
  IsPropAttr extends boolean,
  V extends IsPropAttr extends true ? T['props'][keyof T['props']] : unknown,
> = (entity: T) => Parser<V>;

export type SimpleSeter<DM extends Entity, V> = (newV: V) => CommandOnModel<DM>;

export type SimpleAdder<ET extends Entity, V> = (v: V) => CommandOnModel<ET>;

export type SimpleRemover<ET extends Entity, V> = SimpleAdder<ET, V>;

export type ParserOpt = {
  autoGenId: boolean;
};

export type EntityParserFactory<I = unknown> = ParserFactory<
  Entity,
  I,
  ParserOpt
>;
