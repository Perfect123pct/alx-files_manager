const fileQueue = new Bull('fileQueue');
const thumbnail = require('image-thumbnail');

fileQueue.process(async (job) => {
  const { userId, fileId } = job.data;

  if (!fileId) {
    throw new Error('Missing fileId');
  }

  if (!userId) {
    throw new Error('Missing userId');
  }

  const file = await dbClient.collection('files').findOne({ _id: fileId, userId });

  if (!file) {
    throw new Error('File not found');
  }

  if (file.type !== 'image') {
    return;
  }

  const widths = [500, 250, 100];
  const filePath = file.localPath;

  for (const width of widths) {
    const thumbnailPath = `${filePath}_${width}`;
    await thumbnail({ source: filePath, destination: thumbnailPath, width });
  }
});

const userQueue = new Bull('userQueue');

userQueue.process(async (job) => {
  const userId = job.data;

  if (!userId) {
    throw new Error('Missing userId');
  }

  const user = await dbClient.collection('users').findOne({ _id: userId });

  if (!user) {
    throw new Error('User not found');
  }

  console.log(`Welcome ${user.email}!`);
});

