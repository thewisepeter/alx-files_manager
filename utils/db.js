const { MongoClient } = require('mongodb');

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
}

const dbClient = new DBClient();
module.exports = dbClient;
