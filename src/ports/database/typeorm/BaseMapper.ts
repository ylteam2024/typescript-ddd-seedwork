/* eslint-disable new-cap */
/* eslint-disable @typescript-eslint/no-explicit-any */

import { BaseExceptionBhv } from '@logic/exception.base';
import { Either, NEA, pipe, TE } from '@logic/fp';
import { Newtype } from 'newtype-ts';
import { AggregateRoot } from '@model/aggregate-root.base';
import { EntityGenericTrait, Identifier } from '@model/entity.base';
import { Validation } from '@model/invariant-validation';
import { TypeormEntityBase } from './BaseEntity';
import { validate } from 'uuid';

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
  OrmEntity extends TypeormEntityBase<any>,
> {
  toDomainEntity(
    ormEntity: OrmEntity,
    extraInfo: Record<string, any>,
  ): TE.TaskEither<unknown, Entity>;

  toOrmEntity(
    entity: Entity,
    extraInfo: Record<string, any>,
  ): TE.TaskEither<unknown, OrmEntity>;
}

export abstract class OrmMapper<
  IdentifierType extends Identifier,
  Entity extends AggregateRoot<any>,
  OrmEntity extends TypeormEntityBase<string>,
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
    const createdAt = EntityGenericTrait.createdAt(entity);
    const updatedAt = EntityGenericTrait.updatedAt(entity);
    return pipe(
      TE.Do,
      TE.bind('props', () => this.toOrmProps(entity)),
      TE.bind('id', () =>
        TE.fromEither(toOrmId(EntityGenericTrait.id(entity))),
      ),
      TE.map(
        ({ props, id }) =>
          new this.ormEntityConstructor({ ...props, id, updatedAt, createdAt }),
      ),
    );
  }
}
