const { MongoClient } = require('mongodb');
// const mongo = require('mongodb');
// const { pwdHashed } = require('./utilities');

class DBClient {
  constructor() {
    const host = process.env.DB_HOST || 'localhost';
    const port = process.env.DB_PORT || 27017;
    const database = process.env.DB_DATABASE || 'files_manager';

    const uri = `mongodb://${host}:${port}/${database}`;

    this.client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

    this.client.connect((err) => {
      if (err) console.error('MongoDB connection error:', err);
      console.log('Connected to MongoDB');
    });
  }

  isAlive() {
    return this.client.isConnected();
  }

  async nbUsers() {
    const db = this.client.db();
    const users = db.collection('users');
    const count = await users.countDocuments();
    return count;
  }

  async nbFiles() {
    const db = this.client.db();
    const filesCollection = db.collection('files');
    const count = await filesCollection.countDocuments();
    return count;
  }

  async get() {
    await this.client.connect();
    return this.client.db();
  }

  // async createUser(email, password) {
  //   const hashedPwd = pwdHashed(password);
  //   await this.client.connect();
  //   const user = await this.client.db(this.database).collection('users').
  // insertOne({ email, password: hashedPwd });
  //   return user;
  // }

  // async getUser(email) {
  //   await this.client.connect();
  //   const user = await this.client.db(this.database).collection('users').
  // find({ email }).toArray();
  //   if (!user.length) {
  //     return null;
  //   }
  //   return user[0];
  // }

  // async getUserById(id) {
  //   const _id = new mongo.ObjectID(id);
  //   await this.client.connect();
  //   const user = await this.client.db(this.database).collection('users').find({ _id }).toArray();
  //   if (!user.length) {
  //     return null;
  //   }
  //   return user[0];
  // }

  // async userExist(email) {
  //   const user = await this.getUser(email);
  //   if (user) {
  //     return true;
  //   }
  //   return false;
  // }
}

const dbClient = new DBClient();
module.exports = dbClient;
