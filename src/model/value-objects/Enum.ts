import { BaseException } from '@logic/exception.base';
import { ValidationTrait } from '..';

export const parseEnumItemFromString =
  <T extends { [key: string]: string }>(enumT: T, exception: BaseException) =>
  (raw: string) => {
    const isEnumItem = (r: string): r is T[keyof T] => {
      return enumValues.includes(r);
    };
    const enumValues = Object.values(enumT);

    if (isEnumItem(raw)) {
      return ValidationTrait.right<T[keyof T], BaseException>(raw);
    }
    return ValidationTrait.left<T[keyof T], BaseException>(exception);
  };
