export interface EventHandlingTracker {
  checkIfNotifHandled(aMessageId: string): Promise<boolean>;
  markNotifAsHandled(aMessageId: string): Promise<void>;
}
