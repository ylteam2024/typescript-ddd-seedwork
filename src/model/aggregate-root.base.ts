import { Entity, EntityLiken, EntityTrait } from './entity.base';

export type AggregateRoot<T> = Entity<T>;

export abstract class AggregateTrait<
  E extends AggregateRoot<unknown>,
> extends EntityTrait<E> {}

export type AggregateLiken<A extends AggregateRoot<unknown>> = EntityLiken<A>;
