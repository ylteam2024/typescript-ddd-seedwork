import { BaseException, BaseExceptionBhv } from '@logic/exception.base';
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
        BaseExceptionBhv.construct((e as Error).message, 'JSON_PARSE_FAILED'),
    ),
};
