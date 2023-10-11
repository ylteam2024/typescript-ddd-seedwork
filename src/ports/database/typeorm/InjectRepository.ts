import { DataSource, EntitySchema } from 'typeorm';

export const injectRepositoryFactory =
  (datasource: DataSource) => (entity: EntitySchema) => {
    const repository = datasource.getRepository(entity);
    return (
      target: (...args: any[]) => any,
      propertyKey: string,
      descriptor: PropertyDescriptor,
    ) => {
      const consWithRepository = (...params) => {
        return descriptor.value.call(this, ...params, repository);
      };
      descriptor.value = consWithRepository;
    };
  };
