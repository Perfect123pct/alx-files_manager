import { MongoClient } from 'mongodb';

class DBClient {
  constructor() {
    const host = process.env.DB_HOST || 'localhost';
    const port = process.env.DB_PORT || 27017;
    const database = process.env.DB_DATABASE || 'files_manager';

    this.client = new MongoClient(`mongodb://${host}:${port}/${database}`);
  }

  async isAlive() {
    try {
      await this.client.db().command({ ping: 1 });
      return true;
    } catch (err) {
      return false;
    }
  }

  async nbUsers() {
    return (await this.client.collection('users').countDocuments());
  }

  async nbFiles() {
    return (await this.client.collection('files').countDocuments());
  }
}

const dbClient = new DBClient();

export default dbClient;

