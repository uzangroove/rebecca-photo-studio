-- שלב 10: רישום מעבר בין לשוניות ופורמט הורדה. מרחיב את סוגי האירועים ב-studio_events בסוג "tab".
alter table public.studio_events drop constraint if exists studio_events_event_type_check;
alter table public.studio_events add constraint studio_events_event_type_check
  check (event_type in ('generate','download','send','rate','open','tab'));
