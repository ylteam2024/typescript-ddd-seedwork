import { RRecord } from '@logic/fp';
import {
  EntityGenericTrait,
  EntityTrait,
  IEntityGenericTrait,
} from './entity.base';
import { Entity, EntityLiken } from './entity.base.type';

export type AggregateRoot<
  T extends RRecord.ReadonlyRecord<string, any> = RRecord.ReadonlyRecord<
    string,
    any
  >,
> = Entity<T>;

export interface AggregateTrait<E extends AggregateRoot>
  extends EntityTrait<E> {}

export type AggregateLiken<A extends AggregateRoot> = EntityLiken<A>;

interface IAggGenericTrait extends IEntityGenericTrait {}

export const AggGenericTrait: IAggGenericTrait = {
  ...EntityGenericTrait,
};
