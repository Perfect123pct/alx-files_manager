import dbClient from '../utils/db';
import fs from 'fs';
import path from 'path';

async function postUpload(req, res) {
  const { name, type, parentId, isPublic, data } = req.body;
  const token = req.headers['x-token'];

  if (!token) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const userId = await redisClient.get(`auth_${token}`);

  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (!name) {
    return res.status(400).json({ error: 'Missing name' });
  }

  if (!type || !['file', 'folder', 'image'].includes(type)) {
    return res.status(400).json({ error: 'Missing type' });
  }

  if (type !== 'folder' && !data) {
    return res.status(400).json({ error: 'Missing data' });
  }

  if (parentId) {
    const parentFile = await dbClient.collection('files').findOne({ _id: parentId });

    if (!parentFile) {
      return res.status(400).json({ error: 'Parent not found' });
    }

    if (parentFile.type !== 'folder') {
      return res.status(400).json({ error: 'Parent is not a folder' });
    }
  }

  const file = {
    userId,
    name,
    type,
    isPublic: isPublic || false,
    parentId: parentId || 0,
  };

  if (type !== 'folder') {
    const folderPath = process.env.FOLDER_PATH || '/tmp/files_manager';
    const localPath = path.join(folderPath, uuidv4());

    fs.writeFileSync(localPath, data, 'base64');

    file.localPath = localPath;
  }

  const result = await dbClient.collection('files').insertOne(file);

  res.status(201).json({ id: result.insertedId, ...file });
}

export { postUpload };

async function getShow(req, res) {
  const { id } = req.params;
  const token = req.headers['x-token'];

  if (!token) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const userId = await redisClient.get(`auth_${token}`);

  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const file = await dbClient.collection('files').findOne({ _id: id, userId });

  if (!file) {
    return res.status(404).json({ error: 'Not found' });
  }

  res.json(file);
}

async function getIndex(req, res) {
  const { parentId, page } = req.query;
  const token = req.headers['x-token'];

  if (!token) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const userId = await redisClient.get(`auth_${token}`);

  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const files = await dbClient.collection('files').aggregate([
    {
      $match: {
        userId,
        parentId: parentId || 0,
      },
    },
    {
      $skip: page * 20,
    },
    {
      $limit: 20,
    },
  ]);

  res.json(await files.toArray());
}

async function putPublish(req, res) {
  const { id } = req.params;
  const token = req.headers['x-token'];

  if (!token) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const userId = await redisClient.get(`auth_${token}`);

  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const file = await dbClient.collection('files').findOneAndUpdate(
    { _id: id, userId },
    { $set: { isPublic: true } }
  );

  if (!file) {
    return res.status(404).json({ error: 'Not found' });
  }

  res.json(file);
}

async function putUnpublish(req, res) {
  const { id } = req.params;
  const token = req.headers['x-token'];

  if (!token) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const userId = await redisClient.get(`auth_${token}`);

  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const file = await dbClient.collection('files').findOneAndUpdate(
    { _id: id, userId },
    { $set: { isPublic: false } }
  );

  if (!file) {
    return res.status(404).json({ error: 'Not found' });
  }

  res.json(file);
}

async function getFile(req, res) {
  const { id } = req.params;
  const token = req.headers['x-token'];

  if (!token) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const userId = await redisClient.get(`auth_${token}`);

  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const file = await dbClient.collection('files').findOne({ _id: id, userId });

  if (!file) {
    return res.status(404).json({ error: 'Not found' });
  }

  if (file.type === 'folder') {
    return res.status(400).json({ error: 'A folder doesn\'t have content' });
  }

  const localPath = file.localPath;

  if (!localPath) {
    return res.status(404).json({ error: 'Not found' });
  }

  const mimeType = mime.getType(file.name);

  res.set('Content-Type', mimeType);
  res.sendFile(localPath);
}

const fileQueue = new Bull('fileQueue');

async function postFiles(req, res) {
  // ...

  const file = new File(req.body);
  const userId = req.headers['x-token'];

  file.userId = userId;
  file.save();

  fileQueue.add({ userId, fileId: file._id });

  res.json(file);
}

async function getFile(req, res) {
  const { id } = req.params;
  const { size } = req.query;
  const token = req.headers['x-token'];

  if (!token) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const userId = await redisClient.get(`auth_${token}`);

  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const file = await dbClient.collection('files').findOne({ _id: id, userId });

  if (!file) {
    return res.status(404).json({ error: 'Not found' });
  }

  if (file.type === 'folder') {
    return res.status(400).json({ error: 'A folder doesn\'t have content' });
  }

  const localPath = file.localPath;

  if (!localPath) {
    return res.status(404).json({ error: 'Not found' });
  }

  if (size) {
    const sizes = [500, 250, 100];
    if (sizes.includes(Number(size))) {
      localPath += `_${size}`;
    } else {
      return res.status(404).json({ error: 'Not found' });
    }
  }

  const mimeType = mime.getType(file.name);

  res.set('Content-Type', mimeType);
  res.sendFile(localPath);
}

const userQueue = new Bull('userQueue');

async function postUsers(req, res) {
  // ...

  const userId = new User(req.body).save();

  userQueue.add(userId);
  res.json({ id: userId });
}

