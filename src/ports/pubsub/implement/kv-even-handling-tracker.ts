import { AbstractKeyValueRepository } from '@ports/database/keyvalue/key-value.repository';
import { EventHandlingTracker } from '../event-handling-tracker.base';

export class KVEventHandlingTracker implements EventHandlingTracker {
  private keyValueStore: AbstractKeyValueRepository;
  private prefix: string;
  constructor(keyValueStore: AbstractKeyValueRepository, prefix: string) {
    this.prefix = prefix;
    this.keyValueStore = keyValueStore;
  }

  static factory(keyValueStore: AbstractKeyValueRepository, prefix: string) {
    return new KVEventHandlingTracker(keyValueStore, prefix);
  }

  keyWithPrefix(key: string) {
    return this.prefix ? `${this.prefix}:${key}` : key;
  }
  async checkIfNotifHandled(aMessageId: string): Promise<boolean> {
    const v = await this.keyValueStore.get(this.keyWithPrefix(aMessageId));
    return (v && v.toString()) === 'true';
  }

  async markNotifAsHandled(aMessageId: string): Promise<void> {
    await this.keyValueStore.set(this.keyWithPrefix(aMessageId), 'true');
  }
}
