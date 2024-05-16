import dbClient from '../utils/db';

async function postNew(req, res) {
  const { email, password } = req.body;

  if (!email) {
    return res.status(400).json({ error: 'Missing email' });
  }

  if (!password) {
    return res.status(400).json({ error: 'Missing password' });
  }

  const existingUser = await dbClient.collection('users').findOne({ email });

  if (existingUser) {
    return res.status(400).json({ error: 'Already exist' });
  }

  const hashedPassword = crypto.createHash('sha1').update(password).digest('hex');
  const user = { email, password: hashedPassword };

  const result = await dbClient.collection('users').insertOne(user);

  res.status(201).json({ id: result.insertedId, email });
}

export { postNew };

