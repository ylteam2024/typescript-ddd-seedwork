import { RedisKeyValueRepository } from '@ports/database/keyvalue/implement/redis/RedisKeyValueRepository';

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
    let spyonErrorHandler: jest.SpyInstance;
    await new Promise((resolve, reject) => {
      const errorHandler = (errorMsg: string) => {
        resolve(null);
      };
      redisKeyValueRepository.registerErrorHandler(errorHandler);
      spyonErrorHandler = jest.spyOn(redisKeyValueRepository, 'onError');
      redisKeyValueRepository.emitOnClient('error', 'Test error');
    });
    expect(spyonErrorHandler).toBeCalledWith('Test error');
  });
});
