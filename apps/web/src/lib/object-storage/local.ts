import { createReadStream, existsSync, statSync } from "node:fs";
import { mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { Readable } from "node:stream";
import {
  contentTypeForKey,
  isValidUploadKey,
  uploadsPublicUrl,
  type GetObjectResult,
  type PutObjectInput,
  type PutObjectResult,
  type StorageProvider,
} from "@/lib/object-storage/types";

/** Absolute directory for local citizen media (Docker volume in compose). */
export function localUploadsDir() {
  const fromEnv = process.env.UPLOAD_DIR?.trim();
  if (fromEnv) return path.resolve(fromEnv);
  return path.join(process.cwd(), "public", "uploads");
}

/**
 * Current production behavior: write under public/uploads (or UPLOAD_DIR).
 */
export function createLocalStorageProvider(): StorageProvider {
  return {
    name: "local",

    async putObject(input: PutObjectInput): Promise<PutObjectResult> {
      if (!isValidUploadKey(input.key)) {
        throw new Error("Invalid upload key");
      }
      const dir = localUploadsDir();
      await mkdir(dir, { recursive: true });
      const filePath = path.join(dir, input.key);
      if (!filePath.startsWith(dir + path.sep)) {
        throw new Error("Invalid upload path");
      }
      await writeFile(filePath, input.body);
      return {
        key: input.key,
        publicUrl: uploadsPublicUrl(input.key),
        contentType: input.contentType,
        size: input.body.length,
      };
    },

    async getObject(key: string): Promise<GetObjectResult | null> {
      if (!isValidUploadKey(key)) return null;
      const dir = localUploadsDir();
      const filePath = path.join(dir, key);
      if (!filePath.startsWith(dir + path.sep) && filePath !== dir) {
        return null;
      }
      if (!existsSync(filePath)) return null;
      const size = statSync(filePath).size;
      const stream = Readable.toWeb(
        createReadStream(filePath),
      ) as unknown as ReadableStream;
      return {
        stream,
        contentType: contentTypeForKey(key),
        contentLength: size,
      };
    },

    async deleteObject(key: string): Promise<boolean> {
      if (!isValidUploadKey(key)) return false;
      const dir = localUploadsDir();
      const filePath = path.join(dir, key);
      if (!filePath.startsWith(dir + path.sep)) return false;
      try {
        await unlink(filePath);
        return true;
      } catch {
        return false;
      }
    },
  };
}
