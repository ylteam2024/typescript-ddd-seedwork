import { FutureArbFnc } from '@type_util/function';
import amqp from 'amqp-connection-manager';
import { IAmqpConnectionManager } from 'amqp-connection-manager/dist/esm/AmqpConnectionManager';
import { Channel, Connection } from 'amqplib';
import { ConnectionSettings } from './ConnectionSetting';

export abstract class BrokerComponent<SetupParam> {
  // My channel
  private channel?: Channel;

  // My connection, which is the connection to my host broker
  private connection: Connection;

  // My connection manager
  private connectionMn: IAmqpConnectionManager;

  // My durable prop, which indicates whether or not messages are durable
  private durable = false;

  private connectionSettings: ConnectionSettings;

  private _isOpen = false;

  private onSetupFinish?: FutureArbFnc;

  private onSetupError?: FutureArbFnc;

  private name: string;

  private setupParams: SetupParam;

  constructor(props: {
    setupParams: SetupParam;
    onSetupFinish?: FutureArbFnc;
    onSetupError?: FutureArbFnc;
    init?: {
      aConnectionSettings: ConnectionSettings;
      aName: string;
    };
    clone?: {
      aBrokerComponent: BrokerComponent<any>;
      aName: string;
    };
  }) {
    this.onSetupFinish = props.onSetupFinish;
    this.onSetupError = props.onSetupError;
    this.setupParams = props.setupParams;
    if (props?.init) {
      const { aConnectionSettings, aName } = props.init;
      this.factoryConnection(aConnectionSettings);
      this.setName(aName);
    } else if (props.clone) {
      const { aBrokerComponent, aName } = props.clone;
      this.setName(aName);
      this.setConnectionSettings(aBrokerComponent.getConnectionSettings());
      this.setConnection(aBrokerComponent.getConnection());
      this.connectionMn = aBrokerComponent.getConnectionMn();
      const currentChannel = aBrokerComponent.getChannel();
      if (currentChannel) {
        this.setChannel(currentChannel);
      }
      this.setup(this.setupParams, this.onSetupFinish);
    } else {
      throw Error('[PARAM_NOT_VALID] Cannot initialize Broker component');
    }
  }

  private handleError(error?: Error) {
    if (error && this.onSetupError) {
      this.onSetupError(error);
    } else if (error) {
      throw error;
    }
  }

  private factoryConnection(
    aConnectionSettings: ConnectionSettings,
  ): Connection {
    const connectionMn = amqp.connect(aConnectionSettings.toUrl());
    this.connectionMn = connectionMn;
    connectionMn.addListener('connect', () =>
      this.onConnectionOpen(connectionMn),
    );
    connectionMn.addListener('connectFailed', (error: Error) => {
      this.handleError(error);
    });
    return connectionMn.connection;
  }

  private onConnectionOpen(connectionMn: IAmqpConnectionManager) {
    console.info('Connection open successfully');
    this.openChannel(connectionMn);
  }

  private openChannel(connectionManager: IAmqpConnectionManager) {
    try {
      const channelWrapper = connectionManager.createChannel({
        setup: this.onChannelOpened.bind(this),
      });
      channelWrapper.on('close', this.onChannelClosed);
      channelWrapper.addListener('error', (error: Error) => {
        this.handleError(error);
      });
    } catch (error) {
      this.handleError(error);
    }
  }

  abstract setup(
    params: SetupParam,
    onSetupFinish: FutureArbFnc,
  ): Promise<void>;

  private async onChannelOpened(channel: Channel) {
    this.setChannel(channel);
    try {
      await this.setup(this.setupParams, this.onSetupFinish);
    } catch (error) {
      this.handleError(error);
    }
  }

  private async onChannelClosed(channel: Channel) {
    /*
    Invoked by pika when RabbitMQ unexpectedly closes the channel.
    Channels are usually closed if you attempt to do something that
    violates the protocol, such as re-declare an exchange or queue with
    different parameters. In this case, we'll close the connection
    to shutdown the object.
    :param amqp.Channel channel: The closed channel
    */
    console.info(`Channel ${channel} was closed`);
    this.channel = null;

    if (this.isOpen) {
      await this.connection.close();
      this.setIsOpen(true);
    }
  }

  setIsOpen(aBoolean: boolean) {
    this._isOpen = aBoolean;
  }

  isOpen() {
    return this._isOpen;
  }

  setChannel(aChannel: Channel) {
    this.channel = aChannel;
  }

  getChannel(): Channel | null {
    return this.channel;
  }

  setConnectionSettings(aConnectionSettings: ConnectionSettings) {
    this.connectionSettings = aConnectionSettings;
  }

  getConnectionSettings(): ConnectionSettings {
    return this.connectionSettings;
  }

  getConnection(): Connection {
    return this.connection;
  }

  setConnection(connection: Connection) {
    this.connection = connection;
  }

  getConnectionMn(): IAmqpConnectionManager {
    return this.connectionMn;
  }

  isDurable() {
    return this.durable;
  }
  getName() {
    return this.name;
  }
  exchangeName() {
    return this.isExchange() ? this.name : null;
  }

  queueName() {
    return this.isQueue() ? this.name : null;
  }

  isQueue() {
    return false;
  }

  isExchange() {
    return false;
  }

  public setIsDurable(aBool: boolean) {
    this.durable = aBool;
  }

  public setName(aName: string) {
    this.name = aName;
  }

  private async closeChannel() {
    await this.channel?.close();
  }

  private async closeConnection() {
    await this.connectionMn.close();
  }

  public async close() {
    this.setIsOpen(false);
    await this.closeChannel();
    await this.closeConnection();
  }
}
