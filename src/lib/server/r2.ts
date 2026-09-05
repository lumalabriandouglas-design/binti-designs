import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  PutBucketCorsCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

function hydrateDotenv() {
  try {
    const text = readFileSync(join(process.cwd(), ".env"), "utf8");
    for (const raw of text.split("\n")) {
      const line = raw.trim();
      if (!line || line.startsWith("#")) continue;
      const eq = line.indexOf("=");
      if (eq < 1) continue;
      const key = line.slice(0, eq).trim();
      const value = line.slice(eq + 1).trim();
      if (!process.env[key]) process.env[key] = value;
    }
  } catch {
    // Vercel and other hosts inject env; local .env is optional.
  }
}

hydrateDotenv();

function required(name: string) {
  return (process.env[name] ?? "").trim();
}

export function r2Configured() {
  return Boolean(
    required("R2_ENDPOINT") &&
      required("R2_ACCESS_KEY_ID") &&
      required("R2_SECRET_ACCESS_KEY") &&
      required("R2_BUCKET"),
  );
}

export function r2Bucket() {
  return required("R2_BUCKET") || required("R2_BUCKET_ALT") || "binti-design";
}

function buckets() {
  return [...new Set([required("R2_BUCKET"), required("R2_BUCKET_ALT"), "binti-design", "binti-designs"].filter(Boolean))];
}

let client: S3Client | null = null;
let corsReady = false;

export function r2Client() {
  if (!r2Configured()) {
    throw new Error("The house archive is not connected yet.");
  }
  client ??= new S3Client({
    region: "auto",
    endpoint: required("R2_ENDPOINT"),
    forcePathStyle: true,
    credentials: {
      accessKeyId: required("R2_ACCESS_KEY_ID"),
      secretAccessKey: required("R2_SECRET_ACCESS_KEY"),
    },
  });
  return client;
}

export async function ensureR2Cors() {
  if (corsReady) return;
  try {
    await r2Client().send(
      new PutBucketCorsCommand({
        Bucket: r2Bucket(),
        CORSConfiguration: {
          CORSRules: [
            {
              AllowedHeaders: ["*"],
              AllowedMethods: ["GET", "PUT", "HEAD", "POST"],
              AllowedOrigins: [
                "https://binti-designs.vercel.app",
                "https://*.vercel.app",
                "http://localhost:5173",
                "http://localhost:3000",
                "http://localhost:8080",
                "*",
              ],
              ExposeHeaders: ["ETag", "Location"],
              MaxAgeSeconds: 86400,
            },
          ],
        },
      }),
    );
    corsReady = true;
  } catch {
    corsReady = true;
  }
}

export async function r2Put(key: string, body: Buffer, contentType: string) {
  let last: unknown;
  for (const Bucket of buckets()) {
    try {
      await r2Client().send(
        new PutObjectCommand({
          Bucket,
          Key: key,
          Body: body,
          ContentType: contentType,
          CacheControl: "public, max-age=31536000, immutable",
        }),
      );
      return key;
    } catch (err) {
      last = err;
    }
  }
  throw last instanceof Error ? last : new Error("Archive would not take the file.");
}

export async function r2SignGet(key: string, seconds = 60 * 60 * 12) {
  return getSignedUrl(
    r2Client(),
    new GetObjectCommand({ Bucket: r2Bucket(), Key: key }),
    { expiresIn: seconds },
  );
}

export async function r2SignPut(key: string, contentType: string) {
  await ensureR2Cors();
  return getSignedUrl(
    r2Client(),
    new PutObjectCommand({
      Bucket: r2Bucket(),
      Key: key,
      ContentType: contentType,
    }),
    { expiresIn: 60 * 10 },
  );
}

export async function publicOrSigned(key: string) {
  const base = required("R2_PUBLIC_BASE").replace(/\/$/, "");
  if (base) return `${base}/${key}`;
  return r2SignGet(key, 60 * 60 * 24 * 7);
}

export function isR2Ref(value: string) {
  return value.startsWith("r2:");
}

export async function resolveMediaRef(value: string) {
  if (!value) return value;
  if (value.startsWith("r2:")) {
    if (!r2Configured()) return "";
    return publicOrSigned(value.slice(3));
  }
  return value;
}
