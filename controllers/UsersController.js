const sha1 = require('sha1');
const dbClient = require('../utils/db');

class UsersController {
  async postNew(req, res) {
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
}

module.exports = new UsersController();
