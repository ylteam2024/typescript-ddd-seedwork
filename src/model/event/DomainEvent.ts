import { AssertionConcern } from '@logic/AssertionConcern';
import { UUID } from '../valueObjects/UUID';

export type DomainEventProps<T> = Omit<
  T,
  'id' | 'correlationId' | 'dateOccurred'
> &
  Omit<DomainEvent, 'id' | 'correlationId' | 'dateOccurred'> & {
    correlationId?: string;
    dateOccurred?: number;
  };

export abstract class DomainEvent extends AssertionConcern {
  public readonly id: string;

  /** Aggregate ID where domain event occurred */
  public readonly aggregateId: string;

  /** Date when this domain event occurred */
  public readonly dateOccurred: number;

  /** ID for correlation purposes (for UnitOfWork, Integration Events,logs correlation etc).
   * This ID is set automatically in a publisher.
   */
  public correlationId: string;

  /**
   * Causation id to reconstruct execution ordering if needed
   */
  public causationId?: string;

  constructor(props: DomainEventProps<unknown>) {
    super();
    this.assertArgumentNotNull({
      aValue: props,
      aMessage: 'DomainEvent props should not be empty',
    });
    this.id = UUID.generate().toString();
    this.aggregateId = props.aggregateId;
    this.dateOccurred = props.dateOccurred || Date.now();
    if (props.correlationId) this.correlationId = props.correlationId;
  }
}
