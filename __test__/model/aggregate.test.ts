import { randomUUID } from 'crypto';
import {
  AggBehavior,
  AggregateRoot,
  BehaviorMonad,
  BehaviorMonadTrait,
  DomainEventTrait,
  Either,
  IValidate,
  Optics,
  Option,
  entityTrait,
  pipe,
} from 'src';

type ExampleAProps = {
  attr1: string;
  attr2: number;
};

type ExampleA = AggregateRoot<ExampleAProps>;

const constructA = (attr1: string, attr2: number) => {
  const validate: IValidate<ExampleAProps> = (a: ExampleAProps) =>
    Either.right(a);
  return entityTrait.construct(validate)('exampleA')({
    createdAt: new Date(),
    updatedAt: Option.of(new Date()),
    id: randomUUID(),
  })({
    attr1,
    attr2,
  });
};
describe('Test Aggregate', () => {
  it('test behavior', () => {
    const a = constructA('attr1', 2);
    const events = [
      DomainEventTrait.construct({
        aggregateId: entityTrait.id(Either.getOrElse(() => null)(a)),
        aggregateType: 'exampleA',
        name: 'EVENT_1',
      }),
    ];
    const changeAttr1: AggBehavior<ExampleA, void, false> =
      () => (a: ExampleA) => {
        return pipe(
          a,
          Optics.replace(entityTrait.propsLen<ExampleA>().at('attr1'))(
            'attr1_updated',
          ),
          (updatedA: ExampleA) => BehaviorMonadTrait.of(updatedA, events),
        );
      };

    pipe(
      constructA('attr1', 2),
      Either.map(changeAttr1()),
      Either.map((bhm) => {
        const [state, bEvents] = bhm([]);
        expect(state.props.attr1).toEqual('attr1_updated');
        expect(bEvents[0]).toBe(events[0]);
      }),
      Either.mapLeft((e) => {
        fail();
      }),
    );
  });
});
