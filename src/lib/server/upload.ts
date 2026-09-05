import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getSql } from "@/lib/db";
import { memory, useMemoryDb } from "@/lib/server/store";
import {
  r2Configured,
  r2Put,
  r2SignPut,
  resolveMediaRef,
  publicOrSigned,
} from "@/lib/server/r2";
import { firebaseAuthMiddleware } from "@/lib/server/firebase-middleware";
import { isHouseEmail } from "@/lib/server/boutique";
import { verifyFirebaseToken } from "@/lib/server/firebase-verify";

async function assertStudio(token?: string) {
  if (!token) throw new Error("Studio session expired.");
  if (useMemoryDb()) {
    if (!memory().tokens.has(token)) throw new Error("Studio session expired.");
    return;
  }
  const sql = await getSql();
  const rows = await sql<{ token: string }>`
    select token from studio_tokens where token = ${token} limit 1
  `;
  if (!rows[0]) throw new Error("Studio session expired.");
}

async function houseFrom(email: string | null | undefined, token?: string, idToken?: string) {
  if (isHouseEmail(email)) return;
  if (idToken) {
    try {
      const session = await verifyFirebaseToken(idToken);
      if (isHouseEmail(session.email)) return;
    } catch {
      /* fall through */
    }
  }
  await assertStudio(token);
}

function safeName(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]+/g, "-").slice(0, 48) || "look";
}

export const requestMediaPut = createServerFn({ method: "POST" })
  .middleware([firebaseAuthMiddleware])
  .validator(
    z.object({
      token: z.string().optional(),
      idToken: z.string().optional(),
      filename: z.string(),
      contentType: z.string(),
      kind: z.enum(["image", "video"]),
    }),
  )
  .handler(async ({ data, context }) => {
    await houseFrom((context as { email?: string | null }).email, data.token, data.idToken);
    if (!r2Configured()) {
      return { ok: false as const, error: "Archive is not connected." };
    }
    const key = `looks/${Date.now()}-${crypto.randomUUID().slice(0, 8)}-${safeName(data.filename)}`;
    const putUrl = await r2SignPut(key, data.contentType);
    const readUrl = await publicOrSigned(key);
    return { ok: true as const, key: `r2:${key}`, putUrl, readUrl };
  });

export const storeMedia = createServerFn({ method: "POST" })
  .middleware([firebaseAuthMiddleware])
  .validator(
    z.object({
      token: z.string().optional(),
      idToken: z.string().optional(),
      filename: z.string(),
      contentType: z.string().default("image/jpeg"),
      dataUrl: z.string().min(32),
    }),
  )
  .handler(async ({ data, context }) => {
    await houseFrom((context as { email?: string | null }).email, data.token, data.idToken);
    const match = data.dataUrl.match(/^data:([^;]+);base64,(.+)$/);
    if (!match) throw new Error("That file could not be packed.");
    const contentType = match[1] || data.contentType;
    const body = Buffer.from(match[2], "base64");
    if (!r2Configured()) {
      throw new Error("The archive is not connected. Add R2 keys on Vercel.");
    }
    const key = `looks/${Date.now()}-${crypto.randomUUID().slice(0, 8)}-${safeName(data.filename)}`;
    await r2Put(key, body, contentType);
    return { url: await publicOrSigned(key), ref: `r2:${key}` };
  });

export const resolveMedia = createServerFn({ method: "GET" })
  .validator(z.object({ ref: z.string() }))
  .handler(async ({ data }) => resolveMediaRef(data.ref));

export const resolveMediaBatch = createServerFn({ method: "POST" })
  .validator(z.object({ refs: z.array(z.string()) }))
  .handler(async ({ data }) => {
    const urls: Record<string, string> = {};
    await Promise.all(
      data.refs.map(async (ref) => {
        urls[ref] = await resolveMediaRef(ref);
      }),
    );
    return urls;
  });
