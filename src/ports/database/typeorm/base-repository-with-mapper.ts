import {
  FindOptionsWhere,
  ObjectLiteral,
  Repository,
  FindOptionsOrder,
  EntityManager,
} from 'typeorm';
import {
  FindManyPaginatedParams,
  RepositoryPort,
  DataWithPaginationMeta,
} from '@ports/repository.base';
import { Logger } from '@ports/logger.base';
import { Arr, pipe, TE, Option } from '@logic/fp';
import { BaseException, BaseExceptionTrait } from '@logic/exception.base';
import { AggregateRoot } from '@model/aggregate-root.base';
import { Identifier } from 'src/typeclasses/obj-with-id';
import { IBaseMapper } from '@ports/mapper.base';

export type WhereCondition<OrmEntity> =
  | FindOptionsWhere<OrmEntity>[]
  | FindOptionsWhere<OrmEntity>[]
  | ObjectLiteral
  | string;

export interface BaseAggregateQueryParams {
  id: Identifier;
}

export abstract class BaseRepositoryWithMapper<
  A extends AggregateRoot,
  DE extends ObjectLiteral,
  QueryParams = any,
> implements RepositoryPort<A, QueryParams>
{
  protected correlationId?: string;

  constructor(
    protected readonly mapper: IBaseMapper<A, DE>,
    protected readonly repository: Repository<DE>,
    protected readonly logger: Logger,
    protected readonly defaultRelations: string[] = [],
  ) {}

  // Abstract method to prepare query from params
  protected abstract prepareQuery(params: QueryParams): FindOptionsWhere<DE>;

  save(aggregateRoot: A): TE.TaskEither<BaseException, void> {
    return pipe(
      this.mapper.toData({
        domainModel: aggregateRoot,
        initState: Option.none,
      }),
      TE.fromEither,
      TE.chain((dataEntity) =>
        TE.tryCatch(
          async () => {
            await this.repository.save(dataEntity);
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

  add(entity: A): TE.TaskEither<BaseException, void> {
    return pipe(
      this.mapper.toData({
        domainModel: entity,
        initState: Option.none,
      }),
      TE.fromEither,
      TE.chain((dataEntity) =>
        TE.tryCatch(
          async () => {
            await this.repository.insert(dataEntity);
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

  saveMultiple(entities: A[]): TE.TaskEither<BaseException, void> {
    if (entities.length === 0) {
      return TE.right(undefined);
    }

    return pipe(
      this.mapper.withTransaction((manager) =>
        pipe(
          entities,
          Arr.traverse(TE.ApplicativeSeq)((entity) =>
            pipe(
              this.mapper.toData({
                domainModel: entity,
                initState: Option.none,
              }),
              TE.fromEither,
              TE.chain((dataEntity) =>
                TE.tryCatch(
                  async () => {
                    await manager.save(dataEntity);
                  },
                  (error) =>
                    BaseExceptionTrait.construct(
                      'ENTITY_SAVE_FAILED',
                      `Failed to save entity in batch: ${error}`,
                    ),
                ),
              ),
            ),
          ),
          TE.map(() => undefined),
        ),
      ),
    );
  }

  findOneOrThrow(params: QueryParams): TE.TaskEither<BaseException, A> {
    return pipe(
      TE.tryCatch(
        async () => {
          const entity = await this.repository.findOne({
            where: this.prepareQuery(params),
            relations: this.defaultRelations,
          });
          if (!entity) {
            throw new Error('Entity not found');
          }
          return entity;
        },
        (error) =>
          BaseExceptionTrait.construct(
            'FIND_ONE_FAILED',
            `Failed to find entity: ${error}`,
          ),
      ),
      TE.chain((entity) => pipe(this.mapper.toDomain(entity), TE.fromEither)),
    );
  }

  findOneByIdOrThrow(id: Identifier): TE.TaskEither<BaseException, A> {
    return pipe(
      TE.tryCatch(
        async () => {
          const entity = await this.repository.findOne({
            where: { id } as unknown as FindOptionsWhere<DE>,
            relations: this.defaultRelations,
          });
          if (!entity) {
            throw new Error(`Entity with id ${id} not found`);
          }
          return entity;
        },
        (error) =>
          BaseExceptionTrait.construct(
            'FIND_ONE_FAILED',
            `Failed to find entity by id: ${error}`,
          ),
      ),
      TE.chain((entity) => pipe(this.mapper.toDomain(entity), TE.fromEither)),
    );
  }

  findMany(params: QueryParams): TE.TaskEither<BaseException, A[]> {
    return pipe(
      TE.tryCatch(
        async () => {
          const entities = await this.repository.find({
            where: this.prepareQuery(params),
            relations: this.defaultRelations,
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
            pipe(this.mapper.toDomain(entity), TE.fromEither),
          ),
        ),
      ),
    );
  }

  findManyPaginated(
    options: FindManyPaginatedParams<QueryParams>,
  ): TE.TaskEither<BaseException, DataWithPaginationMeta<A[]>> {
    const { params, pagination, orderBy } = options;
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
              where: params ? this.prepareQuery(params) : undefined,
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
              where: params ? this.prepareQuery(params) : undefined,
              skip,
              take,
              order: orderBy as FindOptionsOrder<DE>,
              relations: this.defaultRelations,
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
            pipe(this.mapper.toDomain(entity), TE.fromEither),
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

  delete(entity: A): TE.TaskEither<BaseException, void> {
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

  setCorrelationId(correlationId: string): this {
    this.correlationId = correlationId;
    // this.logger.setCorrelationId(correlationId);
    return this;
  }

  protected withTransaction<T>(
    work: (manager: EntityManager) => Promise<T>,
  ): TE.TaskEither<BaseException, T> {
    return TE.tryCatch(
      async () => {
        const queryRunner =
          this.repository.manager.connection.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
          const result = await work(queryRunner.manager);
          await queryRunner.commitTransaction();
          return result;
        } catch (error) {
          await queryRunner.rollbackTransaction();
          throw error;
        } finally {
          await queryRunner.release();
        }
      },
      (error) =>
        BaseExceptionTrait.construct(
          'TRANSACTION_FAILED',
          `Transaction failed: ${error}`,
        ),
    );
  }
}
