/**
 * Object storage abstraction (ADR-0001).
 * Public URLs remain `/uploads/{key}` regardless of backend.
 */

export const UPLOAD_KEY_RE =
  /^[a-f0-9]{16,64}\.(jpg|jpeg|png|webp|gif|mp4|webm)$/i;

export const UPLOAD_CONTENT_TYPES: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  gif: "image/gif",
  mp4: "video/mp4",
  webm: "video/webm",
};

export function uploadsPublicUrl(key: string) {
  return `/uploads/${key}`;
}

export function contentTypeForKey(key: string): string {
  const ext = key.split(".").pop()?.toLowerCase() ?? "";
  return UPLOAD_CONTENT_TYPES[ext] ?? "application/octet-stream";
}

export function isValidUploadKey(key: string): boolean {
  return UPLOAD_KEY_RE.test(key.trim());
}

export type PutObjectInput = {
  key: string;
  body: Buffer;
  contentType: string;
};

export type PutObjectResult = {
  key: string;
  /** Stable public path stored on posts — always `/uploads/{key}` */
  publicUrl: string;
  contentType: string;
  size: number;
};

export type GetObjectResult = {
  stream: ReadableStream;
  contentType: string;
  contentLength: number;
};

export interface StorageProvider {
  readonly name: "local" | "seaweedfs";
  putObject(input: PutObjectInput): Promise<PutObjectResult>;
  getObject(key: string): Promise<GetObjectResult | null>;
  deleteObject?(key: string): Promise<boolean>;
}
