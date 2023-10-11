import { Entity } from './Entity';
import { DomainEvent } from './event/DomainEvent';
import { DomainEvents } from './event/DomainEvents';
import { Identifier } from './Identifier';

export abstract class AggregateRoot<
  IdentifierType extends Identifier<any>,
> extends Entity<IdentifierType> {
  private _domainEvents: DomainEvent[] = [];

  get domainEvents(): DomainEvent[] {
    return this._domainEvents;
  }

  protected addEvent(domainEvent: DomainEvent): void {
    this._domainEvents.push(domainEvent);
    DomainEvents.prepareForPublish(this);
  }

  public clearEvents(): void {
    this._domainEvents = [];
  }
}
