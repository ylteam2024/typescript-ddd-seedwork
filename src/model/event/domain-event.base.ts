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

export interface DomainEvent<P = any> {
  aggregateId: Identifier;
  aggregateType: string;
  name: string;
  metadata: DomainEventMetadata;
  payload?: P;
}

const construct = <P = any>({
  aggregateId,
  aggregateType,
  name,
  payload,
}: {
  aggregateId: Identifier;
  aggregateType: string;
  name: string;
  payload?: P;
}) =>
  ({
    aggregateId,
    aggregateType,
    name,
    metadata: {
      timestamp: new Date().getTime(),
      correlationId: randomUUID(),
    },
    payload,
  }) as DomainEvent<P>;

export const DomainEventTrait = {
  construct,
};
