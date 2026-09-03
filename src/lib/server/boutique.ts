import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getSql } from "@/lib/db";
import { firebaseAuthMiddleware } from "@/lib/server/firebase-middleware";
import { memory, useMemoryDb } from "@/lib/server/store";

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
  sold_out: boolean;
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
  admin_email: string;
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

async function hydratePiece(piece: Piece): Promise<Piece> {
  const { resolveMediaRef } = await import("@/lib/server/r2");
  const cover_url = await resolveMediaRef(piece.cover_url);
  const video_url = piece.video_url ? await resolveMediaRef(piece.video_url) : "";
  let gallery = piece.gallery;
  try {
    const items = JSON.parse(piece.gallery || "[]") as unknown;
    if (Array.isArray(items)) {
      const next = [];
      for (const item of items) {
        if (typeof item === "string") {
          next.push(await resolveMediaRef(item));
        } else if (item && typeof item === "object") {
          const row = item as Record<string, string>;
          next.push({
            thumb: await resolveMediaRef(row.thumb || row.display || ""),
            display: await resolveMediaRef(row.display || row.thumb || ""),
            master: await resolveMediaRef(row.master || row.display || row.thumb || ""),
          });
        }
      }
      gallery = JSON.stringify(next);
    }
  } catch {
    gallery = piece.gallery;
  }
  return { ...piece, cover_url, video_url, gallery };
}

async function hydratePieces(pieces: Piece[]) {
  return Promise.all(pieces.map(hydratePiece));
}

async function requireStudio(token: string) {
  if (useMemoryDb()) {
    if (!memory().tokens.has(token)) {
      throw new Error("Studio session expired. Enter the pin again.");
    }
    return;
  }
  const sql = await getSql();
  const rows = await sql<{ token: string }>`
    select token from studio_tokens where token = ${token} limit 1
  `;
  if (!rows[0]) throw new Error("Studio session expired. Enter the pin again.");
}

export const getPublicCatalog = createServerFn({ method: "GET" }).handler(
  async () => {
    if (useMemoryDb()) {
      const m = memory();
      return {
        pieces: await hydratePieces(m.pieces.filter((p) => p.status === "published")),
        settings: m.settings,
        journal: m.journal,
      };
    }
    try {
      const sql = await getSql();
      const pieces = await sql<Piece>`
        select * from pieces
        where status = 'published'
        order by created_at desc
      `;
      const settingsRows = await sql<Settings>`
        select id, brand_name, tagline, whatsapp, phone, payment_phone,
               instagram, drape_url, about, pin_changed, admin_email
        from boutique_settings where id = 1
      `;
      const journal = await sql<JournalEntry>`
        select * from journal_entries order by created_at desc limit 24
      `;
      return {
        pieces: await hydratePieces(pieces),
        settings: settingsRows[0] ?? null,
        journal,
      };
    } catch {
      const m = memory();
      return {
        pieces: await hydratePieces(m.pieces.filter((p) => p.status === "published")),
        settings: m.settings,
        journal: m.journal,
      };
    }
  },
);

export const getPieceBySlug = createServerFn({ method: "GET" })
  .validator(z.object({ slug: z.string() }))
  .handler(async ({ data }) => {
    if (useMemoryDb()) {
      const piece =
        memory().pieces.find((p) => p.slug === data.slug && p.status === "published") ?? null;
      return piece ? hydratePiece(piece) : null;
    }
    const sql = await getSql();
    const rows = await sql<Piece>`
      select * from pieces where slug = ${data.slug} and status = 'published' limit 1
    `;
    return rows[0] ? hydratePiece(rows[0]) : null;
  });

