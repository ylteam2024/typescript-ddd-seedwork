import { KVEventHandlingTracker } from '@ports/pubsub/implement/kv-even-handling-tracker';
import { MockKeyValueRepository } from '../mock/key-value-repository.mock';

describe('KeyValueEventHandlingTracker', () => {
  const keyValueEventHandlingTracker = KVEventHandlingTracker.factory(
    new MockKeyValueRepository(),
    'mock_prefix',
  );
  it('Test key value event handling method', async () => {
    const mockEventId = 'mock_event_id';
    const isFinish =
      await keyValueEventHandlingTracker.checkIfNotifHandled(mockEventId);
    expect(isFinish).toBe(false);
    await keyValueEventHandlingTracker.markNotifAsHandled(mockEventId);
    const _isFinish =
      await keyValueEventHandlingTracker.checkIfNotifHandled(mockEventId);
    expect(_isFinish).toBe(true);
  });
});
