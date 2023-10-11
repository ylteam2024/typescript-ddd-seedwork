import { CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { ColumnPrimaryKey } from './columns';

export abstract class TypeormEntityBase<RawIdentityType> {
  constructor(props?: unknown) {
    if (props) {
      Object.assign(this, props);
    }
  }
  @ColumnPrimaryKey()
  id: RawIdentityType;

  @CreateDateColumn({
    type: 'timestamptz',
    update: false,
  })
  createdAt: Date;

  @UpdateDateColumn({
    type: 'timestamptz',
  })
  updatedAt: Date;
}
