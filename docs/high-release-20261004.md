# High-priority release — 2026-10-04

Implemented on top of the existing game clarity, reconnect, QR invitation and Daily archive features:

| Area | Result | Verification |
|---|---|---|
| Mobile layout | 44 px controls, 16 px inputs, scrollable dialogs, visualViewport keyboard handling, short landscape images, wrapping navigation | Regression and DOM integration; qa/responsive.html for browser-sized viewports |
| Navigation / overlays | Topmost modal focus containment, Escape/back handling, focus restoration, inert background, safe exit and explicit end actions | Full DOM integration, all game regression |
| Before starting | Mode, player count, rounds, category/difficulty and timer summary; accurate confidence scoring instructions | Rules and priority checks |
| Answer / timeout | Text and symbols supplement color; account/room/question-scoped persisted retries, including false answers | Answer, estimate, facts and priority regression |
| Online waiting / host | Fact/Fake waiting roster without answer disclosure; server-validated takeover after 90s host absence, fresh member required; leaving preserves roster and scores | Live rollback SQL fixtures, unauthorized/early/old-host checks |
| Joining / recovery | Existing QR/link/manual code and reconnect flows retained; codes don't autocorrect; helpful error notice | Existing QR, reconnect and resilience checks |
| Accounts | Login/logout blocked mid-match; stale refresh cannot overwrite new account; delayed private responses rejected; cross-tab change stops interaction | Session/controller checks and live account SQL |
| Dailys / leaderboard | Berlin day-change notice, ongoing attempt retains original day; archive and DST checks; mobile rows, timestamp, explicit load/retry and stale-response rejection | Daily/archive/medium/priority checks and live SQL |
| Text / content | Player names and online labels escaped; existing source, unit, asset/crop and answer-free-image gates pass | Regression and content-pack checks |
| Deployment | Online/offline files synchronized; changed assets have updated cache versions | Regression plus post-deployment live check |

Database migrations applied through the Marc Supabase connection: room_recovery and facts_waiting_privacy. Public base tables have RLS enabled. Existing private deny-all tables are intentionally accessed through authenticated, checked game functions.

Scope of evidence: automated content checks verify bundled metadata, units, assets and known answer leaks; they do not independently reread every external source. Browser-sized viewports do not certify physical iPhone/iPad Safari or virtual keyboard behavior. Supabase reports leaked-password protection disabled; the available connector cannot change Auth settings, so this requires dashboard configuration.
