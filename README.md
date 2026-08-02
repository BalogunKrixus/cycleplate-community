# CyclePlate Community

A standalone community for CyclePlate. Members post anonymously about their
cycle, reply to each other, and hear from verified professionals. Built as its
own Next.js app so it can be reviewed on a preview URL before it is linked from
the main site.

This repository does not touch hellocycleplate.com.

## Running it

```bash
npm install
cp .env.local.example .env.local   # fill in the two Supabase values
npm run dev
```

## Setting up Supabase

1. Create a project at supabase.com.
2. SQL Editor, paste `supabase/schema.sql`, run it. This creates the tables,
   the triggers that keep counts accurate, and the row level security policies.
3. Paste `supabase/seed.sql`, run it. This adds the seven starting categories.
4. Project Settings, API. Copy the Project URL and the `anon` key into
   `.env.local`.
5. Sign up through the site, then make yourself an admin:

   ```sql
   update public.profiles set role = 'admin'
    where id = (select id from auth.users where email = 'you@example.com');
   ```

The `service_role` key is not used by this app. It bypasses every policy, so it
should never appear in a `NEXT_PUBLIC_` variable or in this repository.

### Email confirmation

Supabase confirms addresses by email by default. Leaving that on is the right
call for a community: it stops a stranger signing up as somebody else's address.
Authentication, Providers, Email is where to change it.

## Deploying

Import the repository at vercel.com/new. Set the same two environment variables
for Production and Preview, then deploy. There is no build configuration to
change; the defaults for Next.js are correct.

## How it is put together

```
app/
  community/          the feed, readable without an account
  auth/               sign in and sign up
  account/            display name, professional category, sign out
  admin/              moderation queue and member management
components/
  feed/               post cards, threads, chips, search, guidelines banner
  post/               floating compose button and its modal
  interactions/       like and flag
  admin/              queue and member manager
  ui/                 avatar, badges, cards, buttons
lib/
  actions.ts          every write, each re-checking permission on the server
  config.ts           character limits, badge wording, palette
  displayName.ts      anonymous handle generation
  supabase/           browser and server clients
supabase/
  schema.sql          tables, triggers, row level security
  seed.sql            starting categories
```

### Decisions worth knowing

**Roles are enforced in Postgres, not in the interface.** Hiding an admin
button is not access control. Every table has row level security, and the
policies are the thing that actually stops a member deleting someone else's
post. The checks in `lib/actions.ts` exist so people get a readable sentence
instead of a database error.

**Email never reaches a table the feed can read.** `public.profiles` is world
readable, because the feed shows display names and badges. Email lives in
`auth.users`, and the only way to see one is `search_members`, a security
definer function that returns nothing unless the caller is an admin.

**Display names and roles are snapshotted onto posts and replies.** A rename
does not rewrite what people already read, and revoking Professional status
does not silently strip the badge from advice that was given under it.

**Counts are maintained by trigger.** `like_count` and `reply_count` are
columns kept in step by database triggers, so the feed never aggregates.

**Likes need their own table.** A count alone cannot say whether *you* liked
something, so the heart would never fill, and nothing would stop a second like.
The unique constraint on `(user_id, target_type, target_id)` handles both.

**Deletion is soft.** Removed content is hidden from the feed by policy and
stays in the database with who removed it and when.

## Deliberately not included

No mobile app references, no image or video upload, no direct messaging, no
notifications, and no payment or subscription gating.
