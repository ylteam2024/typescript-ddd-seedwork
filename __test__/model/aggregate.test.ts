import { randomUUID } from 'crypto';
import { apply, identity } from 'fp-ts/lib/function';
import { Array, S } from '@logic/fp';
import {
  AggBehavior,
  AggregateRoot,
  BehaviorMonad,
  BehaviorMonadTrait,
  DomainEventTrait,
  Either,
  Entity,
  EntityEq,
  IValidate,
  Identifier,
  Optics,
  Option,
  entityTrait,
  identityInvariantParser,
  pipe,
} from 'src';

type ExampleEntity = Entity<{ a: string }>;

const constructExampleEntity = (id: Identifier) =>
  ({
    id,
    createdAt: new Date(),
    updatedAt: Option.some(new Date()),
    _tag: 'exampleEntity',
    props: {},
  } as ExampleEntity);

type ExampleAProps = {
  attr1: string;
  attr2: number;
  attrArrayPrimitive: string[];
  attrArrayEntities: ExampleEntity[];
};

type ExampleA = AggregateRoot<ExampleAProps>;

const constructA = (
  attr1: string,
  attr2: number,
  attrArrayPrimitive: string[] = [],
  attrArrayEntities: ExampleEntity[] = [],
) => {
  const validate: IValidate<ExampleAProps> = (a: ExampleAProps) =>
    Either.right(a);
  return entityTrait.construct(validate)('exampleA')({
    createdAt: new Date(),
    updatedAt: Option.of(new Date()),
    id: randomUUID(),
  })({
    attr1,
    attr2,
    attrArrayEntities,
    attrArrayPrimitive,
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

  it('test setter', () => {});

  describe('test remover, adder', () => {
    const testAgg = constructA(
      'attr1',
      2,
      ['a', 'b'],
      [
        constructExampleEntity('id1'),
        constructExampleEntity('id2'),
        constructExampleEntity('id3'),
      ],
    );
    it('test adder with primitives array', () => {
      pipe(
        testAgg,
        // Either.tap((agg) => {
        //   console.log('agg', agg);
        //   return Either.right(null);
        // }),
        Either.flatMap((agg) =>
          pipe(
            entityTrait.adder<ExampleA, string>,
            apply('attrArrayPrimitive' as keyof ExampleA['props']),
            apply({
              E: S.Eq,
              validator: identityInvariantParser,
              events: [
                DomainEventTrait.construct({
                  aggregateId: entityTrait.id(agg),
                  aggregateType: testAgg._tag,
                  name: 'ADD_ARRAY_PRIMITIVE',
                }),
              ],
            }),
            apply('hau<3nga'),
            apply(agg),
          ),
        ),
        Either.fold(
          (e) => {
            throw e;
          },
          (bMonad) => {
            const [a, e] = bMonad([]);
            expect(a.props.attrArrayPrimitive).toContain('hau<3nga');
            expect(e).toHaveLength(1);
          },
        ),
      );
    });
    it('test adder with domain model entity array', () => {
      pipe(
        testAgg,
        // Either.tap((agg) => {
        //   console.log('agg', agg);
        //   return Either.right(null);
        // }),
        Either.flatMap((agg) =>
          pipe(
            entityTrait.adder<ExampleA, ExampleEntity>,
            apply('attrArrayEntities' as keyof ExampleA['props']),
            apply({
              E: EntityEq,
              validator: identityInvariantParser,
              events: [
                DomainEventTrait.construct({
                  aggregateId: entityTrait.id(agg),
                  aggregateType: testAgg._tag,
                  name: 'ADD_ARRAY_ENTITY',
                }),
              ],
            }),
            apply(constructExampleEntity('newEntity')),
            apply(agg),
          ),
        ),
        Either.fold(
          (e) => {
            throw e;
          },
          (bMonad) => {
            const [a, e] = bMonad([]);
            expect(
              pipe(
                a.props.attrArrayEntities,
                Array.some((_a: ExampleEntity) => {
                  return EntityEq.equals(
                    _a,
                    constructExampleEntity('newEntity'),
                  );
                }),
              ),
            ).toBeTruthy();
            expect(e).toHaveLength(1);
          },
        ),
      );
    });
  });
});
