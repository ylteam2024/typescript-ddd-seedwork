import { Either, tryCatch } from 'fp-ts/lib/Either';
import { UnknownRecord } from 'type-fest';

interface JsonUtil {
  parse: <T = UnknownRecord>(s: string) => Either<Error, T>;
}

export const JsonUtil: JsonUtil = {
  parse: (s) =>
    tryCatch(
      () => JSON.parse(s),
      (e) => e as Error,
    ),
};
