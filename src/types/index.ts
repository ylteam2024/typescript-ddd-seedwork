export * from './Class';
export * from './ExcludeFunctionProps';

export type Writable<T> = {
  -readonly [P in keyof T]: T[P];
};

export type Brand<K, T> = K & { __brand: T };

export type KeyOf<T> = keyof T extends never ? string : keyof T;
