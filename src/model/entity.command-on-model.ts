import { Either } from '@logic/fp';
import { Entity } from './entity.base.type';
import { ValidationErr } from './invariant-validation';
import {
  BehaviorMonad,
  BehaviorMonadTrait,
} from './domain-model-behavior.monad';
import { DomainEvent } from './event';

export type CommandOnModelReturn<DM extends Entity> = Either.Either<
  ValidationErr,
  BehaviorMonad<DM>
>;

export type CommandOnModel<DM extends Entity> = (
  domainModel: DM,
) => CommandOnModelReturn<DM>;

export const fromException: <DM extends Entity>(
  err: ValidationErr,
) => CommandOnModelReturn<DM> = (err: ValidationErr) => Either.left(err);

export const fromModel2Events: <DM extends Entity>(
  e: DM,
  events: DomainEvent[],
) => CommandOnModelReturn<DM> = <DM extends Entity>(
  entity: DM,
  events: DomainEvent[],
) => Either.right(BehaviorMonadTrait.of(entity, events));

export const CommandOnModelTrait = {
  fromException,
  fromModel2Events,
};
