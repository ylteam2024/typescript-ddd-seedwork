import {
  Column,
  PrimaryGeneratedColumn,
  ValueTransformer,
  CreateDateColumn,
  UpdateDateColumn,
  PrimaryColumn,
  ColumnType,
} from 'typeorm';
import { ColumnCommonOptions } from 'typeorm/decorator/options/ColumnCommonOptions';

export const Column4Char = () =>
  Column({
    type: 'varchar',
    length: 4,
    nullable: true,
  });

export const Column8Char = (props?: ColumnCommonOptions) =>
  Column({
    type: 'varchar',
    length: 8,
    nullable: true,
    ...props,
  });

export const Column16Char = () =>
  Column({
    type: 'varchar',
    length: 16,
    nullable: true,
  });

export const Column32Char = () =>
  Column({
    type: 'varchar',
    length: 32,
    nullable: true,
  });

export const Column64Char = () =>
  Column({
    type: 'varchar',
    length: 64,
    nullable: true,
  });

export const Column128Char = () =>
  Column({
    type: 'varchar',
    length: 128,
    nullable: true,
  });

export const Column255Char = (option = { select: true }) =>
  Column({
    type: 'varchar',
    length: 255,
    nullable: true,
    select: option.select,
  });

export const Column512Char = (option = { select: true }) =>
  Column({
    type: 'varchar',
    length: 512,
    nullable: true,
    select: option.select,
  });

export const ColumnNChar = (length: number) =>
  Column({
    type: 'varchar',
    length,
    nullable: true,
  });

export const ColumnBlob = () =>
  Column({
    type: 'mediumblob',
    nullable: true,
  });

export const ColumnBoolean = () =>
  Column({
    type: 'boolean',
    nullable: true,
  });

export const ColumnDate = () =>
  Column({
    type: 'date',
    nullable: true,
  });

export const ColumnDateTime = () =>
  Column({
    type: 'timestamp',
    precision: 0,
    nullable: true,
    default: 'CURRENT_TIMESTAMP',
  });

export const ColumnDecimal = () =>
  Column({
    type: 'double',
    nullable: true,
    precision: 255,
    scale: 2,
  });

export const ColumnJsonText = () =>
  Column({
    type: 'text',
    nullable: true,
    transformer: StringObject,
  });

export const ColumnJsonVarchar = () =>
  Column({
    type: 'varchar',
    nullable: true,
    transformer: StringObject,
  });

export const ColumnSmallInt = () =>
  Column({
    type: 'smallint',
    nullable: true,
  });

export const ColumnText = () =>
  Column({
    type: 'text',
    nullable: true,
  });

export const ColumnTinyInt = (option = { default: null }) =>
  Column({
    type: 'smallint',
    nullable: true,
    default: option.default,
  });

export const ColumnBigInt = (option = { default: null }) =>
  Column({
    type: 'bigint',
    nullable: true,
    default: option.default,
  });

export const ColumnInt = (option = { default: null }) =>
  Column({
    type: 'int',
    nullable: true,
    default: option.default,
  });

export const ColumnUnsignedForeignKey = () =>
  Column({
    unsigned: true,
    nullable: true,
  });

export const ColumnPrimaryKey = () =>
  PrimaryGeneratedColumn({
    unsigned: false,
  });

export const ColumnNotAutoGenPrimaryKey = (
  option = { type: 'bigint' as ColumnType },
) =>
  PrimaryColumn({
    unsigned: false,
    type: option.type,
  });

export const ColumnUnsignedPrimaryKey = () =>
  PrimaryGeneratedColumn({
    unsigned: true,
  });

export const CreatedAt = (option = { select: true }) =>
  CreateDateColumn({
    type: 'timestamp',
    nullable: true,
    precision: 0,
    select: option.select,
    default: () => 'CURRENT_TIMESTAMP',
  });

export const UpdatedAt = (option = { select: true }) =>
  UpdateDateColumn({
    type: 'timestamp',
    nullable: true,
    precision: 0,
    select: option.select,
    default: () => 'CURRENT_TIMESTAMP',
    onUpdate: 'CURRENT_TIMESTAMP',
  });

export const ColumnJson = () =>
  Column({
    nullable: true,
    type: 'json',
  });

export const ColumnJsonB = () =>
  Column({
    nullable: true,
    type: 'jsonb',
  });

export const ColumnFloat = (option = { default: null }) =>
  Column({
    type: 'float',
    nullable: true,
    default: option.default,
  });

export const StringObject: ValueTransformer = {
  to: (value: string) => {
    if (value) {
      if (typeof value === 'string') {
        return JSON.stringify(JSON.parse(value));
      }
      return JSON.stringify(value);
    }
  },
  from: (value: string) => {
    if (value) {
      return JSON.parse(value);
    }
  },
};
