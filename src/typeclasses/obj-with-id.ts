import * as Optic from '@fp-ts/optic';
import { BaseException, BaseExceptionBhv } from '@logic/exception.base';
import { Either, Eq, S } from '@logic/fp';
import { Parser } from '@model/invariant-validation';
import { PrimitiveVOTrait } from '@model/value-object.base';
import { Brand } from '@type_util/index';
import { v4 as uuidv4 } from 'uuid';

export type Identifier = Brand<string, 'Identifier'>;

export const parseId: Parser<Identifier, string, BaseException> = (
  v: string,
) => {
  const isId = (v: unknown): v is Identifier =>
    typeof v === 'string' && v.length > 0;
  return Either.fromPredicate(isId, () =>
    BaseExceptionBhv.construct('invalid identifier', 'INVALID_IDENTIFIER'),
  )(v);
};

export const IdEq = Eq.fromEquals((id1: Identifier, id2: Identifier) =>
  S.Eq.equals(id1, id2),
);

interface IidentifierTrait extends PrimitiveVOTrait<Identifier, BaseException> {
  uuid(): Identifier;
}

export const IdentifierTrait: IidentifierTrait = {
  parse: parseId,
  new: parseId,
  uuid: () => uuidv4() as Identifier,
};
export type ObjectWithId = {
  readonly id: Identifier;
};

export const idLens = Optic.id<ObjectWithId>().at('id');
