const fs = require('fs');
const path = require('path');
const { ObjectId } = require('mongodb');
const uuid = require('uuid');
const DBClient = require('../utils/db');
const redisClient = require('../utils/redis');

class FilesController {
  static async postUpload(req, res) {
    try {
      // Extract token from Authorization header
      const token = req.headers['x-token'];

      // Check if token is missing
      if (!token) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      // Retrieve user ID from Redis using token
      const userId = await redisClient.get(`auth_${token}`);
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      // Retrieve user from DB using user ID
      const db = await DBClient.get();
      const user = await db.collection('users').findOne({ _id: ObjectId(userId) });
      if (!user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      // Extract file data from request body
      const {
        name, type, parentId = '0', isPublic = false, data,
      } = req.body;

      // Check if name is missing
      if (!name) {
        return res.status(400).json({ error: 'Missing name' });
      }

      // Check if type is missing or not accepted
      if (!type || !['folder', 'file', 'image'].includes(type)) {
        return res.status(400).json({ error: 'Missing type' });
      }

      // Check if data is missing for non-folder types
      if (type !== 'folder' && !data) {
        return res.status(400).json({ error: 'Missing data' });
      }

      // Check if parentId is set
      if (parentId !== '0') {
        // Find parent file in DB
        const parentFile = await db.collection('files').findOne({ _id: ObjectId(parentId) });
        if (!parentFile) {
          return res.status(400).json({ error: 'Parent not found' });
        }

        // Check if parent file is a folder
        if (parentFile.type !== 'folder') {
          return res.status(400).json({ error: 'Parent is not a folder' });
        }
      }

      // Initialize file document
      const fileDoc = {
        userId: ObjectId(userId),
        name,
        type,
        isPublic,
        parentId: ObjectId(parentId),
      };

      // Handle file data
      if (type !== 'folder') {
        // Create folder path
        const folderPath = process.env.FOLDER_PATH || '/tmp/files_manager';
        if (!fs.existsSync(folderPath)) {
          fs.mkdirSync(folderPath, { recursive: true });
        }

        // Generate unique filename
        const filename = uuid.v4();
        const filePath = path.join(folderPath, filename);

        // Decode Base64 data and write to file
        const fileBuffer = Buffer.from(data, 'base64');
        fs.writeFileSync(filePath, fileBuffer);

        // Update file document with local path
        fileDoc.localPath = filePath;
      }

      // Insert file document into DB
      const result = await db.collection('files').insertOne(fileDoc);

      // Return the new file with status code 201
      return res.status(201).json({ id: result.insertedId, ...fileDoc });
    } catch (error) {
      console.error('Error creating file:', error);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }

  static async getShow(req, res) {
    // Retrieve the user based on the token
    const { user } = req;

    // If user is not found, return Unauthorized
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Retrieve the file document based on the ID
    const fileId = req.params.id;
    const file = await DBClient.get('files', { _id: fileId, userId: user.id });

    // If no file document is found, return Not found
    if (!file) {
      return res.status(404).json({ error: 'Not found' });
    }

    // Return the file document
    return res.json(file);
  }

  static async getIndex(req, res) {
    // Retrieve the user based on the token
    const { user } = req;

    // If user is not found, return Unauthorized
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Retrieve parentId and page from query parameters
    const parentId = parseInt(req.query.parentId, 10) || 0;
    const page = parseInt(req.query.page, 10) || 0;
    const limit = 20;
    const skip = page * limit;

    // Retrieve the list of file documents based on parentId and pagination
    const files = await DBClient.get('files', { parentId, userId: user.id }, { limit, skip });

    // Return the list of file documents
    return res.json(files);
  }

  static async putPublish(req, res) {
    // Extract file ID from request parameters
    const { id } = req.params;

    // Retrieve user based on token
    const { user } = req;

    // Check if user is not found
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
      // Initialize DB client
      const db = await DBClient.get();

      // Find file document by ID
      const file = await db.collection('files').findOne({ _id: ObjectId(id), userId: user._id });

      // Check if file document is not found
      if (!file) {
        return res.status(404).json({ error: 'Not found' });
      }

      // Update isPublic field to true
      await db.collection('files').updateOne({ _id: ObjectId(id) }, { $set: { isPublic: true } });

      // Return updated file document
      return res.status(200).json(file);
    } catch (error) {
      console.error('Error publishing file:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  static async putUnpublish(req, res) {
    // Extract file ID from request parameters
    const { id } = req.params;

    // Retrieve user based on token
    const { user } = req;

    // Check if user is not found
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
      // Initialize DB client
      const db = await DBClient.get();

      // Find file document by ID
      const file = await db.collection('files').findOne({ _id: ObjectId(id), userId: user._id });

      // Check if file document is not found
      if (!file) {
        return res.status(404).json({ error: 'Not found' });
      }

      // Update isPublic field to false
      await db.collection('files').updateOne({ _id: ObjectId(id) }, { $set: { isPublic: false } });

      // Return updated file document
      return res.status(200).json(file);
    } catch (error) {
      console.error('Error unpublishing file:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }
}

module.exports = FilesController;
