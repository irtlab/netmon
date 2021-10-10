import mongodb from 'mongodb';

export async function getMongoDB() {
  const url: string = 'mongodb://127.0.0.1:27017';
  const options = {
    poolSize: 64,
    useNewUrlParser: true,
    useUnifiedTopology: true
  };

  try {
    const client: any = await mongodb.MongoClient.connect(url, options);
    const mongo_db: any = client.db('radics_db');
    if (!mongo_db) {
      client.close();
      throw new Error('MonogDB connection failed');
    }
    return mongo_db;
  } catch (error) {
    throw new Error(error);
  }
}
