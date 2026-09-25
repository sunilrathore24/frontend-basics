---
inclusion: manual
---

# MoolResha Instagram Content Skill (Kiro)

Manually-included skill for generating on-brand Instagram content for **@moolresha** — *Closer to the Root.*

Trigger it by adding `#moolresha-social` in chat, then say e.g. "create the next MoolResha carousel" or "reel script for European linen".

## Canonical files (single source of truth — local to this repo)

Always read and update these in place; do not create duplicates:

- Instructions: #[[file:../../ourbrand/moolresha-social-skill/SKILL.md]]
- Topics backlog: #[[file:../../ourbrand/moolresha-social-skill/topics.md]]
- Anti-repeat memory: #[[file:../../ourbrand/moolresha-social-skill/memory.md]]

## How to run

1. Read the canonical `SKILL.md` in full and follow it exactly — it holds the operating rules, image-prompt formula (§5), carousel archetypes (§4), Reel-script archetype (§8), and worked examples.
2. Read `memory.md` FIRST — never regenerate a topic already listed there.
3. Read `topics.md` — pick the highest-priority `TODO`, or the topic the user names.
4. Produce the full carousel (5+ image prompts + on-slide headlines + caption + hashtags) or Reel script.
5. Update files: append a row to `memory.md`, and flip the chosen topic to `DONE` in `topics.md`.

## Scope

Local to the `frontend-basics` repo only. Outputs text prompts/captions/scripts — image generation happens in an external image tool; headlines are added in Canva. See `ourbrand/moolresha-social-skill/README.md` for the tool workflow.
