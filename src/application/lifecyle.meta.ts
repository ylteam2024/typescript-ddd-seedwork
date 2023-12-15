import { Option, RRecord, pipe } from '@logic/fp';
import uuid from 'uuid';

export type LifeCycleContext = Record<string, never>;

export type LifeCycleMeta = {
  createdTimestamp: number;
  /** ID for correlation purposes (for UnitOfWork, for commands that
   *  arrive from other microservices,logs correlation etc). */
  correlationId: string;
  context: RRecord.ReadonlyRecord<string, never>;
};

const LifeCycleMetaMod = {
  factory: (
    correlationId: Option.Option<string>,
    context: Option.Option<RRecord.ReadonlyRecord<string, never>>,
  ): LifeCycleMeta => ({
    createdTimestamp: Date.now(),
    correlationId: pipe(
      correlationId,
      Option.getOrElse(() => uuid.v4()),
    ),
    context: pipe(
      context,
      Option.getOrElse(() => ({})),
    ),
  }),
  correlationId: (meta: LifeCycleMeta) => meta.correlationId,
};

export default LifeCycleMetaMod;
