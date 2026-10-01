# Accounts and friends

Active on the existing Marc connection, project `rnwsbgzdrttqtivrwnxo`. `supabase/accounts-live.sql` was applied as `accounts_profiles_friends_settings`.

## Available

- Email/password login, registration with email confirmation, logout, recovery callback and password reset form. No service-role key in the browser.
- Persistent sessions, coordinated token refresh, profile handle/display name, private avatar and audio/motion preferences.
- Exact-handle friend search, pending requests, recipient acceptance and participant removal. Names are public only to confirmed account holders; private settings are owner-only.
- Permanent accounts share their identity with lobby requests and Daily calls. Existing guest Daily credentials stay separate and are restored after logout. Account switches are blocked during active lobbies and unfinished Dailys.
- Guest results are not silently merged into newly registered accounts. This limitation is shown during signup.

## Verified

The SQL fixture check rolls back guest/sender/recipient/unrelated-user tests and forged ownership changes. The actual Auth/REST test used a temporary confirmed test user, checked password login, profile read/edit, settings upsert, token refresh and friends read, signed it out and removed it. No test emails were sent. The frontend tests cover controller login/logout, password clearing, preserved guest Daily credentials and active-match guards.

## External registration checks

Email authentication and confirmation are enabled. SMTP delivery to real user addresses and the redirect allowlist have not been verified with a real signup. Configure the live site URL/allowlist at https://supabase.com/dashboard/project/rnwsbgzdrttqtivrwnxo/auth/url-configuration and SMTP at https://supabase.com/dashboard/project/rnwsbgzdrttqtivrwnxo/auth/smtp if delivery is restricted. The UI surfaces email-delivery errors and instructs users to return to the game after confirming. Password recovery requires its email link to redirect to the live game.

## Later

Guest-to-account result migration and direct in-app lobby invitations remain separate features. Friends can currently share the existing lobby link or room code. Existing game security-advisor findings were not widened by the account tables.
