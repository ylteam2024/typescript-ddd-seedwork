/*  Most of repositories will probably need generic 
    save/find/delete operations, so it's easier
    to have some shared interfaces.
    More specific interfaces should be defined
    in a respective module/use case.
*/

import { Identifier } from '@model/Identifier';

export type QueryParams = any;

export interface Save<Entity> {
  save(entity: Entity): Promise<Entity>;
}

export interface Add<Entity> {
  add(entity: Entity): Promise<Entity>;
}

export interface SaveMultiple<Entity> {
  saveMultiple?(entities: Entity[]): Promise<Entity[]>;
}

export interface FindOne<Entity> {
  findOneOrThrow?(params: QueryParams): Promise<Entity>;
}

export interface FindOneById<Entity> {
  findOneByIdOrThrow?(id: Identifier<any>): Promise<Entity>;
}

export interface FindMany<Entity> {
  findMany?(params: QueryParams): Promise<Entity[]>;
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
  ): Promise<DataWithPaginationMeta<Entity[]>>;
}

export interface DeleteOne<Entity> {
  delete?(entity: Entity): Promise<Entity>;
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
