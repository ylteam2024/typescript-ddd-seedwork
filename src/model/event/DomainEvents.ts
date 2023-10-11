/* eslint-disable no-param-reassign */
import { DomainEvent, DomainEventHandler } from '.';
import { Logger } from '@ports/Logger';
import { AggregateRoot } from '../Aggregate';
import { final } from '@logic/decorators/final';
import { Identifier } from '../Identifier';

type EventName = string;

export type DomainEventClass = new (...args: never[]) => DomainEvent;

@final
export class DomainEvents {
  private static subscribers: Map<EventName, DomainEventHandler[]> = new Map();

  private static aggregates: AggregateRoot<Identifier<any>>[] = [];

  public static subscribe<T extends DomainEventHandler>(
    event: DomainEventClass,
    eventHandler: T,
  ): void {
    const eventName: EventName = event.name;
    if (!this.subscribers.has(eventName)) {
      this.subscribers.set(eventName, []);
    }
    this.subscribers.get(eventName)?.push(eventHandler);
  }

  public static prepareForPublish(
    aggregate: AggregateRoot<Identifier<any>>,
  ): void {
    const aggregateFound = !!this.findAggregateByID(aggregate.id());
    if (!aggregateFound) {
      this.aggregates.push(aggregate);
    }
  }

  public static async publishEvents(
    id: Identifier<any>,
    logger: Logger,
    correlationId?: string,
  ): Promise<void> {
    const aggregate = this.findAggregateByID(id);

    if (aggregate) {
      logger.debug(
        `[${aggregate.domainEvents.map(
          (event) => event.constructor.name,
        )}] published ${aggregate.id().toValue()}`,
      );
      await Promise.all(
        aggregate.domainEvents.map((event: DomainEvent) => {
          if (correlationId && !event.correlationId) {
            event.correlationId = correlationId;
          }
          return this.publish(event, logger);
        }),
      );
      aggregate.clearEvents();
      this.removeAggregateFromPublishList(aggregate);
    }
  }

  private static findAggregateByID(
    id: Identifier<any>,
  ): AggregateRoot<Identifier<any>> | undefined {
    for (const aggregate of this.aggregates) {
      if (aggregate.id().equals(id)) {
        return aggregate;
      }
    }
  }

  private static removeAggregateFromPublishList(
    aggregate: AggregateRoot<Identifier<any>>,
  ): void {
    const index = this.aggregates.findIndex((a) => a.equals(aggregate));
    this.aggregates.splice(index, 1);
  }

  private static async publish(
    event: DomainEvent,
    logger: Logger,
  ): Promise<void> {
    const eventName: string = event.constructor.name;

    if (this.subscribers.has(eventName)) {
      const handlers: DomainEventHandler[] =
        this.subscribers.get(eventName) || [];
      await Promise.all(
        handlers.map((handler) => {
          logger.debug(
            `[${handler.constructor.name}] handling ${event.constructor.name} ${event.aggregateId}`,
          );
          return handler.handle(event);
        }),
      );
    }
  }
}
