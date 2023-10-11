import { Either, Optics } from '@logic/fp';
import { IValidate } from '@model/invariant-validation';
import { pipe } from 'fp-ts/lib/function';
import { curry } from 'ramda';

export type Command<T> = {
  /**
   * Command id, in case if we want to save it
   * for auditing purposes and create a correlation/causation chain
   */
  readonly id: string;

  /** ID for correlation purposes (for UnitOfWork, for commands that
   *  arrive from other microservices,logs correlation etc). */
  readonly correlationId: string;

  readonly props: T;
};

const construct =
  <T>(validate: IValidate<T>) =>
  ({ id, correlationId, props }: Command<T>) => {
    const command: Command<T> = {
      id,
      correlationId,
      props,
    };
    return pipe(validate(props), Either.as(command));
  };

const queryProps = curry(<T>(command: Command<T>, propKey: keyof T) =>
  pipe(command, Optics.get(Optics.id<Command<T>>().at('props').at(propKey))),
);

const metaLens = (metaKey: keyof Command<unknown>) =>
  Optics.get(Optics.id<Command<unknown>>().at(metaKey));

const id = <T>(command: Command<T>) => pipe(command, metaLens('id'));

const correlationId = <T>(command: Command<T>) =>
  pipe(command, metaLens('correlationId'));

export const CommandTrait = {
  construct,
  id,
  queryProps,
  correlationId,
};
