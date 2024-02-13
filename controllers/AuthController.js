const sha1 = require('sha1');
const { v4: uuidv4 } = require('uuid');
const redisClient = require('../utils/redis');
const dbClient = require('../utils/db');

class AuthController {
  static async getConnect(req, res) {
    // Extract email and password from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Basic ')) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const authEncoded = authHeader.split(' ')[1];
    const [email, password] = Buffer.from(authEncoded, 'base64').toString().split(':');

    // Find user in the database
    const usersCollection = dbClient.client.db().collection('users');
    const user = await usersCollection.findOne({ email, password: sha1(password) });
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Generate authentication token
    const accessToken = uuidv4();

    // Store user ID in Redis with token as key for 24 hours
    await redisClient.set(`auth_${accessToken}`, user._id.toString(), 86400);

    // Return token
    return res.status(200).json({ token: accessToken });
  }

  static async getDisconnect(req, res) {
    // Retrieve the token from the request headers
    const token = req.headers.authorization;

    // If token is missing, return 401 Unauthorized
    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
      // Delete the token from Redis
      await redisClient.del(token);

      // Return 204 No Content if successful
      return res.status(204).send();
    } catch (error) {
      console.error('Error disconnecting user:', error);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }
}

module.exports = AuthController;
