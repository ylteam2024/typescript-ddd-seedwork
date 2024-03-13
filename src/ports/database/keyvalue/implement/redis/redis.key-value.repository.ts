import {
  getConsoleDomainLogger,
  ConsoleDomainLogger,
} from '@ports/domain-logger';
import { ArbFunction } from '@type_util/function';
import * as redis from 'redis';
import { AbstractKeyValueRepository } from '../../key-value.repository';

type RedisClient = ReturnType<typeof redis.createClient>;
export class RedisKeyValueRepository extends AbstractKeyValueRepository {
  private redisClient: RedisClient;
  onError?: ArbFunction;
  logger: ConsoleDomainLogger;

  constructor(redisClient: RedisClient, prefix?: string) {
    super(prefix);
    this.logger = getConsoleDomainLogger('test_redis');
    this.redisClient = redisClient;
  }

  static async factory(
    host: string,
    port: number,
    username: string,
    password: string,
    prefix?: string,
    onError?: ArbFunction,
  ) {
    const redisClient = redis.createClient({
      url: `redis://${username}:${password}@${host}:${port}`,
    });
    await redisClient.connect();
    const instance = new RedisKeyValueRepository(redisClient, prefix);
    instance.onError = onError;
    redisClient.on('error', instance.handleOnError.bind(instance));
    return instance;
  }

  private handleOnError(error: Error) {
    this.onError?.(error);
    this.logger.error('Error occurred ', error);
  }

  registerErrorHandler(handler: ArbFunction) {
    this.onError = handler;
  }

  private finalizeKey(key: string) {
    return this.keyWithPrefix(key);
  }

  public async set(
    key: string,
    value: string | number,
    expiredSeconds?: number,
  ): Promise<void> {
    try {
      await this.redisClient.set(this.finalizeKey(key), value, {
        EX: expiredSeconds,
      });
    } catch (error) {
      this.handleOnError(
        new Error(error + ` on setting key ${key} and value ${value}`),
      );
      throw error;
    }
  }
  public async get(key: string): Promise<string | number | null> {
    try {
      return await this.redisClient.get(this.finalizeKey(key));
    } catch (error) {
      this.handleOnError(new Error(error + ` on getting key ${key}`));
      throw error;
    }
  }

  emitOnClient(event: string, ...args: any[]) {
    this.redisClient.emit(event, ...args);
  }
}
