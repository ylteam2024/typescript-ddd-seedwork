import { Identifier, entityTrait } from '@model/entity.base';
import { randomUUID } from 'crypto';
import { Array, Either, Entity, IValidate, Option, pipe } from 'src';

type ExampleEntityProps = {
  attr1: string;
  attr2: number;
};

type ExampleEntity = Entity<ExampleEntityProps>;

const validate: IValidate<ExampleEntityProps> = (state: ExampleEntityProps) =>
  Either.right(state);

function construct(attr1: string, attr2: number, id: Identifier) {
  return entityTrait.construct(validate)('exampleEntity')({
    createdAt: new Date(),
    updatedAt: Option.none,
    id,
  })({ attr1, attr2 });
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
          const attr1 = entityTrait.queryProps(v)('attr1') as string;
          const attr2 = entityTrait.queryProps(v)('attr2') as number;
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
          expect(entityTrait.isEqual(e1, e2)).toBeTruthy();
          expect(entityTrait.isEqual(e2, e3)).toBeFalsy();
        },
      ),
    );
  });
});
