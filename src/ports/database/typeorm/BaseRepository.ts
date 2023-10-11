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
import { DomainEvents } from '@model/event/DomainEvents';
import { Logger } from '@ports/Logger';
import { OrmMapper } from './BaseMapper';
import { AggregateRoot } from '@model/Aggregate';
import { Identifier } from '@model/Identifier';
import { NotFoundException } from '@logic/exceptions';
import { TypeormEntityBase } from './BaseEntity';

export type WhereCondition<OrmEntity> =
  | FindOptionsWhere<OrmEntity>[]
  | FindOptionsWhere<OrmEntity>[]
  | ObjectLiteral
  | string;

export abstract class TypeormRepositoryBase<
  IdentifierRawType extends string | number,
  IdentifierType extends Identifier<IdentifierRawType>,
  Entity extends AggregateRoot<IdentifierType>,
  OrmEntity extends TypeormEntityBase<IdentifierRawType>,
> implements RepositoryPort<Entity>
{
  protected constructor(
    protected readonly repository: Repository<OrmEntity>,
    protected readonly mapper: OrmMapper<
      IdentifierRawType,
      IdentifierType,
      Entity,
      OrmEntity
    >,
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

  async save(entity: Entity): Promise<Entity> {
    const ormEntity = await this.mapper.toOrmEntity(entity);
    const result = await this.repository.save(ormEntity);
    await DomainEvents.publishEvents(
      entity.id(),
      this.logger,
      this.correlationId,
    );
    this.logger.debug(
      `[${entity.constructor.name}] persisted ${entity.id.toString()}`,
    );
    return this.mapper.toDomainEntity(result);
  }

  async add(entity: Entity): Promise<Entity> {
    const ormEntity = await this.mapper.toOrmEntity(entity);
    const result = await this.repository.save(ormEntity);
    await DomainEvents.publishEvents(
      entity.id(),
      this.logger,
      this.correlationId,
    );
    this.logger.debug(`[${entity.constructor.name}] persisted ${result}`);
    return this.mapper.toDomainEntity(result);
  }

  async saveMultiple(entities: Entity[]): Promise<Entity[]> {
    const ormEntities = await Promise.all(
      entities.map(async (entity) => {
        return await this.mapper.toOrmEntity(entity);
      }),
    );
    const result = await this.repository.save(ormEntities);
    await Promise.all(
      entities.map((entity) =>
        DomainEvents.publishEvents(
          entity.id(),
          this.logger,
          this.correlationId,
        ),
      ),
    );
    this.logger.debug(
      `[${entities}]: persisted ${entities.map((entity) => entity.id)}`,
    );
    return await Promise.all(
      result.map(async (entity) => await this.mapper.toDomainEntity(entity)),
    );
  }

  async findOne(params: QueryParams = {}): Promise<Entity | undefined> {
    const where = this.prepareQuery(params);
    const found = await this.repository.findOne({
      where,
      relations: this.relations,
    });
    return found ? this.mapper.toDomainEntity(found) : undefined;
  }

  async findOneOrThrow(params: QueryParams = {}): Promise<Entity> {
    const found = await this.findOne(params);
    if (!found) {
      throw new NotFoundException({});
    }
    return found;
  }

  async findOneByIdOrThrow(id: IdentifierType): Promise<Entity> {
    const found = await this.repository.findOne({
      // @ts-ignore
      where: { id: id.toValue() },
    });
    if (!found) {
      throw new NotFoundException({});
    }
    return this.mapper.toDomainEntity(found);
  }

  async findMany(params: QueryParams = {}): Promise<Entity[]> {
    const result = await this.repository.find({
      where: this.prepareQuery(params),
      relations: this.relations,
    });

    return Promise.all(
      result.map(async (item) => await this.mapper.toDomainEntity(item)),
    );
  }

  async findManyPaginated({
    params = {},
    pagination,
    orderBy,
  }: FindManyPaginatedParams): Promise<DataWithPaginationMeta<Entity[]>> {
    const [data, count] = await this.repository.findAndCount({
      skip: pagination?.skip,
      take: pagination?.limit,
      where: this.prepareQuery(params),
      order: orderBy as FindOptionsOrder<OrmEntity>,
      relations: this.relations,
    });

    const result: DataWithPaginationMeta<Entity[]> = {
      data: await Promise.all(
        data.map(async (item) => await this.mapper.toDomainEntity(item)),
      ),
      count,
      limit: pagination?.limit,
      page: pagination?.page,
    };

    return result;
  }

  async delete(entity: Entity): Promise<Entity> {
    await this.repository.remove(await this.mapper.toOrmEntity(entity));
    await DomainEvents.publishEvents(
      entity.id(),
      this.logger,
      this.correlationId,
    );
    this.logger.debug(
      `[${entity.constructor.name}] deleted ${entity.id().toValue()}`,
    );
    return entity;
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
