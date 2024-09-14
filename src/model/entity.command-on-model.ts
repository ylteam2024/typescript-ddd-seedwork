import { Either } from '@logic/fp';
import { Entity } from './entity.base.type';
import {
  BehaviorMonad,
  BehaviorMonadTrait,
} from './domain-model-behavior.monad';
import { DomainEvent } from './event';
import { BaseException } from '@logic/exception.base';

export type CommandOnModelReturn<DM extends Entity> = Either.Either<
  BaseException,
  BehaviorMonad<DM>
>;

export type CommandOnModel<DM extends Entity> = (
  domainModel: DM,
) => CommandOnModelReturn<DM>;

export const fromException: <DM extends Entity>(
  err: BaseException,
) => CommandOnModelReturn<DM> = (err: BaseException) => Either.left(err);

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
