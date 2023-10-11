export type ExcludeFunctionProps<T> = Omit<
  T,
  {
    [K in keyof T]-?: T[K] extends (...args: any[]) => any ? K : never;
  }[keyof T]
>;
