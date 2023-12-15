/*  Most of repositories will probably need generic 
    save/find/delete operations, so it's easier
    to have some shared interfaces.
    More specific interfaces should be defined
    in a respective module/use case.
*/

import { BaseException } from '@logic/exception.base';
import { TE } from '@logic/fp';
import { Identifier } from 'src/typeclasses/obj-with-id';

export type QueryParams = any;

export interface Save<Entity> {
  save(entity: Entity): TE.TaskEither<BaseException, Entity>;
}

export interface Add<Entity> {
  add(entity: Entity): TE.TaskEither<BaseException, Entity>;
}

export interface SaveMultiple<Entity> {
  saveMultiple?(
    entities: Entity[],
  ): TE.TaskEither<BaseException, readonly Entity[]>;
}

export interface FindOne<Entity> {
  findOneOrThrow?(params: QueryParams): TE.TaskEither<BaseException, Entity>;
}

export interface FindOneById<Entity> {
  findOneByIdOrThrow?(id: Identifier): TE.TaskEither<BaseException, Entity>;
}

export interface FindMany<Entity> {
  findMany?(params: QueryParams): TE.TaskEither<BaseException, Entity[]>;
}

export interface OrderBy {
  [key: number]: 'ASC' | 'DESC';
}

export interface PaginationMeta {
  skip?: number;
  limit?: number;
  page?: number;
}

export interface FindManyPaginatedParams {
  params?: QueryParams;
  pagination?: PaginationMeta;
  orderBy?: OrderBy;
}

export interface DataWithPaginationMeta<T> {
  data: T;
  count: number;
  limit?: number;
  page?: number;
}

export interface FindManyPaginated<Entity> {
  findManyPaginated?(
    options: FindManyPaginatedParams,
  ): TE.TaskEither<BaseException, DataWithPaginationMeta<Entity[]>>;
}

export interface DeleteOne<Entity> {
  delete?(entity: Entity): TE.TaskEither<BaseException, unknown>;
}

export interface RepositoryPort<Entity>
  extends Save<Entity>,
    FindOne<Entity>,
    FindOneById<Entity>,
    FindMany<Entity>,
    Add<Entity>,
    FindManyPaginated<Entity>,
    DeleteOne<Entity>,
    SaveMultiple<Entity> {
  setCorrelationId?(correlationId: string): this;
}
