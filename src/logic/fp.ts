import * as Optics from '@fp-ts/optic';
import * as Eq from 'fp-ts/Eq';
import * as S from 'fp-ts/string';
import * as Record from 'fp-ts/Record';
import * as Apply from 'fp-ts/Apply';
import * as O from 'fp-ts/Option';
import * as Reader from 'fp-ts/Reader';
import * as TaskEither from 'fp-ts/TaskEither';
import * as Either from 'fp-ts/Either';
import * as IO from 'fp-ts/IO';
import * as State from 'fp-ts/State';
import * as IOEither from 'fp-ts/IOEither';
import * as Array from 'fp-ts/Array';
import * as NEA from 'fp-ts/NonEmptyArray';
import * as ReadonlyRecord from 'fp-ts/ReadonlyRecord';
import * as io from 'io-ts';
import * as IoTypes from 'io-ts-types';
import { pipe, flow } from 'fp-ts/lib/function';

export {
  Optics,
  Eq,
  pipe,
  flow,
  O as Option,
  S,
  Reader,
  TaskEither as TE,
  IO,
  io,
  Array,
  Either,
  NEA,
  IOEither,
  State,
  ReadonlyRecord,
  Record,
  IoTypes,
  Apply,
};
