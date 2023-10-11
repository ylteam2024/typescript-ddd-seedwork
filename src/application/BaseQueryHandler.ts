export abstract class Query<T> {
  public readonly props: T;

  constructor(props: T) {
    this.props = props;
  }
}

export abstract class QueryHandlerBase<Q, T> {
  // For consistency with a CommandHandlerBase and DomainEventHandler
  abstract handle(query: Query<Q>): Promise<T>;

  execute(query: Query<Q>): Promise<T> {
    return this.handle(query);
  }
}
