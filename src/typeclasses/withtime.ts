import { Optics, Option } from '@logic/fp';

export type WithTime = {
  readonly createdAt: Option.Option<Date>;
  readonly updatedAt: Option.Option<Date>;
};

export const updatedAtLen = <T extends WithTime = WithTime>() =>
  Optics.id<T>().at('updatedAt');
export const createdAtLen = <T extends WithTime = WithTime>() =>
  Optics.id<T>().at('createdAt');
export const getUpdatedAt = <T extends WithTime = WithTime>(withTimeObj: T) =>
  Optics.get(updatedAtLen<T>())(withTimeObj);
export const getCreatedAt = <T extends WithTime = WithTime>(withTimeObj: T) =>
  Optics.get(createdAtLen<T>())(withTimeObj);
