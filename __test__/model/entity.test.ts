import {
  EntityGenericTrait,
  EntityLiken,
  EntityTrait,
} from '@model/entity.base';
import { randomUUID } from 'crypto';
import { apply } from 'fp-ts/lib/function';
import {
  Array,
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

const parseExampleEntityProps: Parser<
  ExampleEntityProps,
  EntityLiken<ExampleEntity>
> = (state) =>
  EntityGenericTrait.structParsingProps<ExampleEntity>({
    attr1: parseString(state.attr1),
    attr2: parseNumber(state.attr2),
  });

class ExampleEntityTrait implements EntityTrait<ExampleEntity> {
  parse = (rawInput: EntityLiken<ExampleEntity>) =>
    pipe(
      EntityGenericTrait.construct<ExampleEntity>,
      apply(parseExampleEntityProps),
      apply('exampleEntity'),
      apply(rawInput),
    );

  new = this.parse;
}

const exampleEntityTrait = new ExampleEntityTrait();

function construct(attr1: string, attr2: number, id: string) {
  return exampleEntityTrait.parse({
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
          const attr1 = EntityGenericTrait.queryProps(v)('attr1') as string;
          const attr2 = EntityGenericTrait.queryProps(v)('attr2') as number;
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
      Array.sequence(Either.Applicative),
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
