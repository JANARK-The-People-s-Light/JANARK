import mongoose from "mongoose";

const globalForMongo = globalThis as unknown as {
  mongoosePromise: Promise<typeof mongoose> | undefined;
  memoryServer: { getUri: () => string } | undefined;
};

async function resolveMongoUri(): Promise<string> {
  if (process.env.MONGODB_URI) return process.env.MONGODB_URI;

  // Prefer local Docker / installed mongod; fall back to in-memory for CI
  const defaultUri = "mongodb://127.0.0.1:27017/janark";
  try {
    const { MongoClient } = await import("mongodb");
    const client = new MongoClient(defaultUri, {
      serverSelectionTimeoutMS: 1500,
    });
    await client.connect();
    await client.close();
    return defaultUri;
  } catch {
    const { MongoMemoryServer } = await import("mongodb-memory-server");
    if (!globalForMongo.memoryServer) {
      globalForMongo.memoryServer = await MongoMemoryServer.create({
        instance: { dbName: "janark" },
      });
    }
    return globalForMongo.memoryServer.getUri();
  }
}

export async function connectMongo() {
  if (mongoose.connection.readyState === 1) return mongoose;
  if (!globalForMongo.mongoosePromise) {
    globalForMongo.mongoosePromise = (async () => {
      const uri = await resolveMongoUri();
      mongoose.set("strictQuery", true);
      await mongoose.connect(uri);
      return mongoose;
    })();
  }
  return globalForMongo.mongoosePromise;
}
