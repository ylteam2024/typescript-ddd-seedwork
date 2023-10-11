import { AssertionConcern } from '@logic/AssertionConcern';
import { Identifier } from './Identifier';
import { DateVO } from './valueObjects/Date';

export interface CreateEntityProps<IdentifierType extends Identifier<any>> {
  id?: IdentifierType;
  [index: string]: any;
}

export abstract class Entity<
  IdentifierType extends Identifier<any>,
> extends AssertionConcern {
  protected _id: IdentifierType;
  protected updatedAt?: DateVO;
  protected createdAt: DateVO;

  constructor(props: CreateEntityProps<IdentifierType>) {
    super();
    this._id = props.id;
    this.createdAt = DateVO.fromDateValue();
  }

  id() {
    return this._id;
  }

  setId(id: IdentifierType) {
    this._id = id;
  }

  rawId() {
    return this.id().toValue();
  }

  public getUpdatedAt(): DateVO | null {
    return this.updatedAt;
  }

  public getCreatedAt(): DateVO | null {
    return this.createdAt;
  }

  public setUpdatedAt(aDate: DateVO) {
    this.updatedAt = aDate;
  }

  static isEntity(v: any) {
    return v instanceof Entity;
  }

  public equals(object?: Entity<Identifier<any>>): boolean {
    if (object == null || object == undefined) {
      return false;
    }

    if (this === object) {
      return true;
    }

    if (!Entity.isEntity(object)) {
      return false;
    }

    if (typeof object !== typeof this) {
      return false;
    }

    return this._id.equals(object._id);
  }
}
