import * as Optics from '@fp-ts/optic';
import * as Eq from 'fp-ts/Eq';
import * as S from 'fp-ts/string';
import * as Record from 'fp-ts/Record';
import * as Apply from 'fp-ts/Apply';
import * as O from 'fp-ts/Option';
import * as Reader from 'fp-ts/Reader';
import * as TaskEither from 'fp-ts/TaskEither';
import * as Task from 'fp-ts/Task';
import * as Either from 'fp-ts/Either';
import * as IO from 'fp-ts/IO';
import * as State from 'fp-ts/State';
import * as IOEither from 'fp-ts/IOEither';
import * as Arr from 'fp-ts/Array';
import * as NEA from 'fp-ts/NonEmptyArray';
import * as NUM from 'fp-ts/number';
import * as RRecord from 'fp-ts/ReadonlyRecord';
import * as io from 'io-ts';
import * as IoTypes from 'io-ts-types';
export * as rd from 'ramda';
import { pipe, flow } from 'fp-ts/lib/function';
import { BaseException } from './exception.base';
import { ValidationErr } from '@model/invariant-validation';

type SumException = BaseException | BaseException[] | ValidationErr;
export type BaseTE<T> = TaskEither.TaskEither<SumException, T>;

export type BaseEither<T> = Either.Either<SumException, T>;

export const absordTE = <T extends TaskEither.TaskEither<any, any>>(te: T) =>
  pipe(
    te,
    TaskEither.map(() => {}),
  );

export {
  Optics,
  Eq,
  pipe,
  flow,
  O as Option,
  S,
  NUM,
  Reader,
  TaskEither as TE,
  IO,
  IOEither,
  io,
  Task,
  Arr,
  Either,
  NEA,
  State,
  RRecord,
  Record,
  IoTypes,
  Apply,
};
