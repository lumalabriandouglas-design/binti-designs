alter table boutique_settings
  add column if not exists admin_email text not null default 'bintidesigns442@gmail.com';

update boutique_settings
set admin_email = 'bintidesigns442@gmail.com'
where id = 1 and (admin_email is null or admin_email = '');

alter table pieces
  add column if not exists sold_out boolean not null default false;

update pieces set currency = 'UGX' where currency = 'KES' or currency is null;

create table if not exists callbacks (
  id serial primary key,
  name text not null default '',
  phone text not null,
  note text not null default '',
  piece_slug text not null default '',
  status text not null default 'open',
  created_at timestamptz not null default now()
);
