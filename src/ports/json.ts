import { BaseException, BaseExceptionTrait } from '@logic/exception.base';
import { Either, tryCatch } from 'fp-ts/lib/Either';
import { UnknownRecord } from 'type-fest';

interface JsonUtil {
  parse: <T = UnknownRecord>(s: string) => Either<BaseException, T>;
}

export const JsonUtil: JsonUtil = {
  parse: (s) =>
    tryCatch(
      () => JSON.parse(s),
      (e) =>
        BaseExceptionTrait.construct((e as Error).message, 'JSON_PARSE_FAILED'),
    ),
};
