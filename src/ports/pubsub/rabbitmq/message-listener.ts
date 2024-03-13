import { MessageType } from './message-type';

export abstract class MessageListener {
  /*
  I am a message listener, which is given each message received
  by a MessageConsumer. I am also an adapter because I provide
  defaults for both handleMessage() behaviors. A typical subclass
  would override one or the other handleMessage() based on its
  type and leave the remaining handleMessage() defaulted since
  it will never be used by MessageConsumer.
  */

  private _type: MessageType;

  constructor(aType: MessageType) {
    this.setType(aType);
  }

  type() {
    /*
    Answers my type.
    @return Type
    */
    return this._type;
  }

  setType(aMessageType: MessageType) {
    /**
     * Sets my type.
     *
     * @param {Type} a_type - The type to set as my type.
     */
    this._type = aMessageType;
  }

  abstract handleMessage(
    aType: string,
    aMessageId: string,
    aTimeStamp: Date,
    aMessage: Buffer,
    aDeliveryTag: number,
    isRedelivery: boolean,
  ): Promise<void>;
  /**
   * Handles a binary message. If any MessageException is thrown by
   * the implementor, its isRetry() method is examined, and if it returns
   * true, the message being handled will be nack'd and re-queued. Otherwise,
   * if its isRetry() method returns false, the message will be rejected/failed
   * (not re-queued). If any other Exception is thrown, the message will be
   * considered not handled and will be rejected/failed.
   *
   * @param {string|null} aType - The string type of the message if sent, or null.
   * @param {string|null} aMessageId - The string id of the message if sent, or null.
   * @param {Date|null} aTimestamp - The timestamp of the message if sent, or null.
   * @param {Buffer|string} aMessage - The byte array or text containing the binary message.
   * @param {number} aDeliveryTag - The tag delivered with the message.
   * @param {boolean} isRedelivery - A boolean indicating whether or not this message is a redelivery.
   * @throws {Exception} When any problem occurs and the message must not be acknowledged.
   */
}
