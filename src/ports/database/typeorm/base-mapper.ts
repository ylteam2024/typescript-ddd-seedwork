import {
  Repository,
  EntityManager,
  FindOptionsWhere,
  ObjectLiteral,
} from 'typeorm';
import { IBaseMapper } from '@ports/mapper.base';
import { DomainModel } from '@model/domain-model.base.type';
import { Either, Option, TE, unsafeUnwrapTE } from '@logic/fp';
import { BaseException, BaseExceptionTrait } from '@logic/exception.base';

export abstract class BaseMapper<
  DM extends DomainModel,
  DE extends ObjectLiteral,
> implements IBaseMapper<DM, DE>
{
  constructor(
    protected readonly repository: Repository<DE>,
    protected readonly entityConstructor: new () => DE,
  ) {}

  abstract toDomain(data: DE): Either.Either<BaseException, DM>;
  abstract toData(params: {
    domainModel: DM;
    initState: Option.Option<DE>;
  }): Either.Either<BaseException, DE>;

  loadRelations(
    entity: DE,
    relations: string[],
  ): TE.TaskEither<BaseException, DE> {
    return TE.tryCatch(
      async () => {
        const loaded = await this.repository.findOne({
          where: { id: entity.id } as FindOptionsWhere<DE>,
          relations,
        });
        if (!loaded) {
          throw new Error('Entity not found when loading relations');
        }
        return loaded;
      },
      (error) =>
        BaseExceptionTrait.construct(
          'LOAD_RELATIONS_FAIL',
          `Failed to load relations: ${error}`,
        ),
    );
  }

  mapRelations(
    relations: string[],
    entity: DE,
  ): TE.TaskEither<BaseException, DE> {
    // Default implementation - override for specific relation mapping
    return TE.right(entity);
  }

  withTransaction<T>(
    work: (manager: EntityManager) => TE.TaskEither<BaseException, T>,
  ): TE.TaskEither<BaseException, T> {
    return TE.tryCatch(
      async () => {
        const queryRunner =
          this.repository.manager.connection.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
          const result = await unsafeUnwrapTE(work(queryRunner.manager));
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
