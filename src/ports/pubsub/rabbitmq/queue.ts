import { ArbFunction, FutureArbFnc } from '@type_util/function';
import { BrokerComponent } from './broker-component';
import { ConnectionSettings } from './connection-setting';
import { Exchange } from './exchange';

type QueueSetupParam = {
  exclusive: boolean;
  durable: boolean;
  autoDelete: boolean;
};
/**
 * Parameters for constructing a Queue object.
 *
 * @interface QueueConstructorParams
 * @property {string} aName - The name of the queue.
 * @property {boolean} isDurable - Whether the queue should be durable (i.e. survive broker restarts).
 * @property {boolean} isExclusive - Whether the queue should be exclusive to the connection.
 * @property {boolean} isAutoDeleted - Whether the queue should be automatically deleted when the connection is closed.
 * @property {FutureArbFnc} [onSetupFinish] - An optional callback function to be called when queue setup is finished successfully.
 * @property {FutureArbFnc} [onSetupError] - An optional callback function to be called when queue setup encounters an error.
 * @property {Object} [init] - Optional initial connection settings for the queue.
 * @property {ConnectionSettings} init.aConnSettings - The connection settings for the queue.
 * @property {Object} [clone] - Optional settings to clone another Exchange or Queue object.
 * @property {(Exchange | Queue)} clone.aBrokerComponent - The Exchange or Queue object to clone from.
 */
interface QueueConstructorParams {
  aName: string;
  isDurable: boolean;
  isExclusive: boolean;
  isAutoDeleted: boolean;
  onSetupFinish?: FutureArbFnc;
  onSetupError?: FutureArbFnc;
  init?: {
    aConnSettings: ConnectionSettings;
  };
  clone?: {
    aBrokerComponent: Exchange | Queue;
  };
}

export class Queue extends BrokerComponent<QueueSetupParam> {
  isAutoDeleted: boolean;
  isExclusive: boolean;
  isReady: boolean;

  isQueue(): boolean {
    return true;
  }

  /**
   * @param props - QueueConstructorParams
   */
  constructor(props: QueueConstructorParams) {
    const {
      aName,
      isDurable,
      isExclusive,
      isAutoDeleted,
      onSetupFinish,
      onSetupError,
    } = props;
    const setupParams = {
      exclusive: isExclusive,
      durable: isDurable,
      autoDelete: isAutoDeleted,
    };
    if (props.init) {
      super({
        onSetupFinish,
        onSetupError,
        init: {
          aConnectionSettings: props.init.aConnSettings,
          aName,
        },
        setupParams,
      });
    } else if (props.clone) {
      super({
        onSetupFinish,
        onSetupError,
        clone: {
          aBrokerComponent: props.clone.aBrokerComponent,
          aName,
        },
        setupParams,
      });
    } else {
      throw Error('[PARAM_NOT_VALID] Cannot initialize Queue');
    }
    this.setIsDurable(isDurable);
    this.isExclusive = isExclusive;
    this.isAutoDeleted = isAutoDeleted;
    this.isReady = false;
  }

  static factoryUnderlyingQueue(
    aConnSettings: ConnectionSettings,
    aName: string,
    onSetupFinish: FutureArbFnc,
    onSetupError: FutureArbFnc,
  ) {
    /*
     * Answers a new instance of a Queue with the name a_name. The underlying
     * queue is non-durable, non-exclusive, and not auto-deleted.
     * @param a_connection_settings the ConnectionSettings
     * @param a_name the String name of the queue
     * @return Queue
     **/
    return new Queue({
      aName,
      isExclusive: false,
      isAutoDeleted: false,
      isDurable: false,
      onSetupFinish,
      onSetupError,
      init: { aConnSettings },
    });
  }

  /**
   * @param aConnSettings - ConnectionSetting
   * @param aName -
   * @param isDurable -
   * @param isExclusive -
   * @param isAutoDeleted -
   * @param onSetupFinish -
   * @param onSetupError -
   * @returns
   */
  static factory(
    aConnSettings: ConnectionSettings,
    aName: string,
    isDurable: boolean,
    isExclusive: boolean,
    isAutoDeleted: boolean,
    onSetupFinish: FutureArbFnc,
    onSetupError: FutureArbFnc,
  ) {
    return new Queue({
      aName,
      isDurable,
      isExclusive,
      isAutoDeleted,
      onSetupFinish,
      onSetupError,
      init: {
        aConnSettings,
      },
    });
  }

