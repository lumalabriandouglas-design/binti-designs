import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getSql } from "@/lib/db";
import { memory, useMemoryDb } from "@/lib/server/store";
import {
  r2Configured,
  r2Put,
  r2SignPut,
  resolveMediaRef,
} from "@/lib/server/r2";

async function assertStudio(token: string) {
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

function safeName(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]+/g, "-").slice(0, 48) || "look";
}

export const requestMediaPut = createServerFn({ method: "POST" })
  .validator(
    z.object({
      token: z.string(),
      filename: z.string(),
      contentType: z.string(),
      kind: z.enum(["image", "video"]),
    }),
  )
  .handler(async ({ data }) => {
    await assertStudio(data.token);
    if (!r2Configured()) {
      return { ok: false as const, error: "Archive is not connected." };
    }
    const key = `looks/${Date.now()}-${crypto.randomUUID().slice(0, 8)}-${safeName(data.filename)}`;
    const putUrl = await r2SignPut(key, data.contentType);
    return { ok: true as const, key: `r2:${key}`, putUrl };
  });

export const storeMedia = createServerFn({ method: "POST" })
  .validator(
    z.object({
      token: z.string(),
      filename: z.string(),
      contentType: z.string().default("image/jpeg"),
      dataUrl: z.string().min(32),
    }),
  )
  .handler(async ({ data }) => {
    await assertStudio(data.token);
    const match = data.dataUrl.match(/^data:([^;]+);base64,(.+)$/);
    if (!match) throw new Error("That file could not be packed.");
    const contentType = match[1] || data.contentType;
    const body = Buffer.from(match[2], "base64");
    if (r2Configured()) {
      try {
        const key = `looks/${Date.now()}-${crypto.randomUUID().slice(0, 8)}-${safeName(data.filename)}`;
        await r2Put(key, body, contentType);
        return { url: `r2:${key}` };
      } catch {
        return { url: data.dataUrl };
      }
    }
    return { url: data.dataUrl };
  });

export const resolveMedia = createServerFn({ method: "GET" })
  .validator(z.object({ ref: z.string() }))
  .handler(async ({ data }) => resolveMediaRef(data.ref));
