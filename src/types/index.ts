export * from './Class';
export * from './ExcludeFunctionProps';

export type Brand<K, T> = K & { __brand: T };
