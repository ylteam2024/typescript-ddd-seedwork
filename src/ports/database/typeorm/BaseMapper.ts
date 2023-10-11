/* eslint-disable new-cap */
/* eslint-disable @typescript-eslint/no-explicit-any */

import { Identifier } from '@model/Identifier';
import { AggregateRoot } from '@model/Aggregate';
import { CreateEntityProps } from '@model/Entity';
import { DateVO } from '@model/valueObjects/Date';
import { TypeormEntityBase } from './BaseEntity';

export type OrmEntityProps<OrmEntity> = Omit<
  OrmEntity,
  'id' | 'createdAt' | 'updatedAt'
>;

export interface EntityProps<IdentifierType extends Identifier<any>> {
  id?: IdentifierType;
}

export interface Mapper<
  Entity extends AggregateRoot<any>,
  OrmEntity extends TypeormEntityBase<any>,
> {
  toDomainEntity(
    ormEntity: OrmEntity,
    extraInfo: Record<string, any>,
  ): Promise<Entity>;

  toOrmEntity(
    entity: Entity,
    extraInfo: Record<string, any>,
  ): Promise<OrmEntity>;
}

export abstract class OrmMapper<
  IdentifierRawType extends string | number,
  IdentifierType extends Identifier<IdentifierRawType>,
  Entity extends AggregateRoot<IdentifierType>,
  OrmEntity extends TypeormEntityBase<IdentifierRawType>,
> implements Mapper<Entity, OrmEntity>
{
  constructor(
    private entityConstructor: new (
      props: CreateEntityProps<IdentifierType>,
    ) => Entity,
    private ormEntityConstructor: new (props: any) => OrmEntity,
  ) {}

  protected abstract toDomainProps(
    ormEntity: OrmEntity,
  ): Promise<EntityProps<IdentifierType>>;

  protected abstract toOrmProps(
    entity: Entity,
  ): Promise<OrmEntityProps<OrmEntity>>;

  async toDomainEntity(ormEntity: OrmEntity): Promise<Entity> {
    const { id, ...props } = await this.toDomainProps(ormEntity);
    const ormEntityBase: TypeormEntityBase<IdentifierRawType> =
      ormEntity as unknown as TypeormEntityBase<IdentifierRawType>;
    return new this.entityConstructor({
      id,
      ...props,
      createdAt: new DateVO(ormEntityBase.createdAt),
      updatedAt: new DateVO(ormEntityBase.updatedAt),
    });
  }

  async toOrmEntity(entity: Entity): Promise<OrmEntity> {
    const props = await this.toOrmProps(entity);
    const createdAt = entity.getCreatedAt();
    const updatedAt = entity.getUpdatedAt();
    return new this.ormEntityConstructor({
      ...props,
      id: entity.id() && entity.id().toValue(),
      updatedAt: updatedAt && updatedAt.getValue(),
      createdAt: createdAt && createdAt.getValue(),
    });
  }
}
