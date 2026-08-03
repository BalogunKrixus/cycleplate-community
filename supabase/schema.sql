-- CyclePlate Community schema.
--
-- Paste the whole file into the Supabase SQL Editor and run it. It is safe to
-- run more than once: nothing here drops a table or deletes a row, so a second
-- run after a mistake changes nothing.
--
-- Roles are enforced here rather than in the interface. Hiding a button is not
-- access control, and this is health adjacent data.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------- types
do $$ begin
  create type public.user_role as enum ('member', 'professional', 'admin');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.professional_category as enum
    ('nutritionist', 'dietitian', 'doctor', 'gynecologist', 'other');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.target_type as enum ('post', 'reply');
exception when duplicate_object then null; end $$;

-- ------------------------------------------------------------------- profiles
-- Supabase keeps accounts in auth.users, which cannot be joined or exposed
-- directly, so every account gets a row here. Email stays in auth.users and is
-- never selected into the feed.
create table if not exists public.profiles (
  id                          uuid primary key references auth.users on delete cascade,
  display_name                text not null,
  role                        public.user_role not null default 'member',
  professional_category       public.professional_category,
  professional_category_other text,
  -- a member may rename once, so a handle cannot be churned to shake off a name
  display_name_changed        boolean not null default false,
  created_at                  timestamptz not null default now()
);

create unique index if not exists profiles_display_name_key
  on public.profiles (lower(display_name));

-- ----------------------------------------------------------------- categories
-- A table rather than a constant, so an admin can edit these without a deploy.
create table if not exists public.categories (
  id         uuid primary key default gen_random_uuid(),
  slug       text not null unique,
  label      text not null,
  sort_order integer not null default 0,
  is_active  boolean not null default true
);

-- ---------------------------------------------------------------------- posts
create table if not exists public.posts (
  id            uuid primary key default gen_random_uuid(),
  author_id     uuid not null references public.profiles on delete cascade,
  -- the handle at the time of writing, so a later rename cannot rewrite history
  display_name  text not null,
  body          text not null check (char_length(body) between 1 and 2000),
  category_slug text references public.categories (slug) on update cascade,
  is_pinned     boolean not null default false,
  is_deleted    boolean not null default false,
  deleted_at    timestamptz,
  deleted_by    uuid references public.profiles,
  like_count    integer not null default 0,
  reply_count   integer not null default 0,
  created_at    timestamptz not null default now()
);

create index if not exists posts_feed_idx
  on public.posts (is_deleted, is_pinned desc, created_at desc);
create index if not exists posts_category_idx
  on public.posts (category_slug) where is_deleted = false;

-- -------------------------------------------------------------------- replies
create table if not exists public.replies (
  id                          uuid primary key default gen_random_uuid(),
  post_id                     uuid not null references public.posts on delete cascade,
  author_id                   uuid not null references public.profiles on delete cascade,
  display_name                text not null,
  body                        text not null check (char_length(body) between 1 and 2000),
  -- role and category are snapshotted, so revoking Professional later does not
  -- strip the badge from advice already given under it
  author_role                 public.user_role not null,
  professional_category       public.professional_category,
  professional_category_other text,
  is_deleted                  boolean not null default false,
  deleted_at                  timestamptz,
  deleted_by                  uuid references public.profiles,
  like_count                  integer not null default 0,
  created_at                  timestamptz not null default now()
);

create index if not exists replies_post_idx on public.replies (post_id, created_at);

-- ---------------------------------------------------------------------- likes
-- like_count alone cannot say whether *you* liked something, and nothing would
-- stop a second like. The unique constraint does both.
create table if not exists public.likes (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles on delete cascade,
  target_type public.target_type not null,
  target_id   uuid not null,
  created_at  timestamptz not null default now(),
  unique (user_id, target_type, target_id)
);

create index if not exists likes_target_idx on public.likes (target_type, target_id);

