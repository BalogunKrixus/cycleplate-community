-- Starting categories. An admin can edit these from the panel afterwards, so
-- this file is a starting point rather than the source of truth.

insert into public.categories (slug, label, sort_order) values
  ('cravings',      'Cravings',      1),
  ('pcos-journey',  'PCOS journey',  2),
  ('first-periods', 'First periods', 3),
  ('period-pain',   'Period pain',   4),
  ('endometriosis', 'Endometriosis', 5),
  ('pms-and-mood',  'PMS and mood',  6),
  ('general',       'General',       7)
on conflict (slug) do nothing;

-- Make yourself an admin. Sign up through the site first, then run this with
-- your own address.
--
--   update public.profiles set role = 'admin'
--    where id = (select id from auth.users where email = 'you@example.com');
