import redisClient from '../utils/redis';
import dbClient from '../utils/db';

async function getStatus(req, res) {
  const redisAlive = await redisClient.isAlive();
  const dbAlive = await dbClient.isAlive();

  res.json({ redis: redisAlive, db: dbAlive });
}

async function getStats(req, res) {
  const usersCount = await dbClient.nbUsers();
  const filesCount = await dbClient.nbFiles();

  res.json({ users: usersCount, files: filesCount });
}

export { getStatus, getStats };

