const redis = require('./redisV4mock').default
jest.mock('redis', () => redis)
