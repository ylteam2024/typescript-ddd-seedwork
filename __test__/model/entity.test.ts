import { EntityTrait } from '@model/entity.base';
import { randomUUID } from 'crypto';
import { Either, Entity, IValidate, Option, pipe } from 'src';

type ExampleEntityProps = {
  attr1: string;
  attr2: number;
};

type ExampleEntity = Entity<ExampleEntityProps>;

const validate: IValidate<ExampleEntityProps> = (state: ExampleEntityProps) =>
  Either.right(state);

function construct(attr1: string, attr2: number) {
  return EntityTrait.construct(validate)('exampleEntity')({
    createdAt: new Date(),
    updatedAt: Option.none,
    id: randomUUID(),
  })({ attr1, attr2 });
}

describe('test entity', () => {
  it('test lens', () => {
    const example = construct('attr1', 3);
    pipe(
      example,
      Either.fold(
        () => {
          fail('error on construct entity');
        },
        (v) => {
          const attr1 = EntityTrait.queryProps(v)('attr1') as string;
          const attr2 = EntityTrait.queryProps(v)('attr2') as number;
          expect(attr1).toEqual('attr1');
          expect(attr2).toEqual(3);
        },
      ),
    );
  });
});
