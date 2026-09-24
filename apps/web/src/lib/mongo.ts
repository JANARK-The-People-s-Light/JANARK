import mongoose from "mongoose";
import { isProductionRuntime } from "@/lib/security-env";

const globalForMongo = globalThis as unknown as {
  mongoosePromise: Promise<typeof mongoose> | undefined;
  memoryServer: { getUri: () => Promise<string> | string } | undefined;
};

async function probeUri(uri: string, timeoutMs = 1500): Promise<boolean> {
  try {
    const { MongoClient } = await import("mongodb");
    const client = new MongoClient(uri, {
      serverSelectionTimeoutMS: timeoutMs,
    });
    await client.connect();
    await client.close();
    return true;
  } catch {
    return false;
  }
}

async function startMemoryServer(): Promise<string> {
  const { MongoMemoryServer } = await import("mongodb-memory-server");
  if (!globalForMongo.memoryServer) {
    globalForMongo.memoryServer = await MongoMemoryServer.create({
      instance: { dbName: "janark" },
    });
  }
  return globalForMongo.memoryServer.getUri();
}

async function resolveMongoUri(): Promise<string> {
  const configured = process.env.MONGODB_URI?.trim();

  if (configured) {
    if (await probeUri(configured)) return configured;
    if (isProductionRuntime()) {
      throw new Error(`Cannot reach MONGODB_URI (${configured})`);
    }
    // Dev: configured URI down (e.g. Docker/Colima stopped) → in-memory
    return startMemoryServer();
  }

  if (isProductionRuntime()) {
    throw new Error("MONGODB_URI is required in production");
  }

  const defaultUri = "mongodb://127.0.0.1:27017/janark";
  if (await probeUri(defaultUri)) return defaultUri;
  return startMemoryServer();
}

export async function connectMongo() {
  if (mongoose.connection.readyState === 1) return mongoose;
  if (!globalForMongo.mongoosePromise) {
    globalForMongo.mongoosePromise = (async () => {
      const uri = await resolveMongoUri();
      mongoose.set("strictQuery", true);
      await mongoose.connect(uri);
      return mongoose;
    })().catch((err) => {
      globalForMongo.mongoosePromise = undefined;
      throw err;
    });
  }
  return globalForMongo.mongoosePromise;
}
