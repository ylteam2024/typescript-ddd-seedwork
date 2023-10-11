export interface DomainService<I, T> {
  handle(input: I): T;
}
