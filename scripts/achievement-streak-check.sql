-- Read-only test: duplicate games on a day count once, gaps break a streak,
-- and archive completions never bridge a missing day.
with fixtures(test,day,completed_day) as (
 values
 ('dedupe',date '2026-10-01',date '2026-10-01'),
 ('dedupe',date '2026-10-01',date '2026-10-01'),
 ('dedupe',date '2026-10-02',date '2026-10-02'),
 ('dedupe',date '2026-10-03',date '2026-10-03'),
 ('dedupe',date '2026-09-30',date '2026-10-04'),
 ('gap',date '2026-10-01',date '2026-10-01'),
 ('gap',date '2026-10-03',date '2026-10-03')
), days as (
 select distinct test,day from fixtures where day=completed_day
), islands as (
 select test,day,day-(row_number() over(partition by test order by day))::integer as island from days
), series as (
 select test,count(*) as length from islands group by test,island
)
select test,max(length) as best_streak,
 max(length)=case when test='dedupe' then 3 else 1 end as passed
from series group by test;
