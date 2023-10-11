import { BaseException } from '@logic/exception.base';
import { TaskEither } from 'fp-ts/lib/TaskEither';
import { DomainEvent } from './domain-event.base';

export interface IBaseHandler {
  (event: DomainEvent): TaskEither<BaseException, void>;
}
