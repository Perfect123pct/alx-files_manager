import dbClient from '../utils/db';
import redisClient from '../utils/redis';

async function getConnect(req, res) {
  const { email, password } = req.headers.authorization.split(' ')[1].split(':');

  const user = await dbClient.collection('users').findOne({ email, password: crypto.createHash('sha1').update(password).digest('hex') });

  if (!user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const token = uuidv4();
  await redisClient.set(`auth_${token}`, user._id, 'EX', 24 * 60 * 60);

  res.json({ token });
}

async function getDisconnect(req, res) {
  const token = req.headers['x-token'];

  if (!token) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  await redisClient.del(`auth_${token}`);

  res.status(204).send();
}

async function getMe(req, res) {
  const token = req.headers['x-token'];

  if (!token) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const userId = await redisClient.get(`auth_${token}`);

  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const user = await dbClient.collection('users').findOne({ _id: userId });

  res.json({ id: user._id, email: user.email });
}

export { getConnect, getDisconnect, getMe };

