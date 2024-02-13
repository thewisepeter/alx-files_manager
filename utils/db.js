import { MongoClient } from 'mongodb';

const DB_HOST = process.env.DB_HOST || 'localhost';
const DB_PORT = process.env.DB_PORT || 27017;
const DB_DATABASE = process.env.DB_DATABASE || 'files_manager';
const url = `mongodb://${DB_HOST}:${DB_PORT}`;

class DBClient {
  constructor() {
    MongoClient.connect(url, { useUnifiedTopology: true }, (err, client) => {
      if (!err) {
        this.db = client.db(DB_DATABASE);
        this.users = this.db.collection('users');
        this.files = this.db.collection('files');
      } else {
        console.log(err.message);
        this.db = false;
      }
    });
  }

  isAlive() { return !!this.db; }

  async nbUsers() { return this.users.countDocuments(); }

  async nbFiles() { return this.files.countDocuments(); }

  async getUser(query) {
    const user = await this.db.collection('users').findOne(query);
    return user;
  }
}

const dbClient = new DBClient();
module.exports = dbClient;

// const { MongoClient } = require('mongodb');
// // const mongo = require('mongodb');
// // const { pwdHashed } = require('./utilities');

// class DBClient {
//   constructor() {
//     const host = process.env.DB_HOST || 'localhost';
//     const port = process.env.DB_PORT || 27017;
//     const database = process.env.DB_DATABASE || 'files_manager';

//     const uri = `mongodb://${host}:${port}/${database}`;

//     this.client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

//     this.client.connect((err) => {
//       if (err) console.error('MongoDB connection error:', err);
//       console.log('Connected to MongoDB');
//     });
//   }

//   isAlive() {
//     return this.client.isConnected();
//   }

//   async nbUsers() {
//     const db = this.client.db();
//     const users = db.collection('users');
//     const count = await users.countDocuments();
//     return count;
//   }

//   async nbFiles() {
//     const db = this.client.db();
//     const filesCollection = db.collection('files');
//     const count = await filesCollection.countDocuments();
//     return count;
//   }

//   async get() {
//     await this.client.connect();
//     return this.client.db();
//   }

//   // async createUser(email, password) {
//   //   const hashedPwd = pwdHashed(password);
//   //   await this.client.connect();
//   //   const user = await this.client.db(this.database).collection('users').
//   // insertOne({ email, password: hashedPwd });
//   //   return user;
//   // }

//   // async getUser(email) {
//   //   await this.client.connect();
//   //   const user = await this.client.db(this.database).collection('users').
//   // find({ email }).toArray();
//   //   if (!user.length) {
//   //     return null;
//   //   }
//   //   return user[0];
//   // }

//   // async getUserById(id) {
//   //   const _id = new mongo.ObjectID(id);
//   //   await this.client.connect();
//   //   const user = await this.client.db(this.database).collection('users').
// find({ _id }).toArray();
//   //   if (!user.length) {
//   //     return null;
//   //   }
//   //   return user[0];
//   // }

//   // async userExist(email) {
//   //   const user = await this.getUser(email);
//   //   if (user) {
//   //     return true;
//   //   }
//   //   return false;
//   // }
// }

// const dbClient = new DBClient();
// module.exports = dbClient;