-- ---------------------------------------------------------------------- flags
create table if not exists public.flags (
  id          uuid primary key default gen_random_uuid(),
  target_type public.target_type not null,
  target_id   uuid not null,
  flagged_by  uuid not null references public.profiles on delete cascade,
  reason      text,
  resolved    boolean not null default false,
  resolved_at timestamptz,
  resolved_by uuid references public.profiles,
  created_at  timestamptz not null default now(),
  -- one flag per person per item, so a queue cannot be flooded by one account
  unique (flagged_by, target_type, target_id)
);

create index if not exists flags_queue_idx on public.flags (resolved, created_at desc);

-- ------------------------------------------------------------------- counters
-- Counts are kept in step by trigger so the feed never has to aggregate.
create or replace function public.sync_like_count() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  t public.target_type := coalesce(new.target_type, old.target_type);
  i uuid := coalesce(new.target_id, old.target_id);
  d integer := case when tg_op = 'INSERT' then 1 else -1 end;
begin
  if t = 'post' then
    update public.posts set like_count = greatest(0, like_count + d) where id = i;
  else
    update public.replies set like_count = greatest(0, like_count + d) where id = i;
  end if;
  return null;
end $$;

drop trigger if exists likes_sync on public.likes;
create trigger likes_sync after insert or delete on public.likes
  for each row execute function public.sync_like_count();

create or replace function public.sync_reply_count() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  update public.posts p
     set reply_count = (
       select count(*) from public.replies r
        where r.post_id = p.id and r.is_deleted = false
     )
   where p.id = coalesce(new.post_id, old.post_id);
  return null;
end $$;

drop trigger if exists replies_sync on public.replies;
create trigger replies_sync
  after insert or update of is_deleted or delete on public.replies
  for each row execute function public.sync_reply_count();

-- --------------------------------------------------------------- new accounts
-- A profile is created by trigger rather than by the app, so an account can
-- never exist without one and nobody can choose their own role at sign up.
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    coalesce(
      nullif(new.raw_user_meta_data ->> 'display_name', ''),
      'Member ' || substr(replace(new.id::text, '-', ''), 1, 6)
    )
  )
  on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- -------------------------------------------------------------------- helpers
create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.profiles where id = auth.uid() and role = 'admin'
  );
$$;

-- --------------------------------------------------- one rename, enforced here
-- A member may change their generated handle once. The check in the app is only
-- there to produce a readable sentence: a member holds the publishable key in
-- their browser, so without this trigger they could rename themselves as often
-- as they liked, and set display_name_changed back to false while they were at
-- it. The flag is never writable by hand, only as a consequence of a rename.
create or replace function public.enforce_display_name_change() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.display_name is distinct from old.display_name then
    if public.is_admin() and auth.uid() is distinct from old.id then
      -- an admin renaming somebody else does not spend that person's one change
      new.display_name_changed := old.display_name_changed;
    elsif old.display_name_changed then
      raise exception 'display name has already been changed once'
        using errcode = 'check_violation';
    else
      new.display_name_changed := true;
    end if;
  else
    new.display_name_changed := old.display_name_changed;
  end if;
  return new;
end $$;

drop trigger if exists profiles_name_guard on public.profiles;
create trigger profiles_name_guard before update on public.profiles
  for each row execute function public.enforce_display_name_change();

-- ------------------------------------------------------------- member search
-- Admins search members by display name or email. Email lives in auth.users and
-- deliberately never reaches public.profiles, which the whole feed can read.
-- This function is the only way to see one, and it returns nothing at all
-- unless the caller is an admin.
create or replace function public.search_members(q text)
returns table (
  id uuid,
  display_name text,
  email text,
  role public.user_role,
  professional_category public.professional_category,
  professional_category_other text,
  created_at timestamptz
)
language sql stable security definer set search_path = public as $$
  select p.id, p.display_name, u.email::text, p.role,
         p.professional_category, p.professional_category_other, p.created_at
    from public.profiles p
    join auth.users u on u.id = p.id
   where public.is_admin()
     and (
       coalesce(q, '') = ''
       or p.display_name ilike '%' || q || '%'
       or u.email ilike '%' || q || '%'
     )
   order by p.created_at desc
   limit 50;
