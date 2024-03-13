import { EventHandlingTracker } from '@ports/pubsub/event-handling-tracker.base';

export class MockEventHandlingTracker implements EventHandlingTracker {
  store: Record<string, boolean> = {};

  checkIfNotifHandled(aMessageId: string): Promise<boolean> {
    return Promise.resolve(this.store[aMessageId]);
  }

  markNotifAsHandled(aMessageId: string): Promise<void> {
    this.store[aMessageId] = true;
    return Promise.resolve();
  }
}
