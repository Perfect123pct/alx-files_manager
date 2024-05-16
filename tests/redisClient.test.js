const redisClient = require('../utils/redisClient');

describe('redisClient', () => {
  it('should set and get a value', async () => {
    const key = 'test_key';
    const value = 'test_value';

    await redisClient.set(key, value);
    const storedValue = await redisClient.get(key);

    expect(storedValue).toBe(value);
  });
});

