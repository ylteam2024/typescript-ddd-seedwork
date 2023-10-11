import { v4 as uuidV4, validate } from 'uuid';
import { Identifier } from '../Identifier';

export class UUID extends Identifier<string> {
  /**
   *Returns new ID instance with randomly generated ID value
   * @static
   * @return {*}  {ID}
   * @memberof ID
   */
  static generate(): UUID {
    return new UUID(uuidV4());
  }

  static init(uuid: string): UUID {
    const newId = new UUID(uuid);
    newId.validate();
    return newId;
  }

  protected validate(): void {
    this.assertStateTrue({
      aBoolean: validate(this.toValue()),
      aMessage: 'Incorrect UUID format',
    });
  }
}
