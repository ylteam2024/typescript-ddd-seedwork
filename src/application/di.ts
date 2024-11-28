import { DomainService } from '@model/domain-service.base';
import { UsecaseHandler } from './usecase.base';
import { Reader } from '@logic/fp';
import { IBaseMapper } from '@ports/mapper.base';

export type WithDeps<
  A extends
    | UsecaseHandler
    | DomainService<unknown, unknown>
    | IBaseMapper<any, any>,
  Deps = void,
> = Reader.Reader<Deps, A>;

export type InsWithDeps<
  WD extends WithDeps<
    UsecaseHandler | DomainService<unknown, unknown>,
    unknown
  >,
> = ReturnType<WD>;
