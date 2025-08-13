import { MongoClient, Db, Collection } from 'mongodb';

export class MongoService {
  private client: MongoClient;
  private db: Db | null = null;
  private collection: Collection<SampleData> | null = null;

  constructor(connectionString: string) {
    this.client = new MongoClient(connectionString);
  }

  async connect(): Promise<void> {
    try {
      await this.client.connect();
      this.db = this.client.db('simulator');
      this.collection = this.db.collection<SampleData>('users');
      console.log('Connected to MongoDB successfully');
    } catch (error) {
      console.error('MongoDB connection error:', error);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    await this.client.close();
    console.log('Disconnected from MongoDB');
  }

  getCollection(): Collection<SampleData> {
    if (!this.collection) {
      throw new Error('Database not connected');
    }
    return this.collection;
  }
}