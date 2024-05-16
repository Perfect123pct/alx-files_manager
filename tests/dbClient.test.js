const dbClient = require('../utils/dbClient');

describe('dbClient', () => {
  it('should insert and retrieve a document', async () => {
    const collection = 'test_collection';
    const document = { _id: 'test_id', name: 'test_name' };

    await dbClient.collection(collection).insertOne(document);
    const storedDocument = await dbClient.collection(collection).findOne({ _id: 'test_id' });

    expect(storedDocument).toEqual(document);
  });
});

