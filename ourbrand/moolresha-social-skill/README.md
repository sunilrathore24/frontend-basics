# MoolResha Instagram Carousel Skill

A ready-to-use skill for generating consistent, on-brand Instagram carousels for **@moolresha** — *Closer to the Root.*

## Files

| File | What it is |
|------|-----------|
| `SKILL.md` | The skill itself. The core is §5 (image prompt formula) and §6 (worked example). |
| `topics.md` | Your content backlog. 32 topics seeded. Status flips TODO → DONE. |
| `memory.md` | Anti-repeat log. The skill checks this so it never repeats a topic. |
| `README.md` | This file. |

## How to run it (every time)

1. Open ChatGPT (a model that can generate images — GPT-4o / DAL·E, or use the prompts in Midjourney/any generator).
2. Paste, in this order:
   - the full contents of `SKILL.md`
   - the full contents of `topics.md`
   - the full contents of `memory.md`
3. Say: **"Create the next MoolResha carousel."**
   - Or name one: **"Create the MoolResha carousel for European linen."**
   - Or make a Reel: **"Reel script for European linen."** (see SKILL.md §8)
   - Or batch a week: **"Give me this week's 3 posts."** (a good mix is 2 carousels + 1 Reel)
4. ChatGPT returns: carousel plan → 5–7 image prompts → on-slide headlines → caption → hashtags → file updates.
5. Generate the 5+ images by pasting each Slide prompt into your image tool.
6. **Paste the "File updates" back into `memory.md` and `topics.md`** (or tell ChatGPT to output the full updated files). This is what keeps it from repeating topics.

## Why the images stay consistent (the trick)

Every image prompt is built from three parts:
- **Brand Visual DNA** (constant — same palette, light, texture, mood) → this is what makes 5 separate images look like ONE story.
- **Slide Content** (changes per slide).
- **Technical specs** (constant — 4:5 vertical, same grade).

Keep the Brand Visual DNA block identical across all 5 slides and the carousel will feel cohesive.

## Tips

- Image models render long text badly. Let the skill leave a **text-safe empty zone** and add the headline yourself in Canva. The skill outputs the exact headlines separately.
- Keep captions honest and reason-based (brand voice). No "luxury/eco/premium" hype.
- If a fact isn't certain (e.g., "X% of flax grows in Y"), the skill flags it — **verify before posting.**
- Back up `memory.md` occasionally; it's the memory of everything posted.

## Cadence

Target 2–3 posts/week. Run the batch command once a week and you'll have your slots filled.
