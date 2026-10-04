# High priorities: games, overlays and site view

## Implementation

| Area | Requested High point | Result |
| --- | --- | --- |
| Games | Report incorrect/unclear questions | Report dialog captures the original visible question, metric and unit; reason/note validation, idempotent owner-bound RPC and a 50/day limit. |
| Games | Recover from dropped connections | Honest sync outcome, request timeout, preserved room on transport failures, same-identity guest refresh, heartbeat/presence, same-choice uncertain-answer retry, unchanged-guess/stake estimate retry and non-resetting Jeopardy host restoration. |
| Games | Review difficulty using actual results | Owner-only view over existing server-scored Daily answers and separate optional local observations for all four games. Requires 20 answers and 5 distinct players before marking questions for review. No automatic question or score changes. |
| Overlays | Phone/tablet portrait and landscape | Touch targets, scrollable low-height dialogs, horizontal Jeopardy board scrolling and responsive rules implemented. Adaptive-layout unit checks pass; real-browser and physical-device visual verification remains OPEN. |
| Overlays | Consistent answer feedback | Shared accessible text/symbol status for local and online answers; Daily retains its tested save-state component. Explicit uncertain/retry state prevents treating a failed save as success. |
| Overlays | Readability/accessibility | Keyboard focus, touch targets, readable status/metadata, text alongside colors, reduced-motion support and source-link target size. |
| Site view | Quick game information | Four home cards show approximate duration, player/team count and supported Solo/local/Online modes. Metadata is inside the existing text column and linked with aria-describedby. |
| Site view | Central invitations | Freshly loaded invitation list, delegated account-controller actions, explicit errors, room resume and a copyable room link with manual fallback. Existing notification badge reflects incoming counts. |

## Data and access

New tables live in `ml_private`, enable RLS, revoke all browser table grants and expose only authenticated, validated RPC wrappers with SECURITY INVOKER. Internal helpers bind ownership to auth.uid(), use a fixed empty search path and serialize per-user rate limits. No user-editable JWT metadata authorizes access. Reports and browser observations do not influence game scores. Private raw reports, observations and live question analytics are not exposed to players.

Local observations are OFF by default and require the browser preference “Zur Fragenqualität beitragen”. Server-scored Daily observations use existing answers. Browser evidence is clearly labeled separately because local client outcomes are not authoritative. At implementation time the 26 server answers (15 More/Less, 11 Estimate) all fell below the question-level minimum sample; no question was reclassified from that small sample.

## Verification

- Full client regression suite passes; focused tests exercise pinned report context, retry text retention, opt-in default/deduplication, transient vs invalid session handling, honest sync results, shared sync flight, immutable pending answers, safe peer names, guest invitation explanation, accepted invitation navigation and API timeout behavior.
- Live SQL assertions under authenticated and anon roles pass for report ownership/idempotence, bounded/null inputs, deny-all direct access, observer duplicate/invalid accuracy behavior, rate limit and sample thresholds. Fixtures roll back.
- Security advisor checked: the two new private tables have intentionally deny-all RLS without policies. Existing unrelated exposed-function/anonymous-policy/password advisories remain. No new public SECURITY DEFINER function was introduced. Advisor reference: https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy
- Front-end changes are in PR #96 and require merge/deployment. Server RPCs and review view are installed. No physical-device or browser screenshot verification is claimed.

## Owner review

Run `docs/database/question-quality-review.sql` as database owner to inspect difficulty signals and grouped reports. Check sources and wording before adjusting difficulty. The separate fourth list (operations/release work) was not part of this request.
