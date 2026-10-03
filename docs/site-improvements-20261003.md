# Site-wide high priorities

- Direct Solo/local or Online entry for all four games, with optional mode settings. Jeopardy keeps its two-team local setup. Fact/Fake remains Solo.
- Consistent bottom navigation. Leaving an active round opens a resume/leave dialog instead of resetting the page. Online uses the existing exit confirmation. Countdowns continue and this is explicitly stated.
- Account status and guest scope explained in profile; guest scores do not automatically transfer to an account.
- 41 question-photo variants use a maximum 480 px bounding box and preserve aspect ratio. Full images remain available for large displays and high pixel density. Variants: 1,242,550 bytes vs 3,794,934 original bytes (67% reduction when variants are selected). Images decode asynchronously and retain stale-subject protections.

Front-end changes require merging/deploying PR #96. No physical-device visual verification performed.
