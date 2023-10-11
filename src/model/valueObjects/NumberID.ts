import { Identifier } from '../Identifier';

export class NID extends Identifier<number> {
  /**
   *Returns new ID instance with randomly generated ID value
   * @static
   * @return {*}  {ID}
   * @memberof ID
   */

  static init(nid: number): NID {
    const newId = new NID(nid);
    return newId;
  }
}
