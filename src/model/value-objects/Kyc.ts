import { Either, Option, pipe } from '@logic/fp';
import { apply } from 'fp-ts/lib/function';
import { BooleanFromString } from 'io-ts-types';
import {
  Parser,
  VOLiken,
  ValueObject,
  ValueObjectTrait,
  decodeWithValidationErr,
  optionizeParser,
  parseDate,
} from '..';
import { GetProps } from '@model/domain-model.base';

export type Kyc = ValueObject<{
  isVerified: boolean;
  verifiedAt: Option.Option<Date>;
}>;

const parseProps = (t: KycTrait) => (v: VOLiken<Kyc>) =>
  t.structParsing({
    isVerified: pipe(
      decodeWithValidationErr<boolean>,
      apply(BooleanFromString),
      apply({
        code: 'INVALID_VERIFIED_FLAG',
      }),
    )(v.isVerified),
    verifiedAt: pipe(
      optionizeParser<Date>,
      apply(parseDate({})),
      apply(v.verifiedAt),
    ),
  });

class KycTrait extends ValueObjectTrait<Kyc> {
  parse = (v: unknown) =>
    pipe(this.factory, apply(parseProps(this)), apply('kyc'), apply(v));
  new = this.parse;

  isVerified = this.simpleQuery<boolean>('isVerified');
}

export const kycTrait = new KycTrait();

export type WithKycPrim<T> = ValueObject<GetProps<Kyc> & { kycInfo: T }>;

const parseWithKycpropsForPrim =
  <T>(kycTrait: KycTrait) =>
  (voParser: Parser<T>) =>
  (v: VOLiken<WithKycPrim<T>>) => {
    return pipe(
      v,
      kycTrait.parse,
      Either.bindTo('kyc'),
      Either.bind('kycInfo', () => voParser(v)),
      Either.map(({ kyc, kycInfo }) => ({
        ...kycTrait.unpack(kyc),
        kycInfo,
      })),
    );
  };

class KycPrimTrait<T> extends ValueObjectTrait<WithKycPrim<T>> {
  tParser: Parser<T>;
  voTag: string;

  constructor(tParser: Parser<T>, tag: string) {
    super();
    this.tParser = tParser;
    this.voTag = tag;
  }

  parse = (v: VOLiken<WithKycPrim<T>>) =>
    pipe(
      this.factory,
      apply(parseWithKycpropsForPrim<T>(kycTrait)(this.tParser)),
      apply(this.voTag),
      apply(v),
    );
  new = this.parse;
}

export const getKycPrimTrait =
  <T>(tParser: Parser<T>) =>
  (tag: string) => {
    const kycPrimTrait = new KycPrimTrait<T>(tParser, tag);
    return kycPrimTrait;
  };
