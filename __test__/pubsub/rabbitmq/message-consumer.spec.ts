import {
  ConnectionSettings,
  Exchange,
  MessageConsumer,
  MessageListener,
  MessageType,
  Queue,
} from '@ports/pubsub/rabbitmq';
import { randomUUID } from 'crypto';

describe('Message Consumer', () => {
  let queue: Queue = null;
  let exchange: Exchange = null;
  let connectionSetting = null;
  const exchangeName = 'exchange_testing_message_listener';
  const routingKey = 'test_routing';
  const messageType = 'test_message_type';

  beforeAll(async () => {
    connectionSetting = ConnectionSettings.factory(
      'localhost',
      5672,
      'dino_ai_market',
      'dino_123456',
      'dino_ai_market',
    );
    exchange = await Exchange.asyncDirectInstance(
      connectionSetting,
      exchangeName,
      true,
    );

    queue = await Queue.asyncFactoryExchangeSubcriberWithRoutingKeysAutoName(
      exchange,
      [routingKey],
      true,
      false,
      false,
    );
  });

  it('Test constructor', async () => {
    const mockIsAutoAck = false;
    const mockIsRetry = false;
    const consumer = await MessageConsumer.factory(
      queue,
      mockIsAutoAck,
      mockIsRetry,
    );
    expect(consumer.isAutoAcknowledge()).toBe(mockIsAutoAck);
    expect(consumer.isRetry()).toBe(mockIsRetry);
    expect(consumer.isReady()).toBe(true);
  });

  it('Test handle delivery', async () => {
    jest.setTimeout(20000);
    const consumer = await MessageConsumer.factory(queue, true, false);
    let isMessageHandled = false;
    await new Promise(async (resolve, reject) => {
      class TestMessageListener extends MessageListener {
        async handleMessage(
          aType: string,
          aMessageId: string,
          aTimeStamp: Date,
          aMessage: Buffer,
          aDeliveryTag: number,
          isRedelivery: boolean,
        ): Promise<void> {
          console.log(
            `[TEST] handle message with [type] ${aType}, [messageID] ${aMessageId}, [timestamp] ${aTimeStamp}, [message] ${aMessage.toString()}, [delivery tag] ${aDeliveryTag}`,
          );
          isMessageHandled = true;
          resolve(aMessage);
        }
      }
      try {
        await consumer.receiveOnly(
          [messageType],
          new TestMessageListener(MessageType.TEXT),
        );

        exchange
          .getChannel()
          .publish(exchangeName, routingKey, Buffer.from('message', 'utf-8'), {
            type: messageType,
            contentEncoding: 'utf-8',
            deliveryMode: 2, // Trasient
            contentType: MessageType.TEXT,
            messageId: randomUUID(),
          });
      } catch (error) {
        reject(error);
      }
    });
    expect(isMessageHandled).toBe(true);
  });

  afterAll(async () => {
    await exchange.close();
  });
});
