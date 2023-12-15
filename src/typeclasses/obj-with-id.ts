import * as Optic from '@fp-ts/optic';
import { BaseExceptionBhv } from '@logic/exception.base';
import { Either } from '@logic/fp';
import { Parser } from '@model/invariant-validation';
import { PrimitiveVOTrait } from '@model/value-object.base';
import { Brand } from '@type_util/index';

export type Identifier = Brand<string, 'Identifier'>;

export const parseId: Parser<Identifier> = (v: unknown) => {
  const isId = (v: unknown): v is Identifier =>
    typeof v === 'string' && v.length > 0;
  return Either.fromPredicate(isId, () =>
    BaseExceptionBhv.construct('invalid identifier', 'INVALID_IDENTIFIER'),
  )(v);
};

export const IdentifierTrait: PrimitiveVOTrait<Identifier> = {
  parse: parseId,
  new: parseId,
};
export type ObjectWithId = {
  readonly id: Identifier;
};

export const idLens = Optic.id<ObjectWithId>().at('id');