export const unlockStudio = createServerFn({ method: "POST" })
  .validator(z.object({ pin: z.string().min(3).max(24) }))
  .handler(async ({ data }) => {
    if (useMemoryDb()) {
      const m = memory();
      if (data.pin.trim() !== m.pin) {
        return { ok: false as const, error: "That pin does not open the atelier." };
      }
      const token = crypto.randomUUID();
      m.tokens.add(token);
      return { ok: true as const, token, pinChanged: m.pin_changed };
    }
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
    if (useMemoryDb()) {
      const m = memory();
      return { pieces: m.pieces, journal: m.journal, orders: m.orders, settings: m.settings };
    }
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
    const drapeStatus = data.publish_to_drape ? "queued" : "idle";
    if (useMemoryDb()) {
      const m = memory();
      if (data.id) {
        m.pieces = m.pieces.map((p) =>
          p.id === data.id
            ? {
                ...p,
                slug: data.slug,
                title: data.title,
                subtitle: data.subtitle,
                description: data.description,
                price_cents: data.price_cents,
                category: data.category,
                cover_url: data.cover_url,
                gallery: data.gallery,
                video_url: data.video_url,
                caption: data.caption,
                status: data.status,
                publish_to_drape: data.publish_to_drape,
                drape_status: drapeStatus,
              }
            : p,
        );
        return { id: data.id };
      }
      const id = m.nextPiece++;
      m.pieces.unshift({
        id,
        slug: data.slug,
        title: data.title,
        subtitle: data.subtitle,
        description: data.description,
        price_cents: data.price_cents,
        currency: "UGX",
        category: data.category,
        cover_url: data.cover_url,
        gallery: data.gallery,
        video_url: data.video_url,
        caption: data.caption,
        status: data.status,
        publish_to_drape: data.publish_to_drape,
        drape_status: drapeStatus,
        sold_out: false,
        created_at: new Date().toISOString(),
      });
      return { id };
    }
    const sql = await getSql();
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
    if (useMemoryDb()) {
      memory().pieces = memory().pieces.filter((p) => p.id !== data.id);
      return { ok: true };
    }
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
    if (useMemoryDb()) {
      const m = memory();
      const id = m.nextJournal++;
      m.journal.unshift({
        id,
        title: data.title,
        caption: data.caption,
        media_url: data.media_url,
        media_type: data.media_type,
        created_at: new Date().toISOString(),
      });
      return { id };
    }
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
    if (useMemoryDb()) {
      memory().journal = memory().journal.filter((j) => j.id !== data.id);
      return { ok: true };
    }
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
      admin_email: z.string().email().optional(),
      new_pin: z.string().optional(),
    }),
  )
  .handler(async ({ data }) => {
    await requireStudio(data.token);
    if (useMemoryDb()) {
      const m = memory();
      m.settings = {
        ...m.settings,
        brand_name: data.brand_name,
        tagline: data.tagline,
        whatsapp: data.whatsapp,
        phone: data.phone,
        payment_phone: data.payment_phone,
        instagram: data.instagram,
        drape_url: data.drape_url,
        about: data.about,
        admin_email: data.admin_email?.toLowerCase() || m.settings.admin_email,
        pin_changed: data.new_pin && data.new_pin.trim().length >= 4 ? true : m.settings.pin_changed,
      };
      if (data.new_pin && data.new_pin.trim().length >= 4) {
        m.pin = data.new_pin.trim();
        m.pin_changed = true;
      }
      return { ok: true };
    }
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
          admin_email = ${data.admin_email?.toLowerCase() || "bintidesigns442@gmail.com"},
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
          about = ${data.about},
          admin_email = ${data.admin_email?.toLowerCase() || "bintidesigns442@gmail.com"}
        where id = 1
      `;
    }
    return { ok: true };
  });

export const markDrapePublished = createServerFn({ method: "POST" })
  .validator(z.object({ token: z.string(), id: z.number() }))
  .handler(async ({ data }) => {
    await requireStudio(data.token);
    if (useMemoryDb()) {
      memory().pieces = memory().pieces.map((p) =>
        p.id === data.id ? { ...p, publish_to_drape: true, drape_status: "published" } : p,
      );
      return { ok: true };
    }
    const sql = await getSql();
    await sql`
      update pieces
      set publish_to_drape = true, drape_status = 'published'
      where id = ${data.id}
    `;
    return { ok: true };
  });

export const toggleWishlist = createServerFn({ method: "POST" })
  .middleware([firebaseAuthMiddleware])
  .validator(z.object({ pieceId: z.number() }))
  .handler(async ({ data, context }) => {
    if (useMemoryDb()) {
      const list = memory().wishlists.get(context.userId) ?? [];
      if (list.includes(data.pieceId)) {
        memory().wishlists.set(
          context.userId,
          list.filter((id) => id !== data.pieceId),
        );
        return { saved: false };
      }
      memory().wishlists.set(context.userId, [...list, data.pieceId]);
      return { saved: true };
    }
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
  .middleware([firebaseAuthMiddleware])
  .handler(async ({ context }) => {
    if (useMemoryDb()) {
      const ids = memory().wishlists.get(context.userId) ?? [];
      return memory().pieces.filter((p) => ids.includes(p.id));
    }
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
    if (useMemoryDb()) {
      const m = memory();
      const id = m.nextOrder++;
      m.orders.unshift({
        id,
        guest_name: data.guest_name,
        guest_phone: data.guest_phone,
        items: data.items,
        notes: data.notes,
        total_cents: data.total_cents,
        status: "inquiry",
        created_at: new Date().toISOString(),
      });
      return {
        id,
        whatsapp: m.settings.whatsapp,
        payment_phone: m.settings.payment_phone,
      };
    }
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

export const DEFAULT_ADMIN_EMAIL = "bintidesigns442@gmail.com";

export function isHouseEmail(email?: string | null, adminEmail?: string | null) {
  const allowed = (adminEmail || DEFAULT_ADMIN_EMAIL).trim().toLowerCase();
  return Boolean(email && email.trim().toLowerCase() === allowed);
}

export const setSoldOut = createServerFn({ method: "POST" })
  .validator(z.object({ token: z.string(), id: z.number(), sold_out: z.boolean() }))
  .handler(async ({ data }) => {
    await requireStudio(data.token);
    if (useMemoryDb()) {
      memory().pieces = memory().pieces.map((p) =>
        p.id === data.id ? { ...p, sold_out: data.sold_out } : p,
      );
      return { ok: true };
    }
    const sql = await getSql();
    await sql`update pieces set sold_out = ${data.sold_out} where id = ${data.id}`;
    return { ok: true };
  });

export const requestCallback = createServerFn({ method: "POST" })
  .validator(
    z.object({
      name: z.string().default(""),
      phone: z.string().min(7),
      note: z.string().default(""),
      piece_slug: z.string().default(""),
    }),
  )
  .handler(async ({ data }) => {
    if (useMemoryDb()) {
      const m = memory();
      const id = m.nextCallback++;
      m.callbacks.unshift({
        id,
        name: data.name,
        phone: data.phone,
        note: data.note,
        piece_slug: data.piece_slug,
        status: "open",
        created_at: new Date().toISOString(),
      });
      return { ok: true as const, id };
    }
    const sql = await getSql();
    const rows = await sql<{ id: number }>`
      insert into callbacks (name, phone, note, piece_slug)
      values (${data.name}, ${data.phone}, ${data.note}, ${data.piece_slug})
      returning id
    `;
    return { ok: true as const, id: rows[0].id };
  });

export const listCallbacks = createServerFn({ method: "POST" })
  .validator(z.object({ token: z.string() }))
  .handler(async ({ data }) => {
    await requireStudio(data.token);
    if (useMemoryDb()) return memory().callbacks;
    const sql = await getSql();
    return sql<{
      id: number;
      name: string;
      phone: string;
      note: string;
      piece_slug: string;
      status: string;
      created_at: string;
    }>`select * from callbacks order by created_at desc limit 80`;
  });

export const closeCallback = createServerFn({ method: "POST" })
  .validator(z.object({ token: z.string(), id: z.number() }))
  .handler(async ({ data }) => {
    await requireStudio(data.token);
    if (useMemoryDb()) {
      memory().callbacks = memory().callbacks.map((row) =>
        row.id === data.id ? { ...row, status: "closed" } : row,
      );
      return { ok: true };
    }
    const sql = await getSql();
    await sql`update callbacks set status = 'closed' where id = ${data.id}`;
    return { ok: true };
  });

export const openStudioForHouse = createServerFn({ method: "POST" })
  .middleware([firebaseAuthMiddleware])
  .handler(async ({ context }) => {
    const email = (context as { email?: string | null }).email;
    if (useMemoryDb()) {
      const m = memory();
      if (!isHouseEmail(email, m.settings.admin_email)) {
        return { ok: false as const };
      }
      const token = crypto.randomUUID();
      m.tokens.add(token);
      return { ok: true as const, token };
    }
    const sql = await getSql();
    const rows = await sql<{ admin_email: string }>`
      select admin_email from boutique_settings where id = 1
    `;
    if (!isHouseEmail(email, rows[0]?.admin_email)) {
      return { ok: false as const };
    }
    const token = crypto.randomUUID();
    await sql`insert into studio_tokens (token) values (${token})`;
    return { ok: true as const, token };
  });

