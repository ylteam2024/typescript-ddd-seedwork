import { BaseException, BaseExceptionBhv } from '@logic/exception.base';
import {
  getConsoleDomainLogger,
  ConsoleDomainLogger,
} from '@ports/domain-logger';
import { Channel, Message } from 'amqplib';
import { MessageListener } from './message-listener';
import { Queue } from './queue';

export class MessageConsumer {
  private _autoAcknowled: boolean;

  // My closed property, which indicates I have been closed.
  private _closed = false;

  private _consuming = false;

  private _isReady = false;

  private _isRetry = false;

  // My messageTypes, which indicates the messages of types I accept
  private _messageTypes: Set<string>;

  private _prefetchCount = 1;

  // My queue, which is where my messages come from.
  private _queue: Queue;

  private _label: string;

  private _tag: string;

  logger: ConsoleDomainLogger;

  constructor(
    aQueue: Queue,
    isAutoAcknowledge: boolean,
    isRetry = false,
    label = '',
  ) {
    this.setQueue(aQueue);
    this.setAutoAck(isAutoAcknowledge);
    this.setMessageTypes(new Set());
    this._isRetry = isRetry;
    this._label = label;
    this.logger = getConsoleDomainLogger(`MessageConsumer ${label}`);
  }

  static async factory(
    queue: Queue,
    isAutoAcknowledge = false,
    isRetry = false,
    label = '',
  ) {
    const consumer = new MessageConsumer(
      queue,
      isAutoAcknowledge,
      isRetry,
      label,
    );
    await consumer.equalizeMessageDistribution();
    return consumer;
  }

  isAutoAcknowledge() {
    return this._autoAcknowled;
  }

  setAutoAck(aBool: boolean) {
    this._autoAcknowled = aBool;
  }

  queue() {
    return this._queue;
  }

  setQueue(aQueue: Queue) {
    this._queue = aQueue;
  }

  tag() {
    return this._tag;
  }

  label() {
    return this._label;
  }

  isConsuming() {
    return this._consuming;
  }

  isReady() {
    return this._isReady;
  }

  isRetry() {
    return this._isRetry;
  }

  setIsReady(aBool: boolean) {
    this._isReady = aBool;
  }

  setIsConsuming(aBool: boolean) {
    this._consuming = aBool;
  }

  setTag(aTag: string) {
    this._tag = aTag;
  }

  messageTypes(): Set<string> {
    return this._messageTypes;
  }

  setMessageTypes(aMessageTypes: Set<string>) {
    this._messageTypes = aMessageTypes;
  }

  isClosed() {
    return this._closed;
  }

  async equalizeMessageDistribution() {
    /*
    Ensure an equalization of message distribution
    across all consumers of this queue.
    */
    try {
      await this.queue().getChannel().prefetch(this._prefetchCount);
      this.logger.info(`QOS set to: ${this._prefetchCount}`);
      this.setIsReady(true);
    } catch (error) {
      BaseExceptionBhv.panic(
        BaseExceptionBhv.construct('', 'MESSAGE_EQUALIZE_PREFETCH'),
      );
    }
  }

  receiveAll(aMessageListener: MessageListener) {
    return this.receiveFor(aMessageListener);
  }

  isTargetMessageType(messageType?: string) {
    if (this.messageTypes().size === 0) {
      return true;
    } else {
      return !!messageType && this.messageTypes().has(messageType);
    }
  }
  ack(channel: Channel, message: Message) {
    try {
      if (!this.isAutoAcknowledge()) {
        channel.ack(message, false);
        this.logger.info(
          `ACK handle messsage success [content] ${message.content}`,
        );
      }
    } catch (error) {
      this.logger.info(`Exception on ACK ${error}`);
      throw error;
    }
  }
  private nak(channel: Channel, message: Message, isRetry: boolean) {
    try {
      if (!this.isAutoAcknowledge()) {
        channel.nack(message, false, isRetry);
        this.logger.info(`NACK message, is requeue ${isRetry}`);
      }
    } catch (error) {
      this.logger.info(`Exception on NACK ${error}`);
    }
  }

  private handleDeliveryException(
    channel: Channel,
    message: Message,
    isRetry: boolean,
    exception: BaseException,
  ) {
    this.logger.info(
      `Exception on handle delivery ${BaseExceptionBhv.getMessage(exception)}`,
    );
    this.nak(channel, message, isRetry);
  }

  private async handleDelivery(
    message: Message,
    aMessageListener: MessageListener,
  ) {
    const channel = this.queue().getChannel();
    try {
      const isTargetMessage = this.isTargetMessageType(message.properties.type);
      if (!isTargetMessage) {
        return this.ack(channel, message);
      }
      this.logger.info(`Handle delivery ${message.properties.type}`);
      await aMessageListener.handleMessage(
        message.properties.type,
        message.properties.messageId,
        message.properties.timestamp,
        message.content,
        message.fields.deliveryTag,
        message.fields.redelivered,
      );
      this.ack(channel, message);
    } catch (error) {
      this.handleDeliveryException(
        channel,
        message,
        this.isRetry(),
        BaseExceptionBhv.construct(
          error.toString(),
          'HANDLE_DELIVERY_EXCEPTION',
        ),
      );
    }
  }
  receiveOnly(aMessageTypes: string[], aMessageListener: MessageListener) {
    this.setMessageTypes(new Set(aMessageTypes));
    return this.receiveFor(aMessageListener);
  }

  async receiveFor(aMessageListener: MessageListener) {
    try {
      const channel = this.queue().getChannel();
      const tag = await channel.consume(
        this.queue().getName(),
        async (message) => {
          return await this.handleDelivery(message, aMessageListener);
        },
      );
      this.logger.info(
        `Register message listener success with [queue] ${this.queue().getName()}`,
      );
      channel.addListener('cancel', this.onConsumerCancelled);
      this.setTag(tag.consumerTag);
      this.setIsConsuming(true);
    } catch (error) {
      BaseExceptionBhv.panic(
        BaseExceptionBhv.construct('', 'INITIATE_CONSUMER_FAILED'),
      );
    }
  }

  async closeChannel() {
    const channel = this.queue().getChannel();
    if (channel) {
      await channel.close();
    }
  }

  private async onConsumerCancelled(methodFrame: any) {
    this.logger.info(
      `Consumer was cancelled remotely, shutting down: ${methodFrame}`,
    );
    await this.closeChannel();
  }

  private async stopConsuming() {
    const channel = this.queue().getChannel();
    await channel.cancel(this.tag());
    await this.queue().close();
  }

  async close() {
    /*
    Cleanly shutdown the connection to RabbitMQ by stopping the consumer
    with RabbitMQ. When RabbitMQ confirms the cancellation, on_cancelok
    will be invoked by pika, which will then closing the channel and
    connection. The IOLoop is started again because this method is invoked
    when CTRL-C is pressed raising a KeyboardInterrupt exception. This
    exception stops the IOLoop which needs to be running for pika to
    communicate with RabbitMQ. All of the commands issued prior to starting
    the IOLoop will be buffered but not processed.
    */
    this._closed = true;
    if (this.isConsuming()) {
      await this.stopConsuming();
    } else {
      await this.queue().close();
    }
  }
}
