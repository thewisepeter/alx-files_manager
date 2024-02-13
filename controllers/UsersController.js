const sha1 = require('sha1');
const DBClient = require('../utils/db');

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

      // Return the new user with only email and id
      return res.status(201).json({ id: result.insertedId, email: newUser.email });
    } catch (error) {
      // Handle any errors
      console.error('Error creating user:', error);
      return res.status(400).json({ error: 'Couldnt create user' });
    }
  }
}

module.exports = UsersController;
