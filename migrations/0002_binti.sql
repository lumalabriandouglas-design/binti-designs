create table if not exists boutique_settings (
  id integer primary key default 1,
  pin text not null default '2408',
  brand_name text not null default 'BINTI DESIGNS',
  tagline text not null default 'Cut. Drape. Belong.',
  whatsapp text not null default '',
  phone text not null default '',
  payment_phone text not null default '',
  instagram text not null default 'https://www.instagram.com/binti_dezigns',
  drape_url text not null default 'https://odrapecollective.com',
  about text not null default 'BINTI DESIGNS is an East African atelier devoted to precise cut, quiet luxury, and clothes that hold their shape in the light.',
  pin_changed boolean not null default false
);

insert into boutique_settings (id)
values (1)
on conflict (id) do nothing;

create table if not exists pieces (
  id serial primary key,
  slug text unique not null,
  title text not null,
  subtitle text not null default '',
  description text not null default '',
  price_cents integer not null default 0,
  currency text not null default 'UGX',
  category text not null default 'Look',
  cover_url text not null,
  gallery text not null default '[]',
  video_url text not null default '',
  caption text not null default '',
  status text not null default 'published',
  publish_to_drape boolean not null default false,
  drape_status text not null default 'idle',
  created_at timestamptz not null default now()
);

create table if not exists journal_entries (
  id serial primary key,
  title text not null default '',
  caption text not null default '',
  media_url text not null,
  media_type text not null default 'image',
  created_at timestamptz not null default now()
);

create table if not exists wishlists (
  user_id text not null,
  piece_id integer not null,
  created_at timestamptz not null default now(),
  primary key (user_id, piece_id)
);

create table if not exists orders (
  id serial primary key,
  user_id text,
  guest_name text not null default '',
  guest_phone text not null default '',
  guest_email text not null default '',
  items text not null default '[]',
  notes text not null default '',
  total_cents integer not null default 0,
  status text not null default 'inquiry',
  created_at timestamptz not null default now()
);

create table if not exists studio_tokens (
  token text primary key,
  created_at timestamptz not null default now()
);

insert into pieces (slug, title, subtitle, description, price_cents, category, cover_url, caption)
select
  'wrap-set-midnight',
  'The Wrap Set',
  'Midnight',
  'One-shoulder wrap top with a falling sash, cut against a close capri. Made to travel from daylight into evening without changing its mind.',
  18500,
  'Set',
  '/looks/wrap-set.jpg',
  'Midnight wrap. Gold at the ear. Quiet power.'
where not exists (select 1 from pieces where slug = 'wrap-set-midnight');

insert into pieces (slug, title, subtitle, description, price_cents, category, cover_url, caption)
select
  'wrap-set-pewter',
  'The Wrap Set',
  'Pewter',
  'The same architecture in a cooler metal. Light gathers on the sash and leaves the rest of the body clean.',
  18500,
  'Set',
  '/looks/wrap-set.jpg',
  'Pewter in late sun. The sash does the talking.'
where not exists (select 1 from pieces where slug = 'wrap-set-pewter');

insert into pieces (slug, title, subtitle, description, price_cents, category, cover_url, caption)
select
  'wrap-set-crimson',
  'The Wrap Set',
  'Crimson',
  'A saturated red that holds its depth indoors. Wear it with a small bag and nothing else that argues.',
  19500,
  'Set',
  '/looks/wrap-set.jpg',
  'Crimson wrap. The room rearranges itself.'
where not exists (select 1 from pieces where slug = 'wrap-set-crimson');
