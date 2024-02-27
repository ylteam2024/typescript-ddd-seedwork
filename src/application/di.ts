import { DomainService } from '@model/domain-service.base';
import { UsecaseHandler } from './usecase.base';
import { Reader } from '@logic/fp';

export type WithDeps<
  A extends UsecaseHandler | DomainService<unknown, unknown>,
  Deps = void,
> = Reader.Reader<Deps, A>;

export type InsWithDeps<
  WD extends WithDeps<
    UsecaseHandler | DomainService<unknown, unknown>,
    unknown
  >,
> = ReturnType<WD>;
