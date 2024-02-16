import { promisify } from 'util';
import { createClient } from 'redis';

/**
 * Represents a Redis client.
 */
class RedisClient {
  /**
   * Creates a new RedisClient instance.
   */
  constructor() {
    this.client = createClient();
    this.isClientConnected = true;
    this.client.on('error', (err) => {
      console.error('Redis client failed to connect:', err.message || err.toString());
      this.isClientConnected = false;
    });
    this.client.on('connect', () => {
      this.isClientConnected = true;
    });
  }

  /**
   * Checks if this client's connection
   * is active.
   * @returns {boolean}
   */
  isAlive() {
    return this.isClientConnected;
  }

  /**
   * Retrieves the value associated with a specified key
   * from the Redis database.
   * @param {String} key - The key of the item to retrieve.
   * @returns {String | Object} - The value associated with
   * the specified key.
   */
  async get(key) {
    // Use promisify to convert the callback-based GET method
    // of the Redis client into a Promise-based function,
    // then bind it to the client and call it with the specified
    // key to fetch the value.
    return promisify(this.client.GET).bind(this.client)(key);
  }

  /**
   * Stores a key-value pair in the Redis database with an optional expiration time.
   * @param {String} key - The key of the item to store.
   * @param {String | Number | Boolean} value - The value to store.
   * @param {Number} duration - The expiration time of the item in seconds.
   * @returns {Promise<void>} - A Promise indicating the success of the operation.
   */
  async set(key, value, duration) {
    // Use promisify to convert the callback-based SETEX method of the Redis client
    // into a Promise-based function,
    // then bind it to the client and call it with the specified key, duration, and
    // value to store the item.
    await promisify(this.client.SETEX)
      .bind(this.client)(key, duration, value);
  }

  /**
   * Deletes value of a given key.
   * @param {String} key The key of the item to remove.
   * @returns {Promise<void>}
   */
  async del(key) {
    await promisify(this.client.DEL).bind(this.client)(key);
  }
}

export const redisClient = new RedisClient();
export default redisClient;
