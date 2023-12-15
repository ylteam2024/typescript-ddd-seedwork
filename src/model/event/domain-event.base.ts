import { randomUUID } from 'crypto';
import { Identifier } from 'src/typeclasses/obj-with-id';

type DomainEventMetadata = {
  /** Timestamp when this domain event occurred */
  readonly timestamp: number;

  /** ID for correlation purposes (for Integration Events,logs correlation, etc).
   */
  readonly correlationId: string;

  /**
   * Causation id used to reconstruct execution order if needed
   */
  readonly causationId?: string;

  /**
   * User ID for debugging and logging purposes
   */
  readonly userId?: string;
};

export interface DomainEvent {
  aggregateId: Identifier;
  aggregateType: string;
  name: string;
  metadata: DomainEventMetadata;
}

const construct = ({
  aggregateId,
  aggregateType,
  name,
}: {
  aggregateId: Identifier;
  aggregateType: string;
  name: string;
}) =>
  ({
    aggregateId,
    aggregateType,
    name,
    metadata: {
      timestamp: new Date().getTime(),
      correlationId: randomUUID(),
    },
  }) as DomainEvent;

export const DomainEventTrait = {
  construct,
};