$$;

revoke execute on function public.search_members(text) from anon;
grant execute on function public.search_members(text) to authenticated;

-- ------------------------------------------------------------------------ RLS
alter table public.profiles   enable row level security;
alter table public.categories enable row level security;
alter table public.posts      enable row level security;
alter table public.replies    enable row level security;
alter table public.likes      enable row level security;
alter table public.flags      enable row level security;

-- Profiles. Readable by anyone, because the feed shows display names and
-- badges. Email is not in this table, so nothing private is exposed.
drop policy if exists profiles_read on public.profiles;
create policy profiles_read on public.profiles for select using (true);

-- A member may edit their own row but not their own role: the check pins role
-- and category to their current values unless an admin is doing it.
drop policy if exists profiles_self_update on public.profiles;
create policy profiles_self_update on public.profiles for update
  using (id = auth.uid())
  with check (
    id = auth.uid()
    and role = (select role from public.profiles where id = auth.uid())
    and professional_category is not distinct from
        (select professional_category from public.profiles where id = auth.uid())
  );

drop policy if exists profiles_admin_update on public.profiles;
create policy profiles_admin_update on public.profiles for update
  using (public.is_admin()) with check (public.is_admin());

-- Categories. Public to read, admin to change.
drop policy if exists categories_read on public.categories;
create policy categories_read on public.categories for select using (true);

drop policy if exists categories_admin_write on public.categories;
create policy categories_admin_write on public.categories for all
  using (public.is_admin()) with check (public.is_admin());

-- Posts. Visitors read the feed without an account. Removed posts stay visible
-- to admins only, so the audit trail survives without leaking into the feed.
drop policy if exists posts_read on public.posts;
create policy posts_read on public.posts for select
  using (is_deleted = false or public.is_admin());

drop policy if exists posts_insert on public.posts;
create policy posts_insert on public.posts for insert
  with check (author_id = auth.uid());

-- Only an admin edits a post after the fact. Pinning and removal are moderation
-- actions, and an author rewriting a post that already has replies would change
-- what people were replying to.
drop policy if exists posts_admin_update on public.posts;
create policy posts_admin_update on public.posts for update
  using (public.is_admin()) with check (public.is_admin());

-- Replies. Same shape.
drop policy if exists replies_read on public.replies;
create policy replies_read on public.replies for select
  using (is_deleted = false or public.is_admin());

drop policy if exists replies_insert on public.replies;
create policy replies_insert on public.replies for insert
  with check (author_id = auth.uid());

drop policy if exists replies_admin_update on public.replies;
create policy replies_admin_update on public.replies for update
  using (public.is_admin()) with check (public.is_admin());

-- Likes. Counts are public, but a like belongs to the person who made it.
drop policy if exists likes_read on public.likes;
create policy likes_read on public.likes for select using (true);

drop policy if exists likes_insert on public.likes;
create policy likes_insert on public.likes for insert with check (user_id = auth.uid());

drop policy if exists likes_delete on public.likes;
create policy likes_delete on public.likes for delete using (user_id = auth.uid());

-- Flags. Written by any signed in member, read only by admins: a queue everyone
-- can read tells a bad actor exactly what has been noticed.
drop policy if exists flags_insert on public.flags;
create policy flags_insert on public.flags for insert with check (flagged_by = auth.uid());

drop policy if exists flags_admin_read on public.flags;
create policy flags_admin_read on public.flags for select using (public.is_admin());

drop policy if exists flags_admin_update on public.flags;
create policy flags_admin_update on public.flags for update
  using (public.is_admin()) with check (public.is_admin());
