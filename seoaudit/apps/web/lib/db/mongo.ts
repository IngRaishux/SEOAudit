import { MongoClient } from 'mongodb';

const uri = process.env.MONGODB_URI;
if (!uri) {
  throw new Error('MONGODB_URI environment variable is not set');
}

const options = {
  maxPoolSize: 10,
  minPoolSize: 2,
};

const globalForMongo = globalThis as unknown as {
  __mongoClientPromise?: Promise<MongoClient>;
};

let clientPromise: Promise<MongoClient>;

if (process.env.NODE_ENV === 'development') {
  if (!globalForMongo.__mongoClientPromise) {
    globalForMongo.__mongoClientPromise = MongoClient.connect(uri, options);
  }
  clientPromise = globalForMongo.__mongoClientPromise;
} else {
  clientPromise = MongoClient.connect(uri, options);
}

export default clientPromise;
