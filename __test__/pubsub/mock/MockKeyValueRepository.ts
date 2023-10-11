import { AbstractKeyValueRepository } from "@ports/database/keyvalue/KeyValueRepository";

export class MockKeyValueRepository extends AbstractKeyValueRepository {
  dict: Record<string, string | number>

  constructor() {
    super()
    this.dict = {}
  }
  public set(key: string, value: string | number, expired_seconds?: number): Promise<void> {
    this.dict[this.keyWithPrefix(key)] = value
    return Promise.resolve()
  }

  public get(key: string): Promise<string | number> {
    return Promise.resolve(this.dict[this.keyWithPrefix(key)])
  }
}
