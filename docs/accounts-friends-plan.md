# Account foundation — prepared, not active

The live game still uses its existing guest flow. `assets/account/session.mjs` is deliberately not loaded by the page. `supabase/accounts-friends-draft.sql` has not been executed or database-tested.

## Prepared

- Separate persistent account session from disposable room state. Returning to home must not log out the account.
- Guest identity, email/password login, new registration with email confirmation, and guest upgrade without a new user ID.
- Refresh tokens, one shared concurrent refresh, and one retry on expired authorization. Refresh cannot silently switch identity.
- Public usernames and display names, pending friend requests, recipient acceptance and participant removal. No emails in public profiles.
- RLS and restricted column grants: guests cannot access profiles/friendships, only participants read requests, only recipients accept. Existing room policies remain unchanged.

## Remaining activation work

1. Select the Supabase connection (Marc or Hs). Current game project: rnwsbgzdrttqtivrwnxo.
2. Review Auth settings: email confirmation, redirect allowlist for the live site, anonymous identity linking/manual linking and email delivery. Follow https://supabase.com/docs/guides/auth/auth-anonymous.
3. Apply the draft in staging and test with guest, sender, recipient and unrelated account. Test forged IDs/status, duplicate reversed requests, delete, profile edits and expired tokens. This SQL is a draft, not a recorded migration.
4. Add one compact account entry in the header. Guest play remains available without registration. Show login/register in a dialog; put friends inside the account panel, not as extra game choices.
5. Wire one shared identity into lobby and Daily clients. Both currently keep different anonymous auth sessions; changing them without a migration strategy could lose access to past attempts/rooms.
6. Confirm an upgraded guest's identity after email verification and refresh; do not unlock account controls only because the update-email call succeeded.
7. Add room invitations after membership authorization is verified. Only accepted friends may be invited; expiration and recipient checks are required. Opening an invitation must use the existing authorized join RPC. Room codes and links remain a fallback.
8. Test confirmation redirects, login/logout, password recovery, guest upgrade, returning home, reconnect and friend flows on two devices before enabling the client.

Do not deploy service-role keys to the browser. Account sessions are bearer credentials; only the existing publishable key is used. Never copy tokens into invitation URLs or logs.

Rollback of the home redesign is independent of this foundation: reverting its PR restores the previous menu without database changes.

## Spielpräferenzen

Soundeffekte, Lautstärke und reduzierte Animationen werden derzeit separat unter `ml_game_preferences_v1` auf dem Gerät gespeichert. Der permanente Account muss diese Präferenzen nach Anmeldung laden und Änderungen synchronisieren; Gastpräferenzen beim ersten Upgrade übernehmen. Profilbild und Spielidentität bleiben davon getrennt.