  static factoryDurableInstance(
    aConnSettings: ConnectionSettings,
    aName: string,
    onSetupFinish: FutureArbFnc,
    onSetupError: FutureArbFnc,
  ) {
    /**
     * Creates a new instance of a Queue with the given name. The underlying
     * queue is durable, exclusive, and not auto-deleted.
     *
     * @param {ConnectionSettings} aConnectionSettings - The connection settings.
     * @param {string} aName - The name of the queue.
     * @returns {Queue} A new instance of a durable, exclusive, and non-auto-deleted Queue.
     */
    return new Queue({
      aName,
      onSetupFinish,
      onSetupError,
      isDurable: true,
      isExclusive: false,
      isAutoDeleted: false,
      init: {
        aConnSettings,
      },
    });
  }

  static factoryDurableExclusiveInstance(
    aConnSettings: ConnectionSettings,
    aName: string,
    onSetupFinish: FutureArbFnc,
    onSetupError: FutureArbFnc,
  ) {
    /**

    answers a new instance of a queue with the name aname. the underlying
    queue is durable, exclusive, and not auto-deleted.
    @param {ConnectionSettings} a_connection_settings the connectionsettings
    @param {string} a_name the string name of the queue
    @return {object} queue
    */
    return new Queue({
      aName,
      onSetupFinish,
      onSetupError,
      isDurable: true,
      isExclusive: true,
      isAutoDeleted: false,
      init: {
        aConnSettings,
      },
    });
  }

  static factoryFanoutExchangeSubscriber(
    anExchange: Exchange,
    aName: string,
    isDurable: boolean,
    isAutoDeleted: boolean,
    isExclusive: boolean,
    cb: ArbFunction | null = null,
    onSetupError?: ArbFunction,
  ) {
    // this.logger.info(
    //   `[QUEUE] Factory a QUEUE is durable ${isDurable}, is_auto_deleted ${isAutoDeleted}, is_exclusive ${isExclusive}`
    // );
    return new Queue({
      aName,
      isDurable,
      isExclusive,
      isAutoDeleted,
      onSetupFinish: async (queue: Queue) => {
        await Queue.bindQueue(queue, anExchange, '');
        queue.setQueueIsReady(true);
        if (cb) {
          await cb(queue);
        }
      },
      onSetupError,
      clone: {
        aBrokerComponent: anExchange,
      },
    });
  }

  static async asyncFactoryFanoutExchangeSubscriber(
    anExchange: Exchange,
    aName: string,
    isDurable: boolean,
    isAutoDeleted: boolean,
    isExclusive: boolean,
  ) {
    const queue = await new Promise((resolve, reject) => {
      Queue.factoryFanoutExchangeSubscriber(
        anExchange,
        aName,
        isDurable,
        isAutoDeleted,
        isExclusive,
        async (queue) => {
          resolve(queue);
        },
        async (error) => {
          reject(error);
        },
      );
    });
    return queue;
  }

  static factoryExchangeSubcriberWithRoutingKeysAutoName(
    anExchange: Exchange,
    routingKeys: string[],
    isDurable: boolean,
    isAutoDeleted: boolean,
    isExclusive: boolean,
    cb: ArbFunction | null = null,
    onSetupError?: ArbFunction,
  ) {
    /*
     * Answers a new instance of a Queue that is bound to an_exchange, and
     * is ready to participate as an exchange subscriber (pub/sub). The
     * connection and channel of an_exchange are reused. The Queue is
     * uniquely named by the server, non-durable, exclusive, and auto-deleted.
     * The queue is bound to all routing keys in routing_keys. This Queue
     * style best works as a temporary direct or topic subscriber.
     *
     * @param {Exchange} an_exchange - the Exchange to bind with the new Queue
     * @return {Queue} - the new Queue instance
     */
    return this.factoryExchangeSubcriberWithRoutingKeysWithName(
      anExchange,
      '',
      routingKeys,
      isDurable,
      isAutoDeleted,
      isExclusive,
      cb,
      onSetupError,
    );
  }

