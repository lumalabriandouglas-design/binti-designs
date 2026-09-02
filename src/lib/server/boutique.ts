import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getSql } from "@/lib/db";
import { authMiddleware } from "@/lib/auth/middleware";

export type Piece = {
  id: number;
  slug: string;
  title: string;
  subtitle: string;
  description: string;
  price_cents: number;
  currency: string;
  category: string;
  cover_url: string;
  gallery: string;
  video_url: string;
  caption: string;
  status: string;
  publish_to_drape: boolean;
  drape_status: string;
  created_at: string;
};

export type Settings = {
  id: number;
  brand_name: string;
  tagline: string;
  whatsapp: string;
  phone: string;
  payment_phone: string;
  instagram: string;
  drape_url: string;
  about: string;
  pin_changed: boolean;
};

export type JournalEntry = {
  id: number;
  title: string;
  caption: string;
  media_url: string;
  media_type: string;
  created_at: string;
};

export type OrderRow = {
  id: number;
  guest_name: string;
  guest_phone: string;
  items: string;
  notes: string;
  total_cents: number;
  status: string;
  created_at: string;
};

async function requireStudio(token: string) {
  const sql = await getSql();
  const rows = await sql<{ token: string }>`
    select token from studio_tokens where token = ${token} limit 1
  `;
  if (!rows[0]) throw new Error("Studio session expired. Enter the pin again.");
}

export const getPublicCatalog = createServerFn({ method: "GET" }).handler(
  async () => {
    const sql = await getSql();
    const pieces = await sql<Piece>`
      select * from pieces
      where status = 'published'
      order by created_at desc
    `;
    const settingsRows = await sql<Settings>`
      select id, brand_name, tagline, whatsapp, phone, payment_phone,
             instagram, drape_url, about, pin_changed
      from boutique_settings where id = 1
    `;
    const journal = await sql<JournalEntry>`
      select * from journal_entries order by created_at desc limit 24
    `;
    return {
      pieces,
      settings: settingsRows[0] ?? null,
      journal,
    };
  },
);

export const getPieceBySlug = createServerFn({ method: "GET" })
  .validator(z.object({ slug: z.string() }))
  .handler(async ({ data }) => {
    const sql = await getSql();
    const rows = await sql<Piece>`
      select * from pieces where slug = ${data.slug} and status = 'published' limit 1
    `;
    return rows[0] ?? null;
  });

export const unlockStudio = createServerFn({ method: "POST" })
  .validator(z.object({ pin: z.string().min(3).max(24) }))
  .handler(async ({ data }) => {
    const sql = await getSql();
    const rows = await sql<{ pin: string; pin_changed: boolean }>`
      select pin, pin_changed from boutique_settings where id = 1
    `;
    const pin = rows[0]?.pin ?? "2408";
    if (data.pin.trim() !== pin) {
      return { ok: false as const, error: "That pin does not open the atelier." };
    }
    const token = crypto.randomUUID();
    await sql`insert into studio_tokens (token) values (${token})`;
    return { ok: true as const, token, pinChanged: Boolean(rows[0]?.pin_changed) };
  });

const studioPayload = z.object({ token: z.string() });

export const getStudioData = createServerFn({ method: "POST" })
  .validator(studioPayload)
  .handler(async ({ data }) => {
    await requireStudio(data.token);
    const sql = await getSql();
    const pieces = await sql<Piece>`select * from pieces order by created_at desc`;
    const journal = await sql<JournalEntry>`
      select * from journal_entries order by created_at desc
    `;
    const orders = await sql<OrderRow>`
      select id, guest_name, guest_phone, items, notes, total_cents, status, created_at
      from orders order by created_at desc limit 40
    `;
    const settingsRows = await sql<Settings & { pin: string }>`
      select * from boutique_settings where id = 1
    `;
    return { pieces, journal, orders, settings: settingsRows[0] };
  });

export const savePiece = createServerFn({ method: "POST" })
  .validator(
    z.object({
      token: z.string(),
      id: z.number().optional(),
      slug: z.string().min(2),
      title: z.string().min(1),
      subtitle: z.string().default(""),
      description: z.string().default(""),
      price_cents: z.number().int().nonnegative(),
      category: z.string().default("Look"),
      cover_url: z.string().min(4),
      gallery: z.string().default("[]"),
      video_url: z.string().default(""),
      caption: z.string().default(""),
      status: z.enum(["draft", "published"]).default("published"),
      publish_to_drape: z.boolean().default(false),
    }),
  )
  .handler(async ({ data }) => {
    await requireStudio(data.token);
    const sql = await getSql();
    const drapeStatus = data.publish_to_drape ? "queued" : "idle";
    if (data.id) {
      await sql`
        update pieces set
          slug = ${data.slug},
          title = ${data.title},
          subtitle = ${data.subtitle},
          description = ${data.description},
          price_cents = ${data.price_cents},
          category = ${data.category},
          cover_url = ${data.cover_url},
          gallery = ${data.gallery},
          video_url = ${data.video_url},
          caption = ${data.caption},
          status = ${data.status},
          publish_to_drape = ${data.publish_to_drape},
          drape_status = ${drapeStatus}
        where id = ${data.id}
      `;
      return { id: data.id };
    }
    const inserted = await sql<{ id: number }>`
      insert into pieces (
        slug, title, subtitle, description, price_cents, category,
        cover_url, gallery, video_url, caption, status, publish_to_drape, drape_status
      ) values (
        ${data.slug}, ${data.title}, ${data.subtitle}, ${data.description},
        ${data.price_cents}, ${data.category}, ${data.cover_url}, ${data.gallery},
        ${data.video_url}, ${data.caption}, ${data.status}, ${data.publish_to_drape},
        ${drapeStatus}
      ) returning id
    `;
    return { id: inserted[0].id };
  });

