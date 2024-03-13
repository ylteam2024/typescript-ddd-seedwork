import { FutureArbFnc } from '@type_util/function';
import { Replies } from 'amqplib';
import { BrokerComponent } from './broker-component';
import { ConnectionSettings } from './connection-setting';

export enum ExchangeType {
  DIRECT = 'direct',
  TOPIC = 'topic',
  HEADERS = 'headers',
  FANOUT = 'fanout',
  MATCH = 'match',
}

type ExchangeSetupParam = {
  durable: boolean;
  autoDelete: boolean;
};

export class Exchange extends BrokerComponent<ExchangeSetupParam> {
  private _isExchangeReady: boolean;
  private _type: ExchangeType;
  private _isAutoDelete: boolean;
  private _rawExchange: Replies.AssertExchange;

  constructor(
    aConnSettings: ConnectionSettings,
    aName: string,
    aType: ExchangeType,
    isDurable: boolean,
    isAutoDelete = false,
    onSetupFinish?: FutureArbFnc,
    onSetupError?: FutureArbFnc,
  ) {
    super({
      init: { aConnectionSettings: aConnSettings, aName },
      onSetupError,
      onSetupFinish,
      setupParams: { durable: isDurable, autoDelete: isAutoDelete },
    });
    this.setIsDurable(isDurable);
    this.setExchangeType(aType);
    this._isAutoDelete = isAutoDelete;
  }

  static factory(
    aConnSettings: ConnectionSettings,
    aName: string,
    aType: ExchangeType,
    isDurable: boolean,
    isAutoDelete = false,
    onSetupFinish?: FutureArbFnc,
    onSetupError?: FutureArbFnc,
  ) {
    return new Exchange(
      aConnSettings,
      aName,
      aType,
      isDurable,
      isAutoDelete,
      onSetupFinish,
      onSetupError,
    );
  }

  static directInstance(
    aConnSettings: ConnectionSettings,
    aName: string,
    isDurable: boolean,
    isAutoDelete?: boolean,
    onSetupFinish?: FutureArbFnc,
    onSetupError?: FutureArbFnc,
  ) {
    return new Exchange(
      aConnSettings,
      aName,
      ExchangeType.DIRECT,
      isDurable,
      isAutoDelete,
      onSetupFinish,
      onSetupError,
    );
  }

  static async asyncDirectInstance(
    aConnSettings: ConnectionSettings,
    aName: string,
    isDurable: boolean,
    isAutoDelete?: boolean,
  ) {
    const exchange: Exchange = await new Promise((resolve, reject) => {
      Exchange.directInstance(
        aConnSettings,
        aName,
        isDurable,
        isAutoDelete,
        async (exchange) => {
          resolve(exchange);
        },
        async (error) => {
          reject(error);
        },
      );
    });
    return exchange;
  }

  static fanoutInstance(
    aConnSettings: ConnectionSettings,
    aName: string,
    isDurable: boolean,
    isAutoDelete?: boolean,
    onSetupFinish?: FutureArbFnc,
    onSetupError?: FutureArbFnc,
  ) {
    return new Exchange(
      aConnSettings,
      aName,
      ExchangeType.FANOUT,
      isDurable,
      isAutoDelete,
      onSetupFinish,
      onSetupError,
    );
  }

  static headerInstance(
    aConnSettings: ConnectionSettings,
    aName: string,
    isDurable: boolean,
    isAutoDelete?: boolean,
    onSetupFinish?: FutureArbFnc,
    onSetupError?: FutureArbFnc,
  ) {
    return new Exchange(
      aConnSettings,
      aName,
      ExchangeType.HEADERS,
      isDurable,
      isAutoDelete,
      onSetupFinish,
      onSetupError,
    );
  }

  async setup(
    setupParams: ExchangeSetupParam,
    onSetupFinish: FutureArbFnc,
  ): Promise<void> {
    console.info(`[EXCHANGE] setup exchange ${this.getName()} start`);
    if (!this.getChannel()) {
      throw new Error('cannot do setupping, channel is not ready');
    }
    this._rawExchange = await this.getChannel().assertExchange(
      this.getName(),
      this.exchangeType(),
      {
        durable: setupParams.durable,
        autoDelete: setupParams.autoDelete,
      },
    );

    console.info(`[EXCHANGE] declare exchange ${this.getName()} successfully`);
    this.setExchangeReadyStatus(true);
    if (onSetupFinish) {
      await onSetupFinish(this);
    }
  }

  isExchange() {
    return true;
  }

  isAutoDelete() {
    return this._isAutoDelete;
  }

  isExchangeReady() {
    return this._isExchangeReady;
  }

  setExchangeReadyStatus(aBool: boolean) {
    this._isExchangeReady = aBool;
  }

  exchangeType(): ExchangeType {
    return this._type;
  }

  rawExchange(): Replies.AssertExchange {
    return this._rawExchange;
  }

  setExchangeType(anExchangeType: ExchangeType) {
    this._type = anExchangeType;
  }
}
