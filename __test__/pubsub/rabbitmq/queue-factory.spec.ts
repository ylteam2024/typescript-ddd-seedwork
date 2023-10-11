import { ConnectionSettings, Exchange, Queue } from '@ports/pubsub/rabbitmq';

const exchangeFactory = async (
  name: string,
  connectionSettings: ConnectionSettings,
) => {
  const exchange: Exchange = await new Promise((resolve, reject) => {
    Exchange.directInstance(
      connectionSettings,
      name,
      true,
      false,
      async (exchange) => {
        resolve(exchange);
      },
      async (error) => {
        reject(error);
      },
    );
  });
  return exchange;
};

describe('QueueFactory', function () {
  let connectionSettings: ConnectionSettings;
  beforeEach(() => {
    connectionSettings = ConnectionSettings.factory(
      'localhost',
      5672,
      'dino_ai_market',
      'dino_123456',
      'dino_ai_market',
    );
  });
  describe('constructor', function () {
    let existQueues: Queue[] = [];
    let existExchanges: Exchange[] = [];
    jest.setTimeout(10000);
    it('factory work normally', async function () {
      let ok = false;
      const queue: Queue = await new Promise((resolve, reject) => {
        Queue.factory(
          connectionSettings,
          'client_pubsub_subscribe_queue_test',
          true,
          false,
          false,
          async (newQueue: Queue) => {
            ok = true;
            resolve(newQueue);
          },
          async (error) => {
            console.log('test error', error);
            reject(error);
          },
        );
      });
      expect(queue).toBeInstanceOf(Queue);
      // Queue only declared as an abstract instance
      // , but not realized on the broker yet
      expect(queue.isQueueReady()).toBe(false);
      expect(ok).toBe(true);
      existQueues.push(queue);
    });

    it('factory exchange subscriber', async function () {
      let ok = false;
      const exchange: Exchange = await exchangeFactory(
        'factory_exchage_subscriber_test_exchange',
        connectionSettings,
      );
      const queue: Queue = await new Promise((resolve, reject) => {
        Queue.factoryFanoutExchangeSubscriber(
          exchange,
          'factory_exchage_subscriber_test_channel',
          false,
          true,
          false,
          async (newQueue: Queue) => {
            ok = true;
            resolve(newQueue);
          },
          async (error) => {
            reject(error);
          },
        );
      });
      expect(queue).toBeInstanceOf(Queue);
      expect(queue.isQueueReady()).toBe(true);
      expect(ok).toBe(true);
      existExchanges.push(exchange);
    });

    it('factory exchange subscriber with routings key', async function () {
      let ok = false;
      const exchange: Exchange = await exchangeFactory(
        'factory_exchage_subscriber_test_exchange',
        connectionSettings,
      );
      const queue: Queue = await new Promise((resolve, reject) => {
        Queue.factoryExchangeSubcriberWithRoutingKeysAutoName(
          exchange,
          ['test_routing_key'],
          false,
          true,
          false,
          async (newQueue: Queue) => {
            ok = true;
            resolve(newQueue);
          },
          async (error) => {
            reject(error);
          },
        );
      });
      expect(queue).toBeInstanceOf(Queue);
      expect(queue.isQueueReady()).toBe(true);
      expect(ok).toBe(true);
      existExchanges.push(exchange);
    });

    afterAll(async () => {
      await Promise.all(
        existExchanges.map(async (exchange) => {
          await exchange.close();
        }),
      );
      await Promise.all(
        existQueues.map(async (queue) => {
          await queue.close();
        }),
      );
      existExchanges = [];
      existQueues = [];
    });
  });
});