export const deletePiece = createServerFn({ method: "POST" })
  .validator(z.object({ token: z.string(), id: z.number() }))
  .handler(async ({ data }) => {
    await requireStudio(data.token);
    const sql = await getSql();
    await sql`delete from pieces where id = ${data.id}`;
    return { ok: true };
  });

export const saveJournal = createServerFn({ method: "POST" })
  .validator(
    z.object({
      token: z.string(),
      title: z.string().default(""),
      caption: z.string().default(""),
      media_url: z.string().min(4),
      media_type: z.enum(["image", "video"]),
    }),
  )
  .handler(async ({ data }) => {
    await requireStudio(data.token);
    const sql = await getSql();
    const rows = await sql<{ id: number }>`
      insert into journal_entries (title, caption, media_url, media_type)
      values (${data.title}, ${data.caption}, ${data.media_url}, ${data.media_type})
      returning id
    `;
    return { id: rows[0].id };
  });

export const deleteJournal = createServerFn({ method: "POST" })
  .validator(z.object({ token: z.string(), id: z.number() }))
  .handler(async ({ data }) => {
    await requireStudio(data.token);
    const sql = await getSql();
    await sql`delete from journal_entries where id = ${data.id}`;
    return { ok: true };
  });

export const saveSettings = createServerFn({ method: "POST" })
  .validator(
    z.object({
      token: z.string(),
      brand_name: z.string().min(2),
      tagline: z.string(),
      whatsapp: z.string(),
      phone: z.string(),
      payment_phone: z.string(),
      instagram: z.string(),
      drape_url: z.string(),
      about: z.string(),
      new_pin: z.string().optional(),
    }),
  )
  .handler(async ({ data }) => {
    await requireStudio(data.token);
    const sql = await getSql();
    if (data.new_pin && data.new_pin.trim().length >= 4) {
      await sql`
        update boutique_settings set
          brand_name = ${data.brand_name},
          tagline = ${data.tagline},
          whatsapp = ${data.whatsapp},
          phone = ${data.phone},
          payment_phone = ${data.payment_phone},
          instagram = ${data.instagram},
          drape_url = ${data.drape_url},
          about = ${data.about},
          pin = ${data.new_pin.trim()},
          pin_changed = true
        where id = 1
      `;
    } else {
      await sql`
        update boutique_settings set
          brand_name = ${data.brand_name},
          tagline = ${data.tagline},
          whatsapp = ${data.whatsapp},
          phone = ${data.phone},
          payment_phone = ${data.payment_phone},
          instagram = ${data.instagram},
          drape_url = ${data.drape_url},
          about = ${data.about}
        where id = 1
      `;
    }
    return { ok: true };
  });

export const markDrapePublished = createServerFn({ method: "POST" })
  .validator(z.object({ token: z.string(), id: z.number() }))
  .handler(async ({ data }) => {
    await requireStudio(data.token);
    const sql = await getSql();
    await sql`
      update pieces
      set publish_to_drape = true, drape_status = 'published'
      where id = ${data.id}
    `;
    return { ok: true };
  });

export const toggleWishlist = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(z.object({ pieceId: z.number() }))
  .handler(async ({ data, context }) => {
    const sql = await getSql();
    const existing = await sql<{ piece_id: number }>`
      select piece_id from wishlists
      where user_id = ${context.userId} and piece_id = ${data.pieceId}
    `;
    if (existing[0]) {
      await sql`
        delete from wishlists
        where user_id = ${context.userId} and piece_id = ${data.pieceId}
      `;
      return { saved: false };
    }
    await sql`
      insert into wishlists (user_id, piece_id)
      values (${context.userId}, ${data.pieceId})
    `;
    return { saved: true };
  });

export const getMyWishlist = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const sql = await getSql();
    return sql<Piece>`
      select p.* from pieces p
      inner join wishlists w on w.piece_id = p.id
      where w.user_id = ${context.userId}
      order by w.created_at desc
    `;
  });

export const placeInquiry = createServerFn({ method: "POST" })
  .validator(
    z.object({
      guest_name: z.string().min(1),
      guest_phone: z.string().min(6),
      guest_email: z.string().optional().default(""),
      items: z.string(),
      notes: z.string().default(""),
      total_cents: z.number().int().nonnegative(),
    }),
  )
  .handler(async ({ data }) => {
    const sql = await getSql();
    const rows = await sql<{ id: number }>`
      insert into orders (
        guest_name, guest_phone, guest_email, items, notes, total_cents, status
      ) values (
        ${data.guest_name}, ${data.guest_phone}, ${data.guest_email},
        ${data.items}, ${data.notes}, ${data.total_cents}, 'inquiry'
      ) returning id
    `;
    const settings = await sql<{ whatsapp: string; payment_phone: string }>`
      select whatsapp, payment_phone from boutique_settings where id = 1
    `;
    return {
      id: rows[0].id,
      whatsapp: settings[0]?.whatsapp ?? "",
      payment_phone: settings[0]?.payment_phone ?? "",
    };
  });
