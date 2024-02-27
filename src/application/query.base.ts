import { GetProps, queryOnProps } from 'src/typeclasses/has-props';

export type Query<T> = {
  readonly props: T;
};

const factory = <Q extends Query<unknown>>(props: GetProps<Q>) =>
  ({ props }) as Q;

export const QueryTrait = {
  factory,
  queryProps: queryOnProps,
};
