import { randomItem } from '@logic/utils';
import {
  MessageType,
  ConnectionSettings,
  Exchange,
  ExchangeListener,
  ExchangeType,
} from '@ports/pubsub/rabbitmq';
import { randomUUID } from 'crypto';
import { MockEventHandlingTracker } from '../mock/MockEventHandlingTracker';

describe('Exchange Listener', () => {
  let connectionSetting = null;
  const fanoutExchangeName = 'exchange_for_test_exchange_listener_fanout';
  const directExchangeName = 'exchange_for_test_exchange_listener_direct';
  const messageTypes = ['test_message_type'];
  // init an random queueName to prevent consumer of test receive any event that emitted in the pass
  const newQueueName = () => `queue_for_test_exchange_listener_${randomUUID()}`;
  let exchanges = [];

  beforeAll(() => {
    connectionSetting = ConnectionSettings.factory(
      'localhost',
      5672,
      'dino_ai_market',
      'dino_123456',
      'dino_ai_market',
    );
  });

  class AbstractMockListener extends ExchangeListener {
    queueDurable = false;
    queueAutoDeleted = false;
    // exchangeAutoDelete = false;
    connectionSetting = connectionSetting;
    label = 'MockListener';

    _exchangeName: string;
    constructor() {
      const eventHandlingTracker = new MockEventHandlingTracker();
      super(eventHandlingTracker);
    }

    startListener() {
      this.start((error) => {
        console.error('start error ', error);
        throw error;
      });
    }

    override listenTo(): string[] {
      return messageTypes;
    }

    override queueName(): string {
      return newQueueName();
    }
    async handle(
      aType: string,
      aMessageId: string,
      aTimeStamp: Date,
      aMessage: string,
      aDeliveryTag: number,
      isRedelivery: boolean,
    ) {
      return null;
    }

    async filteredDispatch(
      aType: string,
      aMessageId: string,
      aTimeStamp: Date,
      aMessage: string,
      aDeliveryTag: number,
      isRedelivery: boolean,
    ): Promise<void> {
      console.info(`Handle message [type] ${aType} [content] ${aMessage}`);
      await this.handle(
        aType,
        aMessageId,
        aTimeStamp,
        aMessage,
        aDeliveryTag,
        isRedelivery,
      );
    }
  }

  const getExchangeFromListener = async (listener: ExchangeListener) => {
    const exchange: Exchange = await new Promise((resolve, reject) => {
      if (listener.isReadyForConsuming()) {
        resolve(listener.getExchange());
      } else {
        listener.registerOnReady(() => {
          resolve(listener.getExchange());
        });
      }
    });
    return exchange;
  };

  const pushMessageByExchange = (
    exchange: Exchange,
    messageId: string,
    routingKey?: string,
    messageType?: string,
  ) => {
    exchange
      .getChannel()
      .publish(
        exchange.getName(),
        routingKey,
        Buffer.from('this is message', 'utf-8'),
        {
          type: messageType ?? messageTypes[0],
          contentEncoding: 'utf-8',
          deliveryMode: 2,
          contentType: MessageType.TEXT,
          messageId,
        },
      );
  };
  describe('Constructor', () => {
    jest.setTimeout(50000);

    it('Test fanout exchange listener', async () => {
      let handled = false;
      // let exchange: Exchange = null;
      let listener: AbstractMockListener = null;
      await new Promise(async (resolve, reject) => {
        const messageId = randomUUID();
        class MockListener extends AbstractMockListener {
          // isDurable = false;
          exchangeType = ExchangeType.FANOUT;
          queueDurable = true;
          override async handle(
            aType: string,
            aMessageId: string,
            aTimeStamp: Date,
            aMessage: string,
            aDeliveryTag: number,
            isRedelivery: boolean,
          ): Promise<void> {
            if (aMessageId === messageId) {
              handled = true;
              resolve(aMessage);
            }
          }
          exchangeName(): string {
            return fanoutExchangeName;
          }
        }
        try {
          listener = new MockListener();
          listener.startListener();

          expect(listener.label).toBe('MockListener');
          expect(listener.connectionSetting).toBe(connectionSetting);

          // when listener ready

          const _exchange: Exchange = await getExchangeFromListener(listener);

          exchanges.push(_exchange);
          // exchange = _exchange;
          pushMessageByExchange(_exchange, messageId);

          const queue = listener.getQueue();
          expect(queue.isDurable()).toBe(true);
        } catch (error) {
          reject(error);
        }
      });
      expect(handled).toBe(true);
      // const spyOnAck = jest.spyOn(exchange.getChannel(), "ack");
      // expect(spyOnAck).toHaveBeenCalled();
    });

    it('constructing durable exchange listener', async () => {
      let handled = false;
      // let exchange: Exchange = null;
      let listener: AbstractMockListener = null;
      const messageId = randomUUID();
      await new Promise(async (resolve, reject) => {
        class MockListener extends AbstractMockListener {
          exchangeDurable = true;
          exchangeType = ExchangeType.FANOUT;

          override async handle(
            aType: string,
            aMessageId: string,
            aTimeStamp: Date,
            aMessage: string,
            aDeliveryTag: number,
            isRedelivery: boolean,
          ): Promise<void> {
            handled = true;
            if (aMessageId === messageId) {
              resolve(aMessage);
            }
          }
          exchangeName(): string {
            return fanoutExchangeName;
          }
        }
        try {
          listener = new MockListener();
          listener.startListener();
          expect(listener.label).toBe('MockListener');
          expect(listener.connectionSetting).toBe(connectionSetting);

          // when listener ready

          const _exchange: Exchange = await getExchangeFromListener(listener);

          exchanges.push(_exchange);
          // exchange = _exchange;
          pushMessageByExchange(_exchange, messageId);
        } catch (error) {
          reject(error);
        }
      });
      expect(handled).toBe(true);
    });
  });
  it('Test Direct Routing Exchange Listener', async () => {
    let handled = false;
    // let exchange: Exchange = null;
    let listener: AbstractMockListener = null;
    const messageId = randomUUID();
    const routingKeys = ['mock_routing_key1', 'mock_routing_key2'];
    await new Promise(async (resolve, reject) => {
      class MockListenerTarget extends AbstractMockListener {
        exchangeType = ExchangeType.DIRECT;
        queueRoutingKeys = routingKeys;

        override async handle(
          aType: string,
          aMessageId: string,
          aTimeStamp: Date,
          aMessage: string,
          aDeliveryTag: number,
          isRedelivery: boolean,
        ): Promise<void> {
          handled = true;
          if (aMessageId === messageId) {
            resolve(aMessage);
          }
        }
        override exchangeName(): string {
          return directExchangeName;
        }
        queueName(): string {
          return newQueueName();
        }
      }
      try {
        listener = new MockListenerTarget();
        listener.startListener();

        expect(listener.label).toBe('MockListener');
        expect(listener.connectionSetting).toBe(connectionSetting);

        // when listener ready

        const _exchange: Exchange = await getExchangeFromListener(listener);

        exchanges.push(_exchange);
        // exchange = _exchange;
        pushMessageByExchange(_exchange, messageId, randomItem(routingKeys));
      } catch (error) {
        reject(error);
      }
    });
    expect(handled).toBe(true);
  });

  it('Test Direct Routing Exchange Listener with Default Routing', async () => {
    let handled = false;
    // let exchange: Exchange = null;
    let listener: AbstractMockListener = null;
    const messageId = randomUUID();
    const testDirectMessageType = 'test_direct_message_type';
    await new Promise(async (resolve, reject) => {
      class MockListenerTarget extends AbstractMockListener {
        exchangeType = ExchangeType.DIRECT;

        override async handle(
          aType: string,
          aMessageId: string,
          aTimeStamp: Date,
          aMessage: string,
          aDeliveryTag: number,
          isRedelivery: boolean,
        ): Promise<void> {
          handled = true;
          if (aMessageId === messageId) {
            console.log('handle message in default routing ');
            resolve(aMessage);
          }
        }
        override exchangeName(): string {
          return directExchangeName;
        }
        listenTo(): string[] {
          return [testDirectMessageType];
        }
      }
      try {
        listener = new MockListenerTarget();
        listener.startListener();

        expect(listener.label).toBe('MockListener');
        expect(listener.connectionSetting).toBe(connectionSetting);

        // when listener ready

        const _exchange: Exchange = await getExchangeFromListener(listener);

        exchanges.push(_exchange);
        // exchange = _exchange;
        pushMessageByExchange(
          _exchange,
          messageId,
          testDirectMessageType,
          testDirectMessageType,
        );
      } catch (error) {
        reject(error);
      }
    });
    expect(handled).toBe(true);
  });
  afterEach(async () => {
    await Promise.all(exchanges.map((exchange: Exchange) => exchange.close()));
    exchanges = [];
  });
});
