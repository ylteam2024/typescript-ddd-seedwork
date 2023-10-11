import { BaseException } from '@logic/exceptions';
import { Array, IOEither, State } from '@logic/fp';
import { AggregateRoot } from './aggregate-root.base';
import { DomainEvent } from './event/domain-event.base';

export interface IEventDispatcher {
  dispatch(event: DomainEvent): IOEither.IOEither<BaseException, void>;
  multiDispatch(events: DomainEvent[]): IOEither.IOEither<BaseException, void>;
}

export type DomainBehavior<T> = State.State<DomainEvent[], AggregateRoot<T>>;

const map =
  <T>(f: (a: AggregateRoot<T>) => AggregateRoot<T>) =>
  (fa: DomainBehavior<T>) =>
    State.map(f)(fa);

const of =
  <T>(aggregateState: AggregateRoot<T>) =>
  (itsEvent: DomainEvent[]) =>
  () =>
  (commingEvents: DomainEvent[]) =>
    [
      aggregateState,
      Array.getMonoid<DomainEvent>().concat(itsEvent, commingEvents),
    ];

const chain =
  <T>(f: (a: AggregateRoot<T>) => DomainBehavior<T>) =>
  (ma: DomainBehavior<T>) =>
  (s: DomainEvent[]) => {
    const state = ma(s);
    return f(state[0])(state[1]);
  };

export const BehaviorMonad = {
  map,
  of,
  chain,
};
