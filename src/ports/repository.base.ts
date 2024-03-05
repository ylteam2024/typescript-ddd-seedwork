/*  Most of repositories will probably need generic 
    save/find/delete operations, so it's easier
    to have some shared interfaces.
    More specific interfaces should be defined
    in a respective module/use case.
*/

import { BaseException } from '@logic/exception.base';
import { TE } from '@logic/fp';
import { AggregateRoot } from '@model/aggregate-root.base';
import { Identifier } from 'src/typeclasses/obj-with-id';

export type QueryParams = any;

export interface Save<A extends AggregateRoot> {
  save(aggregateRoot: A): TE.TaskEither<BaseException, A>;
}

export interface Add<A extends AggregateRoot> {
  add(entity: A): TE.TaskEither<BaseException, A>;
}

export interface SaveMultiple<A extends AggregateRoot> {
  saveMultiple?(entities: A[]): TE.TaskEither<BaseException, readonly A[]>;
}

export interface FindOne<A extends AggregateRoot> {
  findOneOrThrow?(params: QueryParams): TE.TaskEither<BaseException, A>;
}

export interface FindOneById<A extends AggregateRoot> {
  findOneByIdOrThrow?(id: Identifier): TE.TaskEither<BaseException, A>;
}

export interface FindMany<A extends AggregateRoot> {
  findMany?(params: QueryParams): TE.TaskEither<BaseException, A[]>;
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

export interface FindManyPaginated<A extends AggregateRoot> {
  findManyPaginated?(
    options: FindManyPaginatedParams,
  ): TE.TaskEither<BaseException, DataWithPaginationMeta<A[]>>;
}

export interface DeleteOne<A extends AggregateRoot> {
  delete?(entity: A): TE.TaskEither<BaseException, unknown>;
}

export interface RepositoryPort<A extends AggregateRoot>
  extends Save<A>,
    FindOne<A>,
    FindOneById<A>,
    FindMany<A>,
    Add<A>,
    FindManyPaginated<A>,
    DeleteOne<A>,
    SaveMultiple<A> {
  setCorrelationId?(correlationId: string): this;
}
