/* eslint-disable @typescript-eslint/explicit-function-return-type */
// redis-mock has not been updated for node-redis v4 yet, but the main changes
// in the API are camelCase names and promises instead of callback, so we can work around it.
// https://github.com/yeahoffline/redis-mock/issues/195
const redis = require("redis-mock");
// @ts-expect-error Work-around redis-mock types reporting incorrectly as v4 redis.
const { promisify } = require("util");
const client = redis.createClient();
const setEx = promisify(client.setex).bind(client);
const v4Client = {
  eventSubscribes: {
    "error": []
  },
  connect: () => undefined,
  get: promisify(client.get).bind(client),
  set: (key, value) => promisify(client.set).bind(client)(key, value),
  del: promisify(client.del).bind(client),
  hSet: promisify(client.hset).bind(client),
  hGet: promisify(client.hget).bind(client),
  hDel: promisify(client.hdel).bind(client),
  flushAll: promisify(client.flushall).bind(client),
  setEx: promisify(client.setex).bind(client),
  expire: promisify(client.expire).bind(client),
  mGet: promisify(client.mget).bind(client),
  pSetEx: (key, ms, value) => setEx(key, ms / 1000, value),
  on: (event, cb) => {
    if (!v4Client.eventSubscribes[event]) {
      v4Client.eventSubscribes[event] = []
    }
    v4Client.eventSubscribes[event] = [...v4Client.eventSubscribes[event], cb]
  },
  emit: (eventName, ...args) => {
    const subscribers = v4Client.eventSubscribes[eventName]
    if (subscribers) {
      subscribers.forEach(cb => cb(...args))
    }
  }
  // Add additional functions as needed...
};
exports.default = { ...redis, createClient: () => v4Client };
