/* eslint-disable new-cap */
/* eslint-disable @typescript-eslint/no-explicit-any */

import { BaseExceptionBhv } from '@logic/exception.base';
import { Either, NEA, pipe, TE } from '@logic/fp';
import { Newtype } from 'newtype-ts';
import { AggregateRoot } from '@model/aggregate-root.base';
import { getEntityGenericTraitForType } from '@model/entity.base';
import { Validation } from '@model/invariant-validation';
import { TypeormEntityBase } from './base-entity';
import { validate } from 'uuid';
import { Identifier } from 'src/typeclasses/obj-with-id';

export type OrmEntityProps<OrmEntity> = Omit<
  OrmEntity,
  'id' | 'createdAt' | 'updatedAt'
>;

interface IParseOrmId<T> {
  (domainId: Identifier): Validation<T>;
}

type UUIDTypeOrm = Newtype<{ readonly UUIDTypeOrm: unique symbol }, string>;

const defaultToOrmId: IParseOrmId<UUIDTypeOrm> = (domainId: Identifier) => {
  function isUuid(v: unknown): v is UUIDTypeOrm {
    return typeof v === 'string' && validate(v);
  }
  return pipe(
    domainId,
    Either.fromPredicate(isUuid, () =>
      NEA.of(
        BaseExceptionBhv.construct('UUID not in valid form', 'UUID_NOT_VALID'),
      ),
    ),
  );
};

export interface EntityProps<IdentifierType extends Identifier> {
  id?: IdentifierType;
}

export interface Mapper<
  Entity extends AggregateRoot<any>,
  OrmEntity extends TypeormEntityBase,
> {
  toDomainEntity(
    ormEntity: OrmEntity,
    extraInfo: Record<string, any>,
  ): TE.TaskEither<unknown, Entity>;

  toOrmEntity(
    entity: Entity,
    toOrmId: IParseOrmId<UUIDTypeOrm>,
  ): TE.TaskEither<unknown, OrmEntity>;
}

export abstract class OrmMapper<
  IdentifierType extends Identifier,
  Entity extends AggregateRoot<any>,
  OrmEntity extends TypeormEntityBase,
> implements Mapper<Entity, OrmEntity>
{
  constructor(
    private entityConstructor: new (props: unknown) => Entity,
    private ormEntityConstructor: new (props: any) => OrmEntity,
  ) {}

  protected abstract toDomainProps(
    ormEntity: OrmEntity,
  ): TE.TaskEither<unknown, EntityProps<IdentifierType>>;

  protected abstract toOrmProps(
    entity: Entity,
  ): TE.TaskEither<unknown, OrmEntityProps<OrmEntity>>;

  toDomainEntity(ormEntity: OrmEntity): TE.TaskEither<unknown, Entity> {
    return pipe(
      ormEntity,
      this.toDomainProps,
      TE.map(
        (props) =>
          new this.entityConstructor({
            ...props,
            createdAt: ormEntity.createdAt,
            updatedAt: ormEntity.updatedAt,
          }),
      ),
    );
  }

  toOrmEntity(
    entity: Entity,
    toOrmId: IParseOrmId<UUIDTypeOrm> = defaultToOrmId,
  ): TE.TaskEither<unknown, OrmEntity> {
    const entityGenericTrait = getEntityGenericTraitForType<Entity>();
    const createdAt = entityGenericTrait.createdAt(entity);
    const updatedAt = entityGenericTrait.updatedAt(entity);
    return pipe(
      TE.Do,
      TE.bind('props', () => this.toOrmProps(entity)),
      TE.bindW('id', () =>
        TE.fromEither(toOrmId(entityGenericTrait.id(entity))),
      ),
      TE.map(
        ({ props, id }) =>
          new this.ormEntityConstructor({ ...props, id, updatedAt, createdAt }),
      ),
    );
  }
}
