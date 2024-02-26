import { RRecord } from '@logic/fp';
import {
  EntityGenericTrait,
  EntityTrait,
  IEntityGenericTrait,
  getEntityGenericTraitForType,
} from './entity.base';
import { Entity, EntityLiken } from './entity.base.type';
import { BaseDMTraitFactoryConfig, getBaseDMTrait } from './domain-model.base';

export type AggregateRoot<
  T extends RRecord.ReadonlyRecord<string, any> = RRecord.ReadonlyRecord<
    string,
    any
  >,
> = Entity<T>;

export interface AggregateTrait<E extends AggregateRoot, NewParams = any>
  extends EntityTrait<E, NewParams> {}

export type AggregateLiken<A extends AggregateRoot, OV = {}> = EntityLiken<
  A,
  OV
>;

interface IAggGenericTrait extends IEntityGenericTrait {}

export const AggGenericTrait: IAggGenericTrait = {
  ...EntityGenericTrait,
};

export const getAggGenericTraitForType = <E extends AggregateRoot>() =>
  getEntityGenericTraitForType<E>();

export const getBaseAGTrait = <A extends AggregateRoot, I = AggregateLiken<A>>(
  config: BaseDMTraitFactoryConfig<A, I>,
) => getBaseDMTrait<A, I>(AggGenericTrait.factory)(config);
