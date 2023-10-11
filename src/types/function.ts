export type ArbFunction = (...args: any[]) => any;

export type FutureArbFnc = (...args: any[]) => Promise<any>;

export type FirstArgumentType<T extends (...args: any[]) => any> =
  Parameters<T>[0];
