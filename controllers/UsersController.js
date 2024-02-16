const sha1 = require('sha1');
const { ObjectId } = require('mongodb');
const DBClient = require('../utils/db');
const redisClient = require('../utils/redis');

class UsersController {
  static async postNew(req, res) {
    // Extract email and password from request body
    const email = req.body ? req.body.email : null;
    const password = req.body ? req.body.password : null;

    // Check if email is missing
    if (!email) {
      return res.status(400).json({ error: 'Missing email' });
    }

    // Check if password is missing
    if (!password) {
      return res.status(400).json({ error: 'Missing password' });
    }

    try {
      // Initialize the DB client
      const db = await DBClient.get();

      // Check if email already exists in DB
      const existingUser = await db.collection('users').findOne({ email });
      if (existingUser) {
        return res.status(400).json({ error: 'Already exist' });
      }

      // Hash the password using SHA1
      const hashedPassword = sha1(password);

      // Create a new user object
      const newUser = {
        email,
        password: hashedPassword, // Store hashed password
      };

      // Save the new user to the database
      const result = await db.collection('users').insertOne(newUser);
      const userId = result.insertedId.toString();

      // Return the new user with only email and id
      return res.status(201).json({ email: newUser.email, id: userId });
    } catch (error) {
      // Handle any errors
      console.error('Error creating user:', error);
      return res.status(400).json({ error: 'Couldnt create user' });
    }
  }

  static async getMe(req, res) {
    try {
      // Extract token from Authorization header
      const token = req.headers.authorization;

      // Check if token is missing
      if (!token) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      // Retrieve user ID from Redis using token
      const userId = await redisClient.get(`auth_${token}`);
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      // Initialize the DB client
      const db = await DBClient.get();

      // Find user by ID
      const user = await db.collection('users').findOne({ _id: ObjectId(userId) });
      if (!user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      // Return the user object with only email and id
      return res.status(200).json({ id: user._id, email: user.email });
    } catch (error) {
      // Handle any errors
      console.error('Error retrieving user:', error);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }
}

module.exports = UsersController;
