import { BaseExceptionTrait } from '@logic/exception.base';
import { JsonMediaReader } from 'src/serializer/JsonReader';

export class NotificationMessageReader extends JsonMediaReader {
  private event: Record<string, any>;
  constructor(aNotificationMessage: string) {
    super(aNotificationMessage);
    this.event = this.getRepresentation()['event'];
    if (!this.event) {
      BaseExceptionTrait.panic(
        BaseExceptionTrait.construct(
          'Notification does not contains event information',
          'NOTIFICATION_NULL',
        ),
      );
    }
  }

  static override read(aNotificationMessage: string) {
    return new NotificationMessageReader(aNotificationMessage);
  }
  eventPath(path: string) {
    return `/event${path}`;
  }
  eventStringValue(path: string) {
    return this.stringValue(this.eventPath(path));
  }

  eventNumberValue(path: string) {
    return this.numberValue(this.eventPath(path));
  }

  eventBooleanValue(path: string) {
    return this.booleanValue(this.eventPath(path));
  }

  eventDateValue(path: string) {
    return this.dateValue(this.eventPath(path));
  }
}
