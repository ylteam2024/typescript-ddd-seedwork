import { Optics } from '@logic/fp';

export type HasProps<T> = {
  readonly props: T;
};

export type GetProps<T extends HasProps<unknown>> = T['props'];

export type KeyProps<T extends HasProps<unknown>> = keyof T['props'];

export const propsLen = <A extends HasProps<unknown>>() =>
  Optics.id<A>().at('props') as Optics.Lens<A, GetProps<A>>;

export const getRawProps = <A extends HasProps<unknown>>(a: A) =>
  Optics.get(propsLen<A>())(a);

export const queryOnProps =
  <A extends HasProps<unknown>, R = unknown>(key: keyof GetProps<A>) =>
  (a: A) =>
    Optics.get(propsLen<A>())(a)[key] as R;
