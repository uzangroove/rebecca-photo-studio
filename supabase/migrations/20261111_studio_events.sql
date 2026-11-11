-- שלב 4: תיעוד פעולות של רבקה בסטודיו (למידת העדפות).
-- לא מופעל אוטומטית. מריצים רק באישור של שמעון, אחרי בדיקה בתצוגה מקדימה.
create table if not exists public.studio_events (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  event_type text not null check (event_type in ('generate','download','send','rate','open')),
  image_key text,
  source_id text,
  source_path text,
  selection jsonb,
  format_id text,
  detail jsonb not null default '{}'::jsonb
);
create index if not exists studio_events_image_key_idx on public.studio_events (image_key);
create index if not exists studio_events_created_idx on public.studio_events (created_at desc);

alter table public.studio_events enable row level security;
-- אותה הרשאה כמו בארכיון ההיסטוריה: רק מנהלת.
create policy "studio_events admin select" on public.studio_events for select to authenticated using (public.is_admin());
create policy "studio_events admin insert" on public.studio_events for insert to authenticated with check (public.is_admin());
-- אין עדכון ואין מחיקה: זה יומן.

-- תמונות המקור נשמרות באותו אחסון פרטי (studio-history) בתיקייה sources/.
-- אם המדיניות הקיימת של האחסון מגבילה לפי תיקייה, יש להרחיב אותה גם ל-sources/.
