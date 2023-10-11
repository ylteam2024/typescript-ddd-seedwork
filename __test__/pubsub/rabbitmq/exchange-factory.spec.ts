import {
  ConnectionSettings,
  Exchange,
  ExchangeType,
} from '@ports/pubsub/rabbitmq';

describe('Exchange Factory', function () {
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
    jest.setTimeout(10000);
    let existExchanges = [];

    it('constructor instance', async function () {
      const factories = [
        {
          type: ExchangeType.DIRECT,
          factory: Exchange.directInstance,
        },
        {
          type: ExchangeType.FANOUT,
          factory: Exchange.fanoutInstance,
        },
        {
          type: ExchangeType.HEADERS,
          factory: Exchange.headerInstance,
        },
      ];
      await Promise.all(
        factories.map(async (item) => {
          let ok = false;
          const exchange: Exchange = await new Promise((resolve, reject) => {
            item.factory(
              connectionSettings,
              `client_pubsub_subscribe_exchange_test_${item.type}`,
              true,
              false,
              async (newExchange: Exchange) => {
                ok = true;
                resolve(newExchange);
              },
              async (error) => {
                console.log('test error', error);
                reject(error);
              },
            );
          });
          expect(exchange).toBeInstanceOf(Exchange);
          expect(exchange.isExchangeReady()).toBe(true);
          expect(ok).toBe(true);
          expect(exchange.exchangeType()).toBe(item.type);
          existExchanges.push(exchange);
        }),
      );
    });

    afterEach(async () => {
      await Promise.all(
        existExchanges.map(async (exchange) => {
          await exchange.close();
        }),
      );
      existExchanges = [];
    });
  });
});
