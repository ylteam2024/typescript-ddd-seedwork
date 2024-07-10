import { ValueObject } from '../value-object.base';
import { PositiveNumber, parsePositiveNumber } from './PositiveNumber';
import { ValueObjectAuFn } from '../value-object.base';
import { parseEnumItemFromString } from './Enum';
import { BaseExceptionBhv } from '@logic/exception.base';

export enum Currency {
  'USD' = 'USD',
  'VND' = 'VND',
  'JPY' = 'JPY',
  'EUR' = 'EUR',
}

export type Money = ValueObject<{
  currency: Currency;
  amount: PositiveNumber;
}>;

type RawInput = {
  currency: string;
  amount: number;
};

export const MoneyTrait = {
  ...ValueObjectAuFn.getBaseVOTrait<Money>({
    parseProps: (rawInput: RawInput) =>
      ValueObjectAuFn.structParsing<Money>({
        amount: parsePositiveNumber(rawInput.amount),
        currency: parseEnumItemFromString(
          Currency,
          BaseExceptionBhv.construct(
            'incorrect currency',
            'INCORRECT_CURRENCY',
          ),
        )(rawInput.currency),
      }),
    tag: 'Money',
  }),
};
