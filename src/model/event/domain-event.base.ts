import { Identifier } from '@model/entity.base';

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
