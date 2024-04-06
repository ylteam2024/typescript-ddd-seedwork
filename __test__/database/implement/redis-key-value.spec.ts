import { RedisKeyValueRepository } from '../../../src/ports/database/keyvalue/implement/redis/redis.key-value.repository';

describe('test redis port', () => {
  let redisKeyValueRepository: RedisKeyValueRepository;
  beforeAll(async () => {
    redisKeyValueRepository = await RedisKeyValueRepository.factory(
      'localhost',
      6370,
      'tuan',
      'tuan',
      'abc',
    );
  });
  it('test get set', async () => {
    const testKey = 'tuan';
    const testValue = 'hoi';
    await redisKeyValueRepository.set(testKey, testValue);
    const persistedValue = await redisKeyValueRepository.get(testKey);
    expect(persistedValue).toBe(testValue);
  });

  it('test error handler', async () => {
    const spyonErrorHandler: jest.SpyInstance = jest.spyOn(
      redisKeyValueRepository,
      'onError',
    );
    await new Promise((resolve) => {
      const errorHandler = (/*errorMsg: string*/) => {
        resolve(null);
      };
      redisKeyValueRepository.registerErrorHandler(errorHandler);
      redisKeyValueRepository.emitOnClient('error', 'Test error');
    });
    expect(spyonErrorHandler).toBeCalledWith('Test error');
  });
});
