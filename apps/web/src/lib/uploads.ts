/**
 * @deprecated Prefer `@/lib/object-storage` — kept for stable import paths.
 * See ADR-0001.
 */
export {
  getStorageProvider,
  isValidUploadKey,
  localUploadsDir as uploadsDir,
  uploadsPublicUrl,
} from "@/lib/object-storage";
