import {
  FindOptionsWhere,
  ObjectLiteral,
  Repository,
  FindOptionsOrder,
} from 'typeorm';
import {
  FindManyPaginatedParams,
  RepositoryPort,
  DataWithPaginationMeta,
} from '@ports/repository.base';
import { Logger } from '@ports/logger.base';
import { AggregateTypeORMEntityBase } from './base-entity';
import { Arr, flow, pipe, TE, Option, absordTE } from '@logic/fp';
import {
  BaseException,
  BaseExceptionBhv,
  unknownErrToBaseException,
} from '@logic/exception.base';
import { identity } from 'ramda';
import { AggregateRoot } from '@model/aggregate-root.base';
import {
  EntityGenericTrait,
  getEntityGenericTraitForType,
} from '@model/entity.base';
import { Identifier } from 'src/typeclasses/obj-with-id';
import { DataMapper } from '@ports/mapper.base';

export type WhereCondition<OrmEntity> =
  | FindOptionsWhere<OrmEntity>[]
  | FindOptionsWhere<OrmEntity>[]
  | ObjectLiteral
  | string;

export interface BaseAggregateQueryParams {
  id: Identifier;
}

export abstract class TypeormRepositoryBase<
  Entity extends AggregateRoot,
  OrmEntity extends AggregateTypeORMEntityBase,
  QueryParams extends BaseAggregateQueryParams = BaseAggregateQueryParams,
> implements RepositoryPort<Entity>
{
  entityTrait = getEntityGenericTraitForType<Entity>();
  protected constructor(
    protected readonly repository: Repository<OrmEntity>,
    protected readonly mapper: DataMapper<Entity, OrmEntity>,
    protected readonly logger: Logger,
  ) {}

  /**
   * Specify relations to other tables.
   * For example: `relations = ['user', ...]`
   */
  protected abstract relations: string[];

  protected tableName = this.repository.metadata.tableName;

  protected abstract prepareQuery(
    params: Partial<QueryParams>,
  ): FindOptionsWhere<OrmEntity>;

  save(entity: Entity): TE.TaskEither<BaseException, void> {
    return pipe(
      entity,
      EntityGenericTrait.id<Entity>,
      this.findOneDataModelByIdOrThrow,
      TE.flatMap((currentDataIns) =>
        pipe(
          { domainModel: entity, initState: Option.some(currentDataIns) },
          this.mapper.toData,
          TE.fromEither,
        ),
      ),
      TE.flatMap(TE.tryCatchK(this.repository.save, identity)),
      TE.tapIO(() =>
        this.logger.debug(
          `[${entity.constructor.name}] persisted ${this.entityTrait
            .id(entity)
            .toString()}`,
        ),
      ),
      TE.mapError(unknownErrToBaseException),
      absordTE,
    );
  }

  add(entity: Entity): TE.TaskEither<BaseException, void> {
    return pipe(
      { domainModel: entity, initState: Option.none },
      this.mapper.toData,
      TE.fromEither,
      TE.flatMap(TE.tryCatchK(this.repository.save, identity)),
      TE.tapIO((result) =>
        this.logger.debug(`[${entity.constructor.name}] persisted ${result}`),
      ),
      TE.mapError(unknownErrToBaseException),
      absordTE,
    );
  }

  saveMultiple(entities: Entity[]) {
    return pipe(
      entities,
      Arr.map((entity) =>
        pipe(
          entity,
          EntityGenericTrait.id,
          this.findOneDataModelByIdOrThrow,
          TE.map((dE) => ({ initState: Option.some(dE), domainModel: entity })),
          TE.flatMap(flow(this.mapper.toData, TE.fromEither)),
        ),
      ),
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
      TE.mapError(unknownErrToBaseException),
      absordTE,
    );
  }

  findOneDataModelById(
    id: Identifier,
  ): TE.TaskEither<BaseException, Option.Option<OrmEntity>> {
    return pipe(
      {
        where: this.prepareQuery({ id } as Partial<QueryParams>),
      },
      TE.tryCatchK(this.repository.findOne, identity),
      TE.map(Option.fromNullable),
      TE.mapError((e) =>
        BaseExceptionBhv.construct(
          (e as Error).message,
          'FIND_DATA_MODEL_BY_ID_ERROR',
        ),
      ),
    );
  }

  findOneDataModelByIdOrThrow(
    id: Identifier,
  ): TE.TaskEither<BaseException, OrmEntity> {
    return pipe(
      id,
      this.findOneDataModelById,
      TE.flatMap(
        Option.match(
          () =>
            TE.left(
              BaseExceptionBhv.construct(
                'entity not found',
                'ENTITY_NOT_FOUND',
              ),
            ),
          (dE) => TE.right(dE),
        ),
      ),
    );
  }

  findOne(
    params: Partial<QueryParams> = {},
  ): TE.TaskEither<BaseException, Option.Option<Entity>> {
    return pipe(
      { where: this.prepareQuery(params), relations: this.relations },
      TE.tryCatchK(this.repository.findOne, identity),
      TE.flatMap(
        flow(
          Option.fromNullable,
          Option.map(flow(this.mapper.toDomain, TE.fromEither)),
          Option.sequence(TE.ApplicativeSeq),
        ),
      ),
      TE.mapError(unknownErrToBaseException),
    );
  }

  findOneOrThrow(
    params: Partial<QueryParams> = {},
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
    return this.findOneOrThrow({ id } as Partial<QueryParams>);
  }

  findMany(
    params: Partial<QueryParams> = {},
  ): TE.TaskEither<BaseException, Entity[]> {
    return pipe(
      {
        where: this.prepareQuery(params),
        relations: this.relations,
      },
      TE.tryCatchK(this.repository.find, identity),
      TE.flatMap(
        flow(
          Arr.map(flow(this.mapper.toDomain, TE.fromEither)),
          TE.sequenceArray,
        ),
      ),
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
          Arr.map(flow(this.mapper.toDomain, TE.fromEither)),
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

  delete(entity: Entity): TE.TaskEither<BaseException, void> {
    return pipe(
      entity,
      EntityGenericTrait.id,
      this.findOneDataModelByIdOrThrow,
      TE.flatMap(TE.tryCatchK(this.repository.remove, identity)),
      TE.tapIO(() =>
        this.logger.debug(
          `[${entity.constructor.name}] deleted ${this.entityTrait.id(entity)}`,
        ),
      ),
      TE.mapError(unknownErrToBaseException),
      absordTE,
    );
  }

  protected correlationId?: string;

  setCorrelationId(correlationId: string): this {
    this.correlationId = correlationId;
    return this;
  }
}
