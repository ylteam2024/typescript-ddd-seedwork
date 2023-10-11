import {
  Entity,
  EntityGenericTrait,
  EntityLiken,
  EntityTrait,
} from './entity.base';

export type AggregateRoot<T> = Entity<T>;

export const AggregateGenericTrait = EntityGenericTrait;

export type AggregateTrait<E extends AggregateRoot<unknown>> = EntityTrait<E>;

export type AggregateLiken<A extends AggregateRoot<unknown>> = EntityLiken<A>;
