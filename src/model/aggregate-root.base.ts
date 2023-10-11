import { Entity, EntityLiken, EntityTrait } from './entity.base';

export type AggregateRoot<T = unknown> = Entity<T>;

export abstract class AggregateTrait<
  E extends AggregateRoot,
> extends EntityTrait<E> {}

export type AggregateLiken<A extends AggregateRoot> = EntityLiken<A>;
