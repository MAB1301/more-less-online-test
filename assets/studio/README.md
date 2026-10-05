# Night Lounge shop and settings

The selected first design uses horizontal shop categories, a persistent profile preview and a compact music library. Settings reuse the actual existing input elements and event handlers, moving them into Ton, Darstellung and Profil sections. The existing account/profile editor and image cache panel remain available.

music-covers.webp is one original generated 2 × 2 illustration atlas, resized to 1024 × 1024 and encoded as WebP (158,532 bytes). The four panels depict a neon road/vinyl, warm seaside sunset, orbital planet and pixel castle. It is requested only while a relevant view is open; data-saving mode uses gradients. The added script, CSS and atlas together total approximately 182 KB before transfer compression. No music file is copied into localStorage or the static service-worker cache.

No wallet, ownership, login reward, auth or purchase logic is replaced. Styles and music selection keep the existing authenticated server persistence. Sound/display preferences keep the existing browser persistence; the settings UI states this explicitly. Profile editing keeps the existing account/guest save path. A collection uses the original item action handlers so it has the same ownership and price checks as the catalog. Cover art and UI previews never create purchases.

After edits, regenerate scripts/build-asset-manifest.py, then run scripts/regression-check.mjs. This preserves current content revisions and evicts changed cache entries without duplicating unchanged graphics.
