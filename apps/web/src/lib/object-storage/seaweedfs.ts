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

function filerBaseUrl() {
  const raw = process.env.SEAWEEDFS_FILER_URL?.trim();
  if (!raw) {
    throw new Error(
      "SEAWEEDFS_FILER_URL is required when STORAGE_PROVIDER=seaweedfs",
    );
  }
  return raw.replace(/\/$/, "");
}

/** Path prefix inside the Filer (bucket-like). */
function filerPrefix() {
  const p = (process.env.SEAWEEDFS_PATH_PREFIX ?? "janark").trim();
  return p.replace(/^\/+|\/+$/g, "") || "janark";
}

function objectUrl(key: string) {
  return `${filerBaseUrl()}/${filerPrefix()}/${key}`;
}

/**
 * SeaweedFS Filer HTTP API provider (ADR-0001).
 * Enabled with STORAGE_PROVIDER=seaweedfs + SEAWEEDFS_FILER_URL.
 * Compose wiring lands in the follow-up integration PR.
 */
export function createSeaweedFsStorageProvider(): StorageProvider {
  return {
    name: "seaweedfs",

    async putObject(input: PutObjectInput): Promise<PutObjectResult> {
      if (!isValidUploadKey(input.key)) {
        throw new Error("Invalid upload key");
      }
      const url = objectUrl(input.key);
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": input.contentType,
          "Content-Length": String(input.body.length),
        },
        body: new Uint8Array(input.body),
      });
      if (!res.ok) {
        const detail = await res.text().catch(() => "");
        throw new Error(
          `SeaweedFS put failed (${res.status})${detail ? `: ${detail.slice(0, 200)}` : ""}`,
        );
      }
      return {
        key: input.key,
        publicUrl: uploadsPublicUrl(input.key),
        contentType: input.contentType,
        size: input.body.length,
      };
    },

    async getObject(key: string): Promise<GetObjectResult | null> {
      if (!isValidUploadKey(key)) return null;
      const res = await fetch(objectUrl(key), { method: "GET" });
      if (res.status === 404) return null;
      if (!res.ok || !res.body) {
        throw new Error(`SeaweedFS get failed (${res.status})`);
      }
      const lenHeader = res.headers.get("content-length");
      const contentLength = lenHeader ? Number(lenHeader) : 0;
      const nodeStream = Readable.fromWeb(
        res.body as import("stream/web").ReadableStream,
      );
      const stream = Readable.toWeb(nodeStream) as unknown as ReadableStream;
      return {
        stream,
        contentType:
          res.headers.get("content-type") || contentTypeForKey(key),
        contentLength: Number.isFinite(contentLength) ? contentLength : 0,
      };
    },

    async deleteObject(key: string): Promise<boolean> {
      if (!isValidUploadKey(key)) return false;
      const res = await fetch(objectUrl(key), { method: "DELETE" });
      return res.ok || res.status === 404;
    },
  };
}
