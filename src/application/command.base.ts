import { Either, Optics } from '@logic/fp';
import { pipe } from 'fp-ts/lib/function';
import { curry } from 'ramda';
import LifeCycleMetaMod, { LifeCycleMeta } from './lifecyle.meta';
import { Identifier, ObjectWithId, idLens } from 'src/typeclasses/obj-with-id';
import { Parser } from '@model/invariant-validation';

export type Command<T> = ObjectWithId & {
  readonly lifecycle: LifeCycleMeta;

  readonly props: T;
};

const factory =
  <T>(propsParser: Parser<T>) =>
  ({
    id,
    lifecycle,
    props,
  }: {
    id: Identifier;
    lifecycle: LifeCycleMeta;
    props: any;
  }) => {
    const command: Command<T> = {
      id,
      lifecycle,
      props,
    };
    return pipe(propsParser(props), Either.as(command));
  };

const queryProps = curry(<T>(command: Command<T>, propKey: keyof T) =>
  pipe(command, Optics.get(Optics.id<Command<T>>().at('props').at(propKey))),
);

const id = <T>(command: Command<T>) => pipe(command, Optics.get(idLens));

const correlationId = <T>(command: Command<T>) =>
  LifeCycleMetaMod.correlationId(command.lifecycle);

export const CommandTrait = {
  factory,
  id,
  queryProps,
  correlationId,
};
