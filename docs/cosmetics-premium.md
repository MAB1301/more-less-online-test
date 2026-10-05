# Avatar frames and shop previews

22 original SVG ornaments share the same transparent centre and scale for shop,
profile and leaderboard use. Six additions: Obsidian Crest, Royal Laurel,
Aurora Veil, Dragon Guard, Coral Bloom and Prism Arc. No animation, external
fonts or bitmap assets. Regenerate with `python3 scripts/build-avatar-frames.py`.

Name colour cards show the actual player name and a colour strip. Title cards
show the actual badge, with the same styling used on leaderboard rows. Clicking
a title only changes the title preview; the chosen frame and name colour remain.
Buying and equipping still use the existing authenticated cosmetic RPC. Existing
catalog IDs and inventory rows are preserved. The additive SQL seed is in
`supabase/cosmetics-premium-catalog.sql` and is safe to apply again.

Validation: full client regression suite; transaction-scoped anonymous test user
purchased all 15 additions, checked duplicate buys do not charge again, changed
equipped items and checked a fresh profile read. The test was rolled back.

## Silhouette variation

Emerald Circuit is a hexagon, Obsidian Crest and Dragon Guard are shields,
Prism Arc is a diamond, Frost Halo is an octagon, Stardust is a five-pointed
star, and Davidstern uses the full six-pointed star outline. Toast and UFO
use bread and oval silhouettes. Portrait backgrounds and photos follow the
matching cutout; the vector overlay is not clipped. Existing inventory IDs
are unchanged, so owned frames update automatically.
