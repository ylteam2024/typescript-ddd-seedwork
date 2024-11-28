import { BaseException } from '@logic/exception.base';
import { Either, Option, TE } from '@logic/fp';
import { DomainModel } from '@model/domain-model.base.type';
import { EntityManager, ObjectLiteral } from 'typeorm';

export interface IBaseMapper<DM extends DomainModel, DE extends ObjectLiteral> {
  toDomain(data: DE): Either.Either<BaseException, DM>;
  toData(params: {
    domainModel: DM;
    initState: Option.Option<DE>;
  }): Either.Either<BaseException, DE>;
  loadRelations(
    entity: DE,
    relations: string[],
  ): TE.TaskEither<BaseException, DE>;
  mapRelations(
    relations: string[],
    entity: DE,
  ): TE.TaskEither<BaseException, DE>;
  withTransaction<T>(
    work: (manager: EntityManager) => TE.TaskEither<BaseException, T>,
  ): TE.TaskEither<BaseException, T>;
}
