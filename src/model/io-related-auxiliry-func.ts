import { BaseExceptionBhv } from '@logic/exception.base';
import { PathReporter } from 'io-ts/PathReporter';
import { Array as A, Either, io, NEA, Option, pipe, Record } from '@logic/fp';
import { flow } from 'fp-ts/lib/function';
import { Mixed, Props } from 'io-ts';

export type LikeStruct = {
  type: unknown;
  decode: ReturnType<typeof decodeWithValidationErr>;
};

export const makeLikeStruct =
  <P extends Props>(ioProps: P) =>
  (isStrict: boolean) => {
    const isComplexType = (type: Mixed) => {
      return (
        '_tag' in type &&
        [
          'InterfaceType',
          'ExactType',
          'IntersectionType',
          'UnionType',
          'RecursiveType',
        ].includes(type._tag as string)
      );
    };
    const simplify = (props: Props) =>
      pipe(
        props,
        Record.map((t) => (isComplexType(t) ? io.unknown : t)),
      ) as Props;
    const originType = isStrict ? io.strict(ioProps) : io.type(ioProps);
    const simpleType = isStrict
      ? pipe(ioProps, simplify, io.strict)
      : pipe(ioProps, simplify, io.type);
    return {
      type: typeof originType,
      decode: decodeWithValidationErr(simpleType),
    } as LikeStruct;
  };

export function decodeWithValidationErr<T>(
  ioType: io.Type<T, unknown, unknown>,
) {
  return (exOps: { code: string }) => {
    return flow(
      ioType.decode,
      Either.mapLeft((e) =>
        pipe(
          NEA.fromArray(
            pipe(
              e,
              A.map(() =>
                BaseExceptionBhv.construct(
                  PathReporter.report(Either.left(e)),
                  exOps.code,
                ),
              ),
            ),
          ),
          Option.getOrElse(() =>
            NEA.of(
              BaseExceptionBhv.construct('', 'EMPTY_EXCEPTION_FROM_IO_DECODE'),
            ),
          ),
        ),
      ),
    );
  };
}
