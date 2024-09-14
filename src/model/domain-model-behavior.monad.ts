import { Arr, IOEither, State } from '@logic/fp';
import { DomainEvent } from './event/domain-event.base';
import { pipe } from 'fp-ts/lib/function';
import { BaseException } from '@logic/exception.base';
import { Validation } from './invariant-validation';
import { Entity } from './entity.base.type';

export interface IEventDispatcher {
  dispatch(event: DomainEvent): IOEither.IOEither<BaseException, void>;
  multiDispatch(events: DomainEvent[]): IOEither.IOEither<BaseException, void>;
}

export type BehaviorMonad<S> = {
  events: DomainEvent[];
  state: S;
};

const map =
  <A extends Entity>(f: (a: A) => A) =>
  (fa: BehaviorMonad<A>) => [f(fa.state), fa.events];

const of = <S>(state: S, itsEvent: DomainEvent[]) => ({
  events: itsEvent,
  state,
});

const chain =
  <A extends Entity>(f: (a: A) => BehaviorMonad<A>) =>
  (ma: BehaviorMonad<A>) => {
    const result = f(ma.state);
    return {
      state: result.state,
      events: [...result.events, ...ma.events],
    };
  };
const run =
  (eD: IEventDispatcher) =>
  <A extends Entity>(behavior: BehaviorMonad<A>, initEvents: DomainEvent[]) => {
    return pipe(
      eD.multiDispatch([...behavior.events, ...initEvents]),
      IOEither.as(behavior.state),
    );
  };

export type AggBehavior<A extends Entity, P, HasParser extends boolean> = (
  p: P,
) => (
  a: A,
) => HasParser extends true ? Validation<BehaviorMonad<A>> : BehaviorMonad<A>;

export const BehaviorMonadTrait = {
  map,
  of,
  chain,
  run,
};
