/**
 * @desc ValueObjects are objects that we determine their
 * equality through their structrual property.
 */

import { AssertionConcern } from '@logic/AssertionConcern';
import { ExcludeFunctionProps } from '@type_util/ExcludeFunctionProps';

export type ValueObjectProps<T> = ExcludeFunctionProps<T>;

export abstract class ValueObject extends AssertionConcern {
  constructor() {
    super();
  }

  shallowEqual(vo: ValueObject) {
    return vo === this;
  }

  public equals(vo?: ValueObject): boolean {
    if (vo === null || vo === undefined) {
      return false;
    }
    if (typeof vo !== typeof this) {
      return false;
    }
    return this.shallowEqual(vo);
  }
}
