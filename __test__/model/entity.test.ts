import { EntityTrait, EntityGenericTrait } from '@model/entity.base';
import { EntityLiken } from '@model/entity.base.type';
import { randomUUID } from 'crypto';
import { apply } from 'fp-ts/lib/function';
import {
  Arr,
  Either,
  Entity,
  Option,
  Parser,
  parseNumber,
  parseString,
  pipe,
} from 'src';

type ExampleEntityProps = {
  attr1: string;
  attr2: number;
};

type ExampleEntity = Entity<ExampleEntityProps>;

const parseEntity = (rawInput: EntityLiken<ExampleEntity>) =>
  pipe(
    EntityGenericTrait.factory<ExampleEntity>,
    apply(parseExampleEntityProps),
    apply('exampleEntity'),
    apply(rawInput),
  );

const ExampleEntityTrait: EntityTrait<ExampleEntity> = {
  parse: parseEntity,
  new: parseEntity,
};

const parseExampleEntityProps: Parser<
  ExampleEntityProps,
  EntityLiken<ExampleEntity>
> = (state) =>
  EntityGenericTrait.structParsingProps<ExampleEntity>({
    attr1: parseString(state.attr1),
    attr2: parseNumber(state.attr2),
  });

function construct(attr1: string, attr2: number, id: string) {
  return ExampleEntityTrait.parse({
    createdAt: new Date(),
    updatedAt: Option.none,
    id,
    attr1,
    attr2,
  });
}

describe('test entity', () => {
  it('test lens', () => {
    const example = construct('attr1', 3, randomUUID());
    pipe(
      example,
      Either.fold(
        () => {
          fail('error on construct entity');
        },
        (v) => {
          const attr1 = EntityGenericTrait.simpleQuery<ExampleEntity, string>(
            'attr1',
          )(v);
          const attr2 = EntityGenericTrait.simpleQuery<ExampleEntity, number>(
            'attr2',
          )(v);
          expect(attr1).toEqual('attr1');
          expect(attr2).toEqual(3);
        },
      ),
    );
  });
  it('test eq', () => {
    const e1 = construct('a', 3, 'id1');
    const e2 = construct('a', 3, 'id1');
    const e3 = construct('a', 3, 'id2');
    pipe(
      [e1, e2, e3],
      Arr.sequence(Either.Applicative),
      Either.fold(
        (e) => {
          throw e;
        },
        ([e1, e2, e3]) => {
          expect(EntityGenericTrait.isEqual(e1, e2)).toBeTruthy();
          expect(EntityGenericTrait.isEqual(e2, e3)).toBeFalsy();
        },
      ),
    );
  });
});
