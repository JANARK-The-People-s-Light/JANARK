import { createLocalStorageProvider } from "@/lib/object-storage/local";
import { createSeaweedFsStorageProvider } from "@/lib/object-storage/seaweedfs";
import type { StorageProvider } from "@/lib/object-storage/types";

export type {
  GetObjectResult,
  PutObjectInput,
  PutObjectResult,
  StorageProvider,
} from "@/lib/object-storage/types";
export {
  UPLOAD_CONTENT_TYPES,
  UPLOAD_KEY_RE,
  contentTypeForKey,
  isValidUploadKey,
  uploadsPublicUrl,
} from "@/lib/object-storage/types";
export { localUploadsDir } from "@/lib/object-storage/local";

export type StorageProviderName = "local" | "seaweedfs";

function resolveProviderName(): StorageProviderName {
  const raw = (process.env.STORAGE_PROVIDER ?? "local").trim().toLowerCase();
  if (raw === "seaweedfs" || raw === "seaweed") return "seaweedfs";
  return "local";
}

let cached: StorageProvider | null = null;
let cachedName: StorageProviderName | null = null;

/**
 * Config switch: STORAGE_PROVIDER=local|seaweedfs (default local).
 * SeaweedFS also needs SEAWEEDFS_FILER_URL.
 */
export function getStorageProvider(): StorageProvider {
  const name = resolveProviderName();
  if (cached && cachedName === name) return cached;
  cached =
    name === "seaweedfs"
      ? createSeaweedFsStorageProvider()
      : createLocalStorageProvider();
  cachedName = name;
  return cached;
}

/** Test helper — clear singleton between cases. */
export function resetStorageProviderCache() {
  cached = null;
  cachedName = null;
}