  static asyncFactoryExchangeSubcriberWithRoutingKeysAutoName(
    anExchange: Exchange,
    routingKeys: string[],
    isDurable: boolean,
    isAutoDeleted: boolean,
    isExclusive: boolean,
  ) {
    return this.asyncFactoryExchangeSubcriberWithRoutingKeysWithName(
      anExchange,
      '',
      routingKeys,
      isDurable,
      isAutoDeleted,
      isExclusive,
    );
  }

  static factoryExchangeSubcriberWithRoutingKeysWithName(
    anExchange: Exchange,
    aName: string,
    routingKeys: string[],
    isDurable: boolean,
    isAutoDeleted: boolean,
    isExclusive: boolean,
    cb: ArbFunction | null = null,
    onSetupError?: ArbFunction,
  ): Queue {
    /**
     * Answers a new instance of a Queue that is bound to an exchange and
     * is ready to participate as an exchange subscriber (pub/sub). The
     * connection and channel of the exchange are reused. The Queue is named
     * by aName, unless it is empty, in which case the name is generated by
     * the broker. The Queue is bound to all routing keys in routingKeys,
     * or to no routing key if routingKeys is empty. The Queue has the
     * qualities specified by isDurable, isExclusive, and isAutoDeleted. This
     * factory is provided for ultimate flexibility in case no other
     * exchange-queue binder factories fit the needs of the client.
     *
     * @param {Exchange} anExchange - the Exchange to bind with the new Queue
     * @param {string} aName - the String name of the queue
     * @param {string[]} routingKeys - the routing keys to bind the queue to
     * @param {boolean} isDurable - the boolean indicating whether or not the Queue is durable
     * @param {boolean} isExclusive - the boolean indicating whether or not the Queue is exclusive
     * @param {boolean} isAutoDeleted - the boolean indicating whether or not the Queue should be auto-deleted
     * @returns {Queue}
     */
    return new Queue({
      aName,
      isDurable,
      isExclusive,
      isAutoDeleted,
      onSetupError,
      onSetupFinish: async (queue: Queue) => {
        if (routingKeys.length === 0) {
          await Queue.bindQueue(queue, anExchange, '');
        } else {
          await Promise.all(
            routingKeys.map((routingKey) =>
              Queue.bindQueue(queue, anExchange, routingKey),
            ),
          );
        }
        queue.setQueueIsReady(true);
        if (cb) {
          await cb(queue);
        }
      },
      clone: {
        aBrokerComponent: anExchange,
      },
    });
  }

  static async asyncFactoryExchangeSubcriberWithRoutingKeysWithName(
    anExchange: Exchange,
    aName: string,
    routingKeys: string[],
    isDurable: boolean,
    isAutoDeleted: boolean,
    isExclusive: boolean,
  ) {
    const queue: Queue = await new Promise((resolve, reject) => {
      this.factoryExchangeSubcriberWithRoutingKeysWithName(
        anExchange,
        aName,
        routingKeys,
        isDurable,
        isAutoDeleted,
        isExclusive,
        async (queue) => {
          resolve(queue);
        },
        async (error) => {
          reject(error);
        },
      );
    });
    return queue;
  }

  static async bindQueue(
    aQueue: Queue,
    anExchange: Exchange,
    routingKey: string,
    cb: ArbFunction | null = null,
  ) {
    const channel = aQueue.getChannel();
    if (channel) {
      await channel.bindQueue(
        aQueue.getName(),
        anExchange.getName(),
        routingKey,
      );
      cb?.(aQueue);
    }
  }
  async setup(
    params: QueueSetupParam,
    onSetupFinish?: ArbFunction,
  ): Promise<void> {
    const channel = this.getChannel();
    if (channel) {
      const assertQueue = await channel.assertQueue(this.getName(), {
        exclusive: params.exclusive,
        durable: params.durable,
        autoDelete: params.autoDelete,
      });
      // update name, if we use auto-generated name for channel
      // (as passing empty string name to queue constructor)
      this.setName(assertQueue.queue);
      if (onSetupFinish) {
        await onSetupFinish(this);
      }
    }
  }

  setQueueIsReady(aBool: boolean) {
    this.isReady = aBool;
  }

  isQueueReady() {
    return this.isReady;
  }
}
