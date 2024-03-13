import {
  CreateDateColumn,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export abstract class TypeormEntityBase {
  constructor(props?: unknown) {
    if (props) {
      Object.assign(this, props);
    }
  }

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

export abstract class AggregateTypeORMEntityBase extends TypeormEntityBase {
  constructor(props?: unknown) {
    super(props);
  }

  @PrimaryGeneratedColumn('uuid')
  id: string;
}
