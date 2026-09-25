---
name: moolresha-social
description: Generate on-brand Instagram carousels and Reel scripts for the MoolResha apparel brand (@moolresha, "Closer to the Root."). Use when asked to create a MoolResha post, carousel, Reel, or fibre/fabric/style content. Produces 5+ sequential image prompts, on-slide headlines, caption, and hashtags, and updates a topics backlog + anti-repeat memory file.
---

# MoolResha Instagram Content Skill (Claude)

This skill generates consistent, on-brand Instagram content for **@moolresha** — *Closer to the Root.*

## Canonical files (single source of truth — local to this repo)

Do NOT duplicate these. Read and update them in place:

- Instructions: `ourbrand/moolresha-social-skill/SKILL.md`
- Topics backlog: `ourbrand/moolresha-social-skill/topics.md`
- Anti-repeat memory: `ourbrand/moolresha-social-skill/memory.md`
- Human guide: `ourbrand/moolresha-social-skill/README.md`

(Paths are relative to the `frontend-basics` repo root.)

## How to run

1. **Read `ourbrand/moolresha-social-skill/SKILL.md` in full** — it contains the complete operating rules, the image-prompt formula (§5), carousel archetypes (§4), the Reel-script archetype (§8), and worked examples. Follow it exactly.
2. **Read `memory.md` first** — never regenerate a topic already listed there.
3. **Read `topics.md`** — pick the highest-priority `TODO` (or the topic the user names).
4. Produce the full output per the canonical SKILL.md (carousel or Reel).
5. **Update the files:** append the new row to `memory.md` and flip the topic to `DONE` in `topics.md`.

## Triggers

"create the next MoolResha carousel", "MoolResha post about <topic>", "reel script for <topic>", "this week's MoolResha posts".

## Note

This skill outputs text prompts + captions + scripts. Actual image generation is done by an image tool (GPT-4o image, Gemini/Imagen, Midjourney, Ideogram); headlines are overlaid in Canva. See the canonical README for the full tool workflow.
