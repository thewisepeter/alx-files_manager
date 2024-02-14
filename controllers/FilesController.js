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
}

module.exports = FilesController;
