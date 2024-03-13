import {
  ConsoleDomainLogger,
  getConsoleDomainLogger,
} from '@ports/domain-logger';
import { ArbFunction } from '@type_util/function';
import { EventHandlingTracker } from '../event-handling-tracker.base';
import { ConnectionSettings } from './connection-setting';
import { Exchange, ExchangeType } from './exchange';
import { MessageConsumer } from './message-consumer';
import { MessageListener } from './message-listener';
import { MessageType } from './message-type';
import { Queue } from './queue';

export class ExchangeListener {
  private messageConsumer?: MessageConsumer;
  private queue?: Queue;
  private exchange?: Exchange;
  private isReady = false;

  connectionSetting: ConnectionSettings;
  autoAck = false;
  isRetry = false;
  label = '';
  logger: ConsoleDomainLogger;
  eventHandlingTracker: EventHandlingTracker;

  // Exchange Property
  exchangeDurable = true;
  exchangeAutoDelete = false;
  exchangeType: ExchangeType;

  // Queue Property
  queueDurable = true;
  queueAutoDeleted = false;
  queueExclusive = true;
  queueRoutingKeys?: string[];

  private onReady?: ArbFunction;

  _queueRoutingKeys() {
    return this.queueRoutingKeys ?? this.listenTo();
  }

  constructor(eventHandlingTracker: EventHandlingTracker) {
    this.logger = getConsoleDomainLogger(`ExchangeListener ${this.label}`);
    this.eventHandlingTracker = eventHandlingTracker;
  }

  start(onStartError?: ArbFunction) {
    this.attachToQueue(onStartError);
  }

  registerOnReady(cb: ArbFunction) {
    this.onReady = cb;
  }

  getMessageConsumer(): MessageConsumer | null | undefined {
    return this.messageConsumer;
  }

  setMessageConsumer(aMessageConsumer: MessageConsumer) {
    this.messageConsumer = aMessageConsumer;
  }

  checkIfReady() {
    return this.isReady;
  }

  async close() {
    if (this.queue) {
      await this.queue.close();
    }
  }
  /*
  Answers the String name of the exchange I listen to.
  @return str
  */
  exchangeName(): string {
    throw Error('This method need to be overridden');
  }

  filteredDispatch(params: {
    aType: string;
    aMessageId: string;
    aTimeStamp: Date;
    aMessage: string;
    aDeliveryTag: number;
    isRedelivery: boolean;
  }): Promise<void> {
    throw Error('This method need to be overridden' + params);
  }

  /*
  Answers the kinds of messages I listen to.
  @return: List[str]
  */
  listenTo(): string[] {
    throw Error('This method need to be overridden');
  }
  /*
  Answers the str name of the queue I listen to. By
  default it is the simple name of my concrete class.
  May be overridden to change the name.
  @return: str
  */
  queueName(): string {
    throw Error('This method need to be overridden');
  }

  setExchange(anExchange: Exchange) {
    this.exchange = anExchange;
  }

  getExchange() {
    return this.exchange;
  }

  setQueue(aQueue: Queue) {
    this.queue = aQueue;
  }

  getQueue(): Queue | undefined {
    return this.queue;
  }

  attachToQueue(onAttachError?: ArbFunction) {
    const exchange = Exchange.factory(
      this.connectionSetting,
      this.exchangeName(),
      this.exchangeType,
      this.exchangeDurable,
      this.exchangeAutoDelete,
      (async (exchange: Exchange) => {
        const queue = Queue.factoryExchangeSubcriberWithRoutingKeysWithName(
          exchange,
          this.queueName(),
          this._queueRoutingKeys(),
          this.queueDurable,
          this.queueAutoDeleted,
          this.queueExclusive,
          this.registerConsumer.bind(this),
        );
        this.setQueue(queue);
      }).bind(this),
      onAttachError,
    );
    this.setExchange(exchange);
  }

  private async idempotentHandleDispatch(
    aType: string,
    aMessageId: string,
    aTimeStamp: Date,
    aMessage: Buffer,
    aDeliveryTag: number,
    isRedelivery: boolean,
  ) {
    const idempotentHandle = async (isHandled: boolean) => {
      if (!isHandled) {
        await this.filteredDispatch({
          aType,
          aMessageId,
          aTimeStamp,
          aMessage: aMessage.toString(), // utf8 decode
          aDeliveryTag,
          isRedelivery,
        });
        await this.eventHandlingTracker.markNotifAsHandled(aMessageId);
      }
    };
    const isEventHandled =
      await this.eventHandlingTracker.checkIfNotifHandled(aMessageId);
    await idempotentHandle(isEventHandled);
  }

  async registerConsumer(queue: Queue) {
    this.logger.info('Queue declaring finished, now register consumer');
    const idempotentHandleDispatch = this.idempotentHandleDispatch.bind(this);
    class MessageListenerAdapter extends MessageListener {
      handleMessage(
        aType: string,
        aMessageId: string,
        aTimeStamp: Date,
        aMessage: Buffer,
        aDeliveryTag: number,
        isRedelivery: boolean,
      ) {
        return idempotentHandleDispatch(
          aType,
          aMessageId,
          aTimeStamp,
          aMessage,
          aDeliveryTag,
          isRedelivery,
        );
      }
    }
    const messageConsumer = await MessageConsumer.factory(
      queue,
      this.autoAck,
      this.isRetry,
      this.label,
    );
    this.setMessageConsumer(messageConsumer);
    await messageConsumer.receiveOnly(
      this.listenTo(),
      new MessageListenerAdapter(MessageType.TEXT),
    );
    this.logger.info('Message Consumer registered successfully');
    this.isReady = true;
    if (this.onReady) {
      this.onReady(this);
    }
  }

  isReadyForConsuming(): boolean {
    return this.messageConsumer?.isConsuming?.() || false;
  }

  async stop() {
    const messageConsumer = this.messageConsumer;
    if (messageConsumer) {
      await messageConsumer.close();
    }
  }
}
