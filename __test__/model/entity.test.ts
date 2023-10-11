import { EntityLiken, EntityTrait } from '@model/entity.base';
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

class ExampleEntityTrait extends EntityTrait<ExampleEntity> {
  parse = (rawInput: EntityLiken<ExampleEntity>) =>
    pipe(
      this.construct,
      apply(parseExampleEntityProps),
      apply('exampleEntity'),
      apply(rawInput),
    );
  new = this.parse;
}

const exampleEntityTrait = new ExampleEntityTrait();

const parseExampleEntityProps: Parser<
  ExampleEntityProps,
  EntityLiken<ExampleEntity>
> = (state) =>
  exampleEntityTrait.structParsingProps({
    attr1: parseString(state.attr1),
    attr2: parseNumber(state.attr2),
  });

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
          const attr1 = exampleEntityTrait.simpleQuery<string>('attr1')(v);
          const attr2 = exampleEntityTrait.simpleQuery<number>('attr2')(v);
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
          expect(exampleEntityTrait.isEqual(e1, e2)).toBeTruthy();
          expect(exampleEntityTrait.isEqual(e2, e3)).toBeFalsy();
        },
      ),
    );
  });
});
