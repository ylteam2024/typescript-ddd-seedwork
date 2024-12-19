import { Repository, FindOptionsWhere, FindOptionsOrder } from 'typeorm';
import {
  FindManyPaginatedParams,
  RepositoryPort,
  DataWithPaginationMeta,
} from '@ports/repository.base';
import { Logger } from '@ports/logger.base';
import { Arr, pipe, TE, Option, Either } from '@logic/fp';
import { BaseException, BaseExceptionTrait } from '@logic/exception.base';
import { AggregateRoot } from '@model/aggregate-root.base';
import { Identifier } from 'src/typeclasses/obj-with-id';
import { AggregateTypeORMEntityBase } from './base-entity';
import { BaseAggregateQueryParams } from './base-repository-with-mapper';

export abstract class TypeormRepositoryBase<
  Entity extends AggregateRoot,
  OrmEntity extends AggregateTypeORMEntityBase,
  QueryParams extends BaseAggregateQueryParams = BaseAggregateQueryParams,
> implements RepositoryPort<Entity>
{
  protected abstract relations: string[];
  protected tableName: string;

  constructor(
    protected readonly repository: Repository<OrmEntity>,
    protected readonly logger: Logger,
  ) {
    this.tableName = repository.metadata.tableName;
  }

  // Abstract methods for conversion
  protected abstract toDomain(
    ormEntity: OrmEntity,
  ): Either.Either<BaseException, Entity>;
  protected abstract toEntity(
    domain: Entity,
    initial: Option.Option<OrmEntity>,
  ): TE.TaskEither<BaseException, OrmEntity>;
  protected abstract prepareQuery(
    params: QueryParams,
  ): FindOptionsWhere<OrmEntity>;

  save(entity: Entity): TE.TaskEither<BaseException, void> {
    return pipe(
      this.toEntity(entity, Option.none),
      TE.chain((ormEntity) =>
        TE.tryCatch(
          async () => {
            await this.repository.save(ormEntity);
          },
          (error) =>
            BaseExceptionTrait.construct(
              'SAVE_AGGREGATE_FIELD',
              `Failed to save aggregate: ${error}`,
            ),
        ),
      ),
    );
  }

  add(entity: Entity): TE.TaskEither<BaseException, void> {
    return pipe(
      this.toEntity(entity, Option.none),
      TE.chain((ormEntity) =>
        TE.tryCatch(
          async () => {
            await this.repository.save(ormEntity);
          },
          (error) =>
            BaseExceptionTrait.construct(
              'SAVE_AGGREGATE_FIELD',
              `Failed to save aggregate: ${error}`,
            ),
        ),
      ),
    );
  }

  saveMultiple(entities: Entity[]): TE.TaskEither<BaseException, void> {
    if (entities.length === 0) {
      return TE.right(undefined);
    }

    return pipe(
      entities,
      Arr.traverse(TE.ApplicativeSeq)((entity) =>
        pipe(this.toEntity(entity, Option.none)),
      ),
      TE.chain((ormEntities) =>
        TE.tryCatch(
          async () => {
            await this.repository.save(ormEntities);
          },
          (error) =>
            BaseExceptionTrait.construct(
              'ENTITY_SAVE_FAILED',
              `Failed to save aggregate in batch: ${error}`,
            ),
        ),
      ),
    );
  }

  findOne(
    params: Partial<QueryParams> = {},
  ): TE.TaskEither<BaseException, Option.Option<Entity>> {
    return pipe(
      TE.tryCatch(
        async () => {
          const entity = await this.repository.findOne({
            where: this.prepareQuery(params as QueryParams),
            relations: this.relations,
          });
          return entity;
        },
        (error) =>
          BaseExceptionTrait.construct(
            'FIND_ONE_FAILED',
            `Failed to find entity: ${error}`,
          ),
      ),
      TE.chain((entity) =>
        entity
          ? pipe(this.toDomain(entity), Either.map(Option.some), TE.fromEither)
          : TE.right(Option.none),
      ),
    );
  }

  findOneOrThrow(
    params: Partial<QueryParams> = {},
  ): TE.TaskEither<BaseException, Entity> {
    return pipe(
      this.findOne(params),
      TE.chain((optionEntity) =>
        pipe(
          optionEntity,
          Option.fold(
            () =>
              TE.left(
                BaseExceptionTrait.construct(
                  'FIND_ONE_FAILED_NOT_FOUND',
                  `Failed to find aggregate`,
                ),
              ),
            TE.right,
          ),
        ),
      ),
    );
  }

  findOneByIdOrThrow(id: Identifier): TE.TaskEither<BaseException, Entity> {
    return pipe(
      TE.tryCatch(
        async () => {
          const entity = await this.repository.findOne({
            where: { id } as unknown as FindOptionsWhere<OrmEntity>,
            relations: this.relations,
          });
          if (!entity) {
            throw new Error(`Entity with id ${id} not found`);
          }
          return entity;
        },
        (error) =>
          BaseExceptionTrait.construct(
            'FIND_ONE_BY_ID_FAILED',
            `Failed to find entity by id: ${error}`,
          ),
      ),
      TE.chain((entity) => pipe(this.toDomain(entity), TE.fromEither)),
    );
  }

  findMany(
    params: Partial<QueryParams> = {},
  ): TE.TaskEither<BaseException, Entity[]> {
    return pipe(
      TE.tryCatch(
        async () => {
          const entities = await this.repository.find({
            where: this.prepareQuery(params as QueryParams),
            relations: this.relations,
          });
          return entities;
        },
        (error) =>
          BaseExceptionTrait.construct(
            'FIND_MANY_FAILED',
            `Failed to find entities: ${error}`,
          ),
      ),
      TE.chain((entities) =>
        pipe(
          entities,
          Arr.traverse(TE.ApplicativeSeq)((entity) =>
            pipe(this.toDomain(entity), TE.fromEither),
          ),
        ),
      ),
    );
  }

  findManyPaginated({
    params = {} as any,
    pagination,
    orderBy,
  }: FindManyPaginatedParams<QueryParams>): TE.TaskEither<
    BaseException,
    DataWithPaginationMeta<Entity[]>
  > {
    const skip =
      pagination?.skip ??
      (pagination?.page
        ? (pagination.page - 1) * (pagination?.limit ?? 10)
        : 0);
    const take = pagination?.limit ?? 10;

    return pipe(
      TE.Do,
      TE.bind('total', () =>
        TE.tryCatch(
          async () =>
            this.repository.count({
              where: this.prepareQuery(params as QueryParams),
            }),
          (error) =>
            BaseExceptionTrait.construct(
              'COUNT_ENTITY_FAILED',
              `Failed to count entities: ${error}`,
            ),
        ),
      ),
      TE.bind('entities', () =>
        TE.tryCatch(
          async () =>
            this.repository.find({
              where: this.prepareQuery(params as QueryParams),
              skip,
              take,
              order: orderBy as FindOptionsOrder<OrmEntity>,
              relations: this.relations,
            }),
          (error) =>
            BaseExceptionTrait.construct(
              'PAGINATED_ENTITY_FAILED',
              `Failed to find paginated entities: ${error}`,
            ),
        ),
      ),
      TE.chain(({ total, entities }) =>
        pipe(
          entities,
          Arr.traverse(TE.ApplicativeSeq)((entity) =>
            pipe(this.toDomain(entity), TE.fromEither),
          ),
          TE.map((domainEntities) => ({
            data: domainEntities,
            count: total,
            limit: take,
            page: pagination?.page ?? Math.floor(skip / take) + 1,
          })),
        ),
      ),
    );
  }

  delete(entity: Entity): TE.TaskEither<BaseException, void> {
    return TE.tryCatch(
      async () => {
        await this.repository.delete(entity.id);
      },
      (error) =>
        BaseExceptionTrait.construct(
          'DELETE_ENTITY_FAILED',
          `Failed to delete entity: ${error}`,
        ),
    );
  }
}
