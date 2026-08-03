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
4. Project Settings, API Keys. Copy the Project URL and the publishable key
   into `.env.local`. Newer projects call it "Publishable key" and it starts
   with `sb_publishable_`; older ones call the same thing "anon public" and it
   looks like a JWT. Both work.
5. Sign up through the site, then make yourself an admin:

   ```sql
   update public.profiles set role = 'admin'
    where id = (select id from auth.users where email = 'you@example.com');
   ```

The secret key (`sb_secret_...`, previously `service_role`) is not used by this
app. It bypasses every policy, so it should never appear in a `NEXT_PUBLIC_`
variable or in this repository. If one is ever exposed, revoke it in Project
Settings, API Keys.

### Email confirmation

Supabase confirms addresses by email by default. Leaving that on is the right
call for a community: it stops a stranger signing up as somebody else's address.
Authentication, Providers, Email is where to change it.

Two settings under Authentication, URL Configuration have to match the
deployment or the confirmation email will send people nowhere useful:

- **Site URL**: the deployed address, for example
  `https://cycleplate-community.vercel.app`. It defaults to
  `http://localhost:3000`, which is the wrong thing to mail to a real person.
- **Redirect URLs**: add `https://cycleplate-community.vercel.app/**` and
  `http://localhost:3000/**`. Sign up asks for a link back to whichever host
  the browser is on, and Supabase refuses any address not on this list.

The link lands on `/auth/callback`, which trades the one time code for a
session and drops them into the feed already signed in.

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

**A handle can be changed once, and that is a trigger, not a check in the app.**
Members hold the publishable key in their browser, so anything enforced only in
`lib/actions.ts` can be stepped around with a direct API call. The trigger also
makes `display_name_changed` unwritable by hand, so the allowance cannot be
reset. An admin renaming somebody else does not spend that person's one change.

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
