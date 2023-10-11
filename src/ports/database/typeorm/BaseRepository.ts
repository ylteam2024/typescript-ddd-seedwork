import {
  FindOptionsWhere,
  ObjectLiteral,
  Repository,
  FindOptionsOrder,
} from 'typeorm';
import {
  QueryParams,
  FindManyPaginatedParams,
  RepositoryPort,
  DataWithPaginationMeta,
} from '@ports/Repository';
import { Logger } from '@ports/Logger';
import { OrmMapper } from './BaseMapper';
import { TypeormEntityBase } from './BaseEntity';
import { Array, flow, pipe, TE, Option } from '@logic/fp';
import {
  BaseException,
  BaseExceptionBhv,
  unknownErrToBaseException,
} from '@logic/exception.base';
import { identity } from 'ramda';
import { AggregateRoot } from '@model/aggregate-root.base';
import { EntityTrait, Identifier } from '@model/entity.base';

export type WhereCondition<OrmEntity> =
  | FindOptionsWhere<OrmEntity>[]
  | FindOptionsWhere<OrmEntity>[]
  | ObjectLiteral
  | string;

export abstract class TypeormRepositoryBase<
  Entity extends AggregateRoot<unknown>,
  OrmEntity extends TypeormEntityBase<string>,
> implements RepositoryPort<Entity>
{
  protected constructor(
    protected readonly repository: Repository<OrmEntity>,
    protected readonly mapper: OrmMapper<Identifier, Entity, OrmEntity>,
    protected readonly logger: Logger,
  ) {}

  /**
   * Specify relations to other tables.
   * For example: `relations = ['user', ...]`
   */
  protected abstract relations: string[];

  protected tableName = this.repository.metadata.tableName;

  protected abstract prepareQuery(
    params: QueryParams,
  ): FindOptionsWhere<OrmEntity>;

  save(entity: Entity): TE.TaskEither<BaseException, Entity> {
    return pipe(
      entity,
      this.mapper.toOrmEntity,
      TE.flatMap(TE.tryCatchK(this.repository.save, identity)),
      TE.tapIO(() =>
        this.logger.debug(
          `[${entity.constructor.name}] persisted ${EntityTrait.id(
            entity,
          ).toString()}`,
        ),
      ),
      TE.chain(this.mapper.toDomainEntity),
      TE.mapError(unknownErrToBaseException),
    );
  }

  add(entity: Entity): TE.TaskEither<BaseException, Entity> {
    return pipe(
      entity,
      this.mapper.toOrmEntity,
      TE.flatMap(TE.tryCatchK(this.repository.save, identity)),
      TE.tapIO((result) =>
        this.logger.debug(`[${entity.constructor.name}] persisted ${result}`),
      ),
      TE.flatMap(this.mapper.toDomainEntity),
      TE.mapError(unknownErrToBaseException),
    );
  }

  saveMultiple(entities: Entity[]) {
    return pipe(
      entities,
      Array.map(this.mapper.toOrmEntity),
      TE.sequenceArray,
      TE.flatMap(
        TE.tryCatchK(
          (ormEntities) => this.repository.save([...ormEntities]),
          identity,
        ),
      ),
      TE.tapIO(() =>
        this.logger.debug(
          `[${entities}]: persisted ${entities.map((entity) => entity.id)}`,
        ),
      ),
      TE.flatMap(flow(Array.map(this.mapper.toDomainEntity), TE.sequenceArray)),
      TE.mapError(unknownErrToBaseException),
    );
  }

  findOne(
    params: QueryParams = {},
  ): TE.TaskEither<BaseException, Option.Option<Entity>> {
    return pipe(
      { where: this.prepareQuery(params), relations: this.relations },
      TE.tryCatchK(this.repository.findOne, identity),
      TE.flatMap(
        flow(
          Option.fromNullable,
          Option.map(this.mapper.toDomainEntity),
          Option.sequence(TE.ApplicativeSeq),
        ),
      ),
      TE.mapError(unknownErrToBaseException),
    );
  }

  findOneOrThrow(
    params: QueryParams = {},
  ): TE.TaskEither<BaseException, Entity> {
    return pipe(
      params,
      this.findOne,
      TE.flatMap(
        Option.fold(
          () =>
            TE.left(
              BaseExceptionBhv.construct(
                `Entity not found ${JSON.stringify(params)}`,
                'NOT_FOUND',
              ),
            ),
          (entity) => TE.right(entity),
        ),
      ),
    );
  }

  findOneByIdOrThrow(id: Identifier): TE.TaskEither<BaseException, Entity> {
    return this.findOneOrThrow({ id });
  }

  findMany(params: QueryParams = {}): TE.TaskEither<BaseException, Entity[]> {
    return pipe(
      {
        where: this.prepareQuery(params),
        relations: this.relations,
      },
      TE.tryCatchK(this.repository.find, identity),
      TE.flatMap(flow(Array.map(this.mapper.toDomainEntity), TE.sequenceArray)),
      TE.map((foundEntities) => [...foundEntities]),
      TE.mapError(unknownErrToBaseException),
    );
  }

  findManyPaginated({
    params = {},
    pagination,
    orderBy,
  }: FindManyPaginatedParams): TE.TaskEither<
    BaseException,
    DataWithPaginationMeta<Entity[]>
  > {
    return pipe(
      {
        skip: pagination?.skip,
        take: pagination?.limit,
        where: this.prepareQuery(params),
        order: orderBy as FindOptionsOrder<OrmEntity>,
        relations: this.relations,
      },
      TE.tryCatchK(this.repository.findAndCount, identity),
      TE.flatMap(([data, count]) =>
        pipe(
          data,
          Array.map(this.mapper.toDomainEntity),
          TE.sequenceArray,
          TE.map((entities) => ({
            data: [...entities],
            count,
            limit: pagination?.limit,
            page: pagination?.page,
          })),
        ),
      ),
      TE.mapError(unknownErrToBaseException),
    );
  }

  delete(entity: Entity): TE.TaskEither<BaseException, unknown> {
    return pipe(
      entity,
      this.mapper.toOrmEntity,
      TE.flatMap(TE.tryCatchK(this.repository.remove, identity)),
      TE.tapIO(() =>
        this.logger.debug(
          `[${entity.constructor.name}] deleted ${EntityTrait.id(entity)}`,
        ),
      ),
      TE.mapError(unknownErrToBaseException),
    );
  }

  protected correlationId?: string;

  setCorrelationId(correlationId: string): this {
    this.correlationId = correlationId;
    this.setContext();
    return this;
  }

  private setContext() {
    if (this.correlationId) {
      this.logger.setContext(`${this.constructor.name}:${this.correlationId}`);
    } else {
      this.logger.setContext(this.constructor.name);
    }
  }
}
