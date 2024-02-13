const sha1 = require('sha1');
const dbClient = require('../utils/db');

class UsersController {
  static async postNew(req, res) {
    // Extract email and password from request body
    const { email, password } = req.body;

    // Check if email is missing
    if (!email) {
      return res.status(400).json({ error: 'Missing email' });
    }

    // Check if password is missing
    if (!password) {
      return res.status(400).json({ error: 'Missing password' });
    }

    // Check if email already exists in DB
    const usersCollection = dbClient.client.db().collection('users');
    const existingUser = await usersCollection.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'Already exist' });
    }

    // Hash the password using SHA1
    const hashedPassword = sha1(password);

    // Create a new user object
    const newUser = {
      email,
      password: hashedPassword,
    };

    // Insert the new user into the database
    const result = await usersCollection.insertOne(newUser);

    // Extract the id from the inserted document
    const { _id } = result.ops[0];

    // Return the new user with only email and id
    return res.status(201).json({ email, id: _id });
  }

  static async getMe(req, res) {
    // Retrieve the token from the request headers
    const token = req.headers.authorization;

    // If token is missing, return 401 Unauthorized
    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
      // Retrieve the user ID from Redis
      const userId = await redisClient.get(`auth_${token}`);

      // If user ID not found, return 401 Unauthorized
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      // Retrieve user details from MongoDB based on user ID
      const usersCollection = dbClient.client.db().collection('users');
      const user = await usersCollection.findOne({ _id: ObjectId(userId) });

      // If user not found, return 401 Unauthorized
      if (!user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      // Return user object with email and id only
      return res.status(200).json({ email: user.email, id: user._id });
    } catch (error) {
      console.error('Error retrieving user:', error);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }
}

module.exports = UsersController;
