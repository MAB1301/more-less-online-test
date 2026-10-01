# Menu artwork

These original raster atlases were generated with the built-in Imagegen tool for GAME / NIGHT. They depict decorative game themes, not factual illustrations used for quiz answers. All wording and selection states remain accessible HTML; the pictures are decorative CSS backgrounds.

The site uses the original PNG files without cropping or altering them. CSS selects the appropriate atlas cell. The homepage is unchanged. The game menus load their matching artwork when displayed.

## Prompt set

- `modes-atlas.png`: One square texture atlas in an exact 3 × 3 grid, no gutters or labels. Cohesive midnight-navy background with premium tangible 3D objects and cyan-purple rim light. In row order: illuminated playing cards; fabric jester hat with gold bells; amber lightning sculpture; ruby glass heart; gold crown with purple gems; translucent blue/magenta dice; archery target with turquoise rings and arrow; gold pouch of coins; green seedling and soil. Objects centered within each cell. No text, logos or watermarks; no emoji styling.
- `jeopardy-atlas.png`: One 2:1 texture atlas in an exact 4 × 2 grid of square photographic scenes, no gutters or labels. Warm gold and cool navy lighting. In row order: classic blue-screen quiz studio; larger quiz studio; soccer ball on floodlit stadium turf; real dice and face-down cards; anatomical brain model, book and brass telescope; gold sports trophy in a stadium; terrestrial globe and compass on a map tabletop; party hats, confetti and gold streamers. No text, logos, people or watermarks. Each subject contained within its cell.
- `levels-atlas.png`: One 3:1 texture atlas of three equal square cells. Midnight-navy background, cohesive sculptural realism and cinematic light. Left: green seedling in soil with green light. Middle: realistic anatomical brain sculpture with lavender-purple light. Right: amber-red sculptural flame. No text, logos, labels or watermarks; no emoji styling.

Native grid sizes: modes 3 × 3; Jeopardy 4 × 2; levels 3 × 1. The menu stylesheet defines cell positions. The PNG dimensions may differ from requested dimensions, but the actual atlas aspect ratios are used directly.

## Rule-preview artwork (G + D)

`rule-background.webp` and `rule-cards.webp` were generated with built-in Imagegen from the user-approved G + D mockup. They are decorative scene artwork. All headings, rules, settings, countdowns and buttons are real accessible HTML. The generated source images were encoded as WebP at quality 85 to keep the two assets below 400 KB combined.

- Background prompt: Recreate only the reference's outer MORE/LESS card background. Dark navy engraved card backs scattered diagonally, violet light left and cyan right, MORE and LESS lettering on two cards. Keep the center dark for a separate HTML modal. Remove the center panel, UI, category imagery and corner labels.
- Card prompt: Recreate only the left illustration. Upright stack of collectible navy cards with ornate gold lines, a globe on the front and MORE / LESS lettering. Purple glow left, cyan rim light right, reflective dark stone ground, portrait framing. No surrounding interface or controls.
