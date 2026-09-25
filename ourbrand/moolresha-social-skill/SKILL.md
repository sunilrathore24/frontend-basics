# SKILL: MoolResha Instagram Carousel Generator

**Handle:** @moolresha
**Brand:** MoolResha — *Closer to the Root.*
**Purpose:** Generate a complete, on-brand Instagram carousel (5+ continuation images + caption + hashtags) for one fibre/fabric/style topic at a time, without repeating past topics.

> Paste this whole file (plus `topics.md` and `memory.md`) into ChatGPT. Then say: **"Create the next MoolResha carousel."**

---

## 0. What this skill does (in one line)

Pick the next unposted topic → produce a 5-to-7 image carousel that tells a visual story in continuation → write caption + hashtags → update the memory and topics files.

---

## 1. Operating rules (READ FIRST, EVERY TIME)

1. **Check memory before anything.** Read `memory.md`. Never generate a topic already listed there. If the user names a topic that's already done, say so and suggest the next best undone one.
2. **Pick from the backlog.** Read `topics.md`. Choose the highest-priority topic with status `TODO` (unless the user names a specific topic).
3. **One topic per run.** Produce exactly one carousel.
4. **Continuation, not 5 random images.** The images must read as a sequence — same visual world, same palette, same style, flowing slide 1 → slide N like chapters of one story.
5. **Purpose = attract + teach.** Every post must (a) look scroll-stopping enough that people stop and follow, and (b) leave them feeling they learned something genuinely worth knowing. Each slide teaches ONE specific, true, memorable thing — a real detail, place, number, or "why this matters for your skin/comfort." Appealing AND meaningful, never fluff.
6. **True to source.** Every fact must be accurate and sourceable. Prefer specific, verifiable details over vague claims. If any figure/history/place isn't certain, phrase it generally or mark it `⚠️ verify` — never invent numbers, origins, or history to sound impressive.
7. **Brand voice = knowledgeable, calm, honest, curious, modern, grounded.** Explain, don't exaggerate. No "luxury/premium/eco/sustainable" hype. Give reasons, not adjectives.
8. **Every slide carries meaningful, attractive text OVER the photo.** No blank slides, no plain-background text cards. Each slide's text teaches or intrigues, and is overlaid on the image with a legibility treatment (§5.4).
9. **The LAST slide is ALWAYS a follow CTA.** It must invite the follow, e.g. "Follow @moolresha for more" / "Follow @moolresha for the story behind every fabric" / "Follow to journey closer to the root with us." Pair it with the brand line "Closer to the Root." Vary the wording run to run, but always drive the follow.
10. **Always produce BOTH the carousel and the Reel version** (Part F) — the same photos are designed to run as a ~10s-per-slide Reel for maximum reach.
11. **Always end the run by outputting the file updates** (see Section 7) so the user can paste them back.

---

## 2. Inputs the skill expects

- `topics.md` — the backlog (table with Status: TODO / DONE).
- `memory.md` — log of already-posted carousels.
- Optional: a topic the user names directly ("do European linen next").

If the user hasn't pasted `topics.md`/`memory.md`, ask them to paste both once, then proceed. If they say "just go," use the seeded backlog in `topics.md`.

---

## 3. Output structure (produce ALL of this, in order)

For the chosen topic, output:

**A. Carousel plan** — 1 line: topic, archetype used, number of slides.

**B. Per-slide image prompts** — 5 to 7 blocks. Each block MUST be **fully expanded and self-contained** — the complete text a user can copy-paste into an image generator in one go, with nothing to assemble. Number them Slide 1 … Slide N.

> **HARD RULE — never abbreviate.** Write out the ENTIRE Brand Visual DNA block (§5.1, all lines: STYLE, PALETTE, LIGHT, TEXTURE, MOOD, COMPOSITION, CAMERA, CONSISTENCY, NEGATIVE) **inside every single slide**, followed by that slide's Slide Content (§5.2) and the full Technical specs (§5.3). Do NOT use placeholders like "[same Brand Visual DNA as Slide 1]", "[Brand Visual DNA]", or "same as above". Each slide must stand alone even if that means repeating the DNA block 5–7 times. Slides 2–7 get the same full block as Slide 1, only the SUBJECT/SETTING/ACTION/FRAMING/TEXT-SAFE ZONE/RENDER TEXT lines change.
>
> **HARD RULE — every slide MUST include the `RENDER TEXT ON IMAGE: YES` block** (§5.2) with the exact headline + body, so the words are drawn onto the photo. A prompt that only mentions a "text-safe zone" produces a blank image with no text — do not ship that. Also: the NEGATIVE line says "no text/watermark artifacts" — that means no *garbled/random* text; it does NOT forbid the intentional headline/body you are explicitly asking the model to render.

**C. On-slide text (headline + body) — make it appealing and meaningful.** For EACH slide provide:
  - **Headline** — a short, scroll-stopping line (3–7 words). Curiosity, surprise, or a benefit — not a dry label.
  - **Body** — 1–3 short sentences (roughly 20–45 words) that actually TEACH something specific and true: a real detail, number, place, or "why it matters for your skin/comfort." No filler, no vague adjectives. This is the text the user overlays in Canva and also reads aloud in the Reel (see Part G).
  - **Micro-label (optional)** — a tiny tag like `FLAX` / `THE FIBRE` for visual rhythm.
  - Keep every claim TRUE and sourceable. If a fact isn't certain, phrase it generally or add `⚠️ verify`. Never invent numbers, places, or history.

**D. Caption** — Instagram caption in MoolResha voice (100–200 words): a 1-line scroll-stopping hook, the mini-story with one genuinely interesting/lesser-known fact, and a soft CTA (save/follow/share). End with "MoolResha — Closer to the Root."

**E. Hashtags** — **exactly 10**, chosen for MAXIMUM REACH. Mix three tiers so the post can rank in smaller tags and still tap larger ones:
  - 2–3 **broad/high-volume** (e.g. #Fashion #Cotton #India),
  - 4–5 **niche/mid** (e.g. #Mulmul #NaturalFibres #SlowFashionIndia #FabricEducation),
  - 2–3 **brand/intent** (e.g. #MoolResha #CloserToTheRoot #KnowYourClothes).
  Prefer active, followed hashtags; avoid banned/spammy ones. No more than 10.

**F. Reel version (ALWAYS include) — the 5 photos as a Reel, ~10s per slide.** The carousel images double as a ~50s Reel. Provide, per slide:
  - **Duration:** ~10s (state it, e.g. "0:00–0:10").
  - **Voiceover / on-screen narration:** a spoken line expanding the slide Body into a warm, natural 2–3 sentence script (~25–40 words ≈ 10s of speech). This is what gets read aloud or fed to TTS.
  - **Motion hint:** a subtle move for a still photo (slow zoom-in / pan / parallax / fade) so the Reel feels alive.
  Add: a **hook overlay for the first 3 seconds** (the most important line for reach), an **audio suggestion** (calm acoustic / soft ambient — pick a low-key trending audio in-app; don't name copyrighted tracks), and a reminder to keep captions/subtitles ON for silent viewers. End on the brand line; optionally loop back to slide 1's visual for replays.

**G. File updates** — the new `memory.md` row + the `topics.md` status change (Section 7).

---

## 4. Carousel archetypes (pick the one that fits the topic)

Each topic maps to an archetype that defines the slide sequence.

**Every archetype's FINAL slide is always the Follow CTA** (see Rule §9): "Follow @moolresha for more" + "Closer to the Root." The content slides come before it.

### Archetype A — Fibre Origin Journey (default for "what is X fibre / European linen")
The signature MoolResha format. Follows Source → Fibre → Yarn → Fabric → Garment → You.
1. **Cover / Hook** — big question + hero image ("What is European Linen?")
2. **The Root** — the plant/source & where it grows
3. **The Harvest** — how the fibre is extracted
4. **Fibre → Yarn → Fabric** — spinning & weaving; plus how it reaches India (if imported)
5. **The Feel & Why** — properties + why MoolResha chooses it
6. **Follow CTA** — "Follow @moolresha for more" + "Closer to the Root."

*(For 5 slides, merge steps 3+4. The final slide is ALWAYS the Follow CTA.)*

### Archetype B — Explainer ("What is X", "European vs local linen")
1. Cover question → 2. The simple answer → 3. Key point 1 → 4. Why it matters for what you wear → 5. **Follow CTA**.

### Archetype C — Style & Guidance ("linen colour combinations", "body/skin-tone colour guide")
1. Cover ("Styling Linen: 5 Combinations") → 2–5. one combination/tip per slide (flat-lay or styled) → final. **Follow CTA** ("Follow @moolresha for more styling — Closer to the Root.").

### Archetype D — Comparison ("Linen vs Cotton", "Mal cotton vs regular cotton")
1. Cover → 2. Contender A → 3. Contender B → 4. "Which for which season/use" → 5. **Follow CTA**.

### Archetype E — Care & Myth-busting ("Does linen really wrinkle?", "How to care for linen")
1. Cover myth/question → 2–4. the truth / steps → 5. quick do's & don'ts → 6. **Follow CTA**.

---

## 5. THE CORE — Image prompt formula (use for every slide)

Every slide prompt = **Brand Visual DNA** (constant) **+ Slide Content** (changes) **+ Technical specs** (constant).

**Write all three parts out IN FULL for every slide.** The Brand Visual DNA block below must appear verbatim in each slide's prompt — do not shorten it, do not reference it by name, do not assume the reader can see other slides. A correct carousel repeats the full DNA block once per slide. This is what makes each slide a one-paste, standalone prompt and keeps the whole set visually identical.

### 5.1 Brand Visual DNA (prepend to EVERY image — keeps the 5 images consistent)

```
STYLE: Editorial, natural, grounded, documentary-meets-minimal. Premium but honest,
not glossy or over-stylized. Earthy and calm.
PALETTE: undyed flax beige, natural linen cream, warm oat, soft clay/terracotta,
muted sage green, raw umber, off-white. Low saturation, warm neutral tones.
LIGHT: soft natural daylight, gentle shadows, morning/golden diffused light.
TEXTURE: emphasise natural fibre texture — visible weave, slubs, raw edges, thread,
plant matter, soil, grain of wood and cloth.
MOOD: quiet, curious, authentic, rooted. "Closer to the root."
COMPOSITION: clean, generous negative space (leave room for a text headline),
rule-of-thirds, one clear subject per image.
CAMERA: full-frame look, 50mm or 85mm, shallow depth of field on detail shots,
wider depth for landscapes. Fine natural grain, no HDR, no plastic sheen.
CONSISTENCY: all images in this set share the same palette, light, and grade so they
look like one story.
NEGATIVE: no garbled/random text or gibberish lettering, no watermark, no logos, no
distorted hands, no cartoon look, no neon colours, no heavy vignette, no stocky posed
smiles, no clutter. (The intentional headline/body under RENDER TEXT is wanted — only
avoid unwanted/misspelled text.)
```

### 5.2 Slide Content block (fill this per slide)

```
SLIDE [n] OF [N] — [role: Cover / Root / Harvest / etc.]
SUBJECT: [the single clear thing in frame]
SETTING: [where — e.g., flax field in Normandy at dawn]
ACTION/DETAIL: [what's happening or the detail to focus on]
FRAMING: [wide landscape / macro detail / flat-lay top-down / product-in-hand]
TEXT-SAFE ZONE: [where the text goes — a calm, uncluttered area of THE IMAGE itself (e.g. open sky, blurred field, plain fabric) that has enough contrast to carry overlaid text]
TEXT LEGIBILITY: [state how the text will stay readable ON the photo — e.g. "add a soft dark gradient scrim from the bottom" / "place text over the darker blurred area top-left" / "subtle vignette behind text". The text sits OVER the image, never on a separate plain block.]
RENDER TEXT ON IMAGE: YES — draw the following text directly onto the image, inside the text-safe zone, in a clean modern serif for the headline and a smaller clean sans-serif for the body. Spell it EXACTLY, correct spelling, well-kerned, high contrast against the background:
  HEADLINE: "[the slide's short headline]"
  BODY: "[the slide's 1–3 sentence body]"
  [For the LAST slide, HEADLINE must be the follow CTA, e.g. "Follow @moolresha for more".]
```

> **CRITICAL — this is why text was missing.** If a prompt only describes a "text-safe zone" the model leaves it EMPTY. You MUST include the explicit `RENDER TEXT ON IMAGE: YES` block with the exact words in EVERY slide prompt (unless the user says they'll add text in Canva themselves). Text-capable models like Gemini/GPT-4o will then bake the words in.

### 5.3 Technical specs (append to EVERY image)

```
ASPECT RATIO: 4:5 vertical (1080 x 1350 px) — works as both a carousel slide and a Reel frame.
KEEP the palette, grade and light identical to the other slides in this set.
```

> **Note on aspect ratio for Reels:** 4:5 plays fine in a Reel but leaves bars. If the user says the Reel is the primary format, switch the spec to `ASPECT RATIO: 9:16 vertical (1080 x 1920 px)` and move the TEXT-SAFE ZONE to the middle-safe area (top ~15% and bottom ~20% are covered by IG UI).

### 5.4 On-image text handling — TEXT SITS OVER THE PHOTO, ALWAYS READABLE

**DEFAULT = render the text INTO the image.** Text-capable models (Gemini, GPT-4o) render words well, so every slide prompt must explicitly tell the model the exact text to draw (the `RENDER TEXT ON IMAGE: YES` block in §5.2). Describing only a "text-safe zone" is NOT enough — the model will leave it blank (this is exactly the "no text over the images" problem). Only skip the render block if the user says they'll add text themselves in Canva.

**Rule: the text is overlaid directly on the image — never on a plain/solid-colour background block.** But it must be crisp and easy to read. Achieve both like this:

1. **Design the photo with a text-safe zone** — a calm, low-detail region of the actual image (open sky, softly blurred field, plain area of fabric, shadowed corner) where text can live without fighting the subject. Every slide prompt must specify this zone (§5.2).
2. **Add a legibility treatment baked into the image** so overlaid text pops. In each prompt, request ONE of:
   - a **soft dark gradient scrim** (subtle, ~30–50% opacity) along the edge where text sits, or
   - a **gentle vignette / shadow** behind the text area, or
   - placing text over a **naturally darker or lighter** part of the frame for contrast (dark text on light sky, light text on shadowed cloth).
   Keep it subtle and on-brand — a whisper of shading, not a hard rectangle.
3. **Contrast**: light text on darker areas, dark text on lighter areas. Never low-contrast (beige text on beige).
4. **Placing the actual words — default is render-in-image:**
   - **Default: render in-image.** Include the `RENDER TEXT ON IMAGE: YES` block (§5.2) with the exact headline + body in every slide prompt. Gemini/GPT-4o will draw the text on the photo. If a rendered word comes out misspelled, regenerate or fix that one word in Canva.
   - **Optional: Canva overlay.** If the user prefers full typographic control (or is using a model that can't render text), omit the render block and add the headline + body in Canva into the specified text-safe zone, adding the scrim/brand font yourself.
5. **Consistency:** same font, size hierarchy (bold headline + smaller body), and text position family across all slides so the set looks like one designed carousel.
6. **Keep body text short for rendering.** Models render short lines most reliably. If the body is long, split it into 2 short lines; keep headlines ≤7 words.

---

## 6. WORKED EXAMPLE — "What is European Linen?" (Archetype A, 5 slides)

*(This is the quality bar. Match this every time.)*

**A. Plan:** Topic = European Linen. Archetype A (Fibre Origin Journey), compressed to 5 slides.

**B. Image prompts** — note every slide below is FULLY EXPANDED and standalone. This is exactly the format to produce; never abbreviate the DNA block.

**Slide 1 of 5 — Cover / Hook**
```
STYLE: Editorial, natural, grounded, documentary-meets-minimal. Premium but honest, not glossy or over-stylized. Earthy and calm.
PALETTE: undyed flax beige, natural linen cream, warm oat, soft clay/terracotta, muted sage green, raw umber, off-white. Low saturation, warm neutral tones.
LIGHT: soft natural daylight, gentle shadows, morning/golden diffused light.
TEXTURE: emphasise natural fibre texture — visible weave, slubs, raw edges, thread, plant matter, soil, grain of wood and cloth.
MOOD: quiet, curious, authentic, rooted. "Closer to the root."
COMPOSITION: clean, generous negative space (leave room for a text headline), rule-of-thirds, one clear subject per image.
CAMERA: full-frame look, 50mm or 85mm, shallow depth of field on detail shots, wider depth for landscapes. Fine natural grain, no HDR, no plastic sheen.
CONSISTENCY: all images in this set share the same palette, light, and grade so they look like one story.
NEGATIVE: no garbled/random text or gibberish lettering, no watermark, no logos, no distorted hands, no cartoon look, no neon colours, no heavy vignette, no stocky posed smiles, no clutter. (The intentional headline/body under RENDER TEXT is wanted — only avoid unwanted/misspelled text.)
SUBJECT: a wide field of flax plants in soft blue-green bloom, gentle breeze.
SETTING: rural Northern Europe (Normandy) at early dawn, low mist.
ACTION/DETAIL: endless rows of delicate flax flowers stretching to the horizon.
FRAMING: wide landscape.
TEXT-SAFE ZONE: top third kept as open, softly-lit sky — text will be overlaid here, directly on the photo.
TEXT LEGIBILITY: add a subtle darker gradient at the very top of the sky (a soft scrim) so white overlaid text stays crisp; text sits OVER the image, not on a plain block.
RENDER TEXT ON IMAGE: YES — draw this text directly onto the image in the top text-safe zone, clean modern serif headline + smaller sans body, correct spelling, high contrast:
  HEADLINE: "What is European Linen?"
  BODY: "The world's finest linen doesn't start in a mill. It starts as a flower."
ASPECT RATIO: 4:5 vertical (1080 x 1350 px), Instagram carousel.
KEEP the palette, grade and light identical to the other slides in this set.
```

**Slide 2 of 5 — The Root (plant & origin)**
```
STYLE: Editorial, natural, grounded, documentary-meets-minimal. Premium but honest, not glossy or over-stylized. Earthy and calm.
PALETTE: undyed flax beige, natural linen cream, warm oat, soft clay/terracotta, muted sage green, raw umber, off-white. Low saturation, warm neutral tones.
LIGHT: soft natural daylight, gentle shadows, morning/golden diffused light.
TEXTURE: emphasise natural fibre texture — visible weave, slubs, raw edges, thread, plant matter, soil, grain of wood and cloth.
MOOD: quiet, curious, authentic, rooted. "Closer to the root."
COMPOSITION: clean, generous negative space (leave room for a text headline), rule-of-thirds, one clear subject per image.
CAMERA: full-frame look, 50mm or 85mm, shallow depth of field on detail shots, wider depth for landscapes. Fine natural grain, no HDR, no plastic sheen.
CONSISTENCY: all images in this set share the same palette, light, and grade so they look like one story.
NEGATIVE: no garbled/random text or gibberish lettering, no watermark, no logos, no distorted hands, no cartoon look, no neon colours, no heavy vignette, no stocky posed smiles, no clutter. (The intentional headline/body under RENDER TEXT is wanted — only avoid unwanted/misspelled text.)
SUBJECT: close macro of a single flax plant — slender stem, pale blue flower.
SETTING: same field, shallow depth of field, blurred rows behind.
ACTION/DETAIL: dew on the stem; show the fibrous stalk that becomes linen.
FRAMING: macro detail, vertical.
TEXT-SAFE ZONE: bottom third (softly blurred foreground) — text overlaid directly on the photo here.
TEXT LEGIBILITY: soft dark gradient scrim rising from the bottom edge so light text reads clearly; never a solid block.
RENDER TEXT ON IMAGE: YES — draw this text directly onto the image in the bottom text-safe zone, clean modern serif headline + smaller sans body, correct spelling, high contrast:
  HEADLINE: "It begins as a flower"
  BODY: "Linen comes from flax — a slender plant grown on the cool coasts of Europe."
ASPECT RATIO: 4:5 vertical (1080 x 1350 px), Instagram carousel.
KEEP the palette, grade and light identical to the other slides in this set.
```

**Slide 3 of 5 — The Harvest / fibre extraction**
```
STYLE: Editorial, natural, grounded, documentary-meets-minimal. Premium but honest, not glossy or over-stylized. Earthy and calm.
PALETTE: undyed flax beige, natural linen cream, warm oat, soft clay/terracotta, muted sage green, raw umber, off-white. Low saturation, warm neutral tones.
LIGHT: soft natural daylight, gentle shadows, morning/golden diffused light.
TEXTURE: emphasise natural fibre texture — visible weave, slubs, raw edges, thread, plant matter, soil, grain of wood and cloth.
MOOD: quiet, curious, authentic, rooted. "Closer to the root."
COMPOSITION: clean, generous negative space (leave room for a text headline), rule-of-thirds, one clear subject per image.
CAMERA: full-frame look, 50mm or 85mm, shallow depth of field on detail shots, wider depth for landscapes. Fine natural grain, no HDR, no plastic sheen.
CONSISTENCY: all images in this set share the same palette, light, and grade so they look like one story.
NEGATIVE: no garbled/random text or gibberish lettering, no watermark, no logos, no distorted hands, no cartoon look, no neon colours, no heavy vignette, no stocky posed smiles, no clutter. (The intentional headline/body under RENDER TEXT is wanted — only avoid unwanted/misspelled text.)
SUBJECT: harvested flax stalks laid in long rows on the field (retting), and a hand pulling apart a stalk to reveal the fibres inside.
SETTING: same field, later in season, warm oat and umber tones.
ACTION/DETAIL: golden dried stalks; visible long fibres separating from the woody core.
FRAMING: mix — a hand-in-frame detail shot.
TEXT-SAFE ZONE: left side (calmer, shadowed area) — text overlaid directly on the photo here.
TEXT LEGIBILITY: gentle shadow/vignette on the left so overlaid text stays legible; text sits over the image, not a plain block.
RENDER TEXT ON IMAGE: YES — draw this text directly onto the image in the left text-safe zone, clean modern serif headline + smaller sans body, correct spelling, high contrast:
  HEADLINE: "Hidden inside the stalk"
  BODY: "The stalk is left to ret, freeing the long fibres that become linen thread."
ASPECT RATIO: 4:5 vertical (1080 x 1350 px), Instagram carousel.
KEEP the palette, grade and light identical to the other slides in this set.
```

**Slide 4 of 5 — Fibre → Yarn → Fabric (and journey to India)**
```
STYLE: Editorial, natural, grounded, documentary-meets-minimal. Premium but honest, not glossy or over-stylized. Earthy and calm.
PALETTE: undyed flax beige, natural linen cream, warm oat, soft clay/terracotta, muted sage green, raw umber, off-white. Low saturation, warm neutral tones.
LIGHT: soft natural daylight, gentle shadows, morning/golden diffused light.
TEXTURE: emphasise natural fibre texture — visible weave, slubs, raw edges, thread, plant matter, soil, grain of wood and cloth.
MOOD: quiet, curious, authentic, rooted. "Closer to the root."
COMPOSITION: clean, generous negative space (leave room for a text headline), rule-of-thirds, one clear subject per image.
CAMERA: full-frame look, 50mm or 85mm, shallow depth of field on detail shots, wider depth for landscapes. Fine natural grain, no HDR, no plastic sheen.
CONSISTENCY: all images in this set share the same palette, light, and grade so they look like one story.
NEGATIVE: no garbled/random text or gibberish lettering, no watermark, no logos, no distorted hands, no cartoon look, no neon colours, no heavy vignette, no stocky posed smiles, no clutter. (The intentional headline/body under RENDER TEXT is wanted — only avoid unwanted/misspelled text.)
SUBJECT: spools of natural linen yarn beside a piece of woven natural linen fabric with visible weave and slubs.
SETTING: a calm workshop table, soft daylight; a subtle nod to travel (a plain shipping/kraft element) suggesting import to India.
ACTION/DETAIL: texture of thread turning into cloth.
FRAMING: flat-lay top-down.
TEXT-SAFE ZONE: top (plain area of the wooden surface) — text overlaid directly on the photo here.
TEXT LEGIBILITY: subtle darkening of the top surface behind the text so it reads clearly; over the image, not a solid block.
RENDER TEXT ON IMAGE: YES — draw this text directly onto the image in the top text-safe zone, clean modern serif headline + smaller sans body, correct spelling, high contrast:
  HEADLINE: "Thread becomes cloth"
  BODY: "Spun into yarn, woven into fabric, then carried to India to become what you wear."
ASPECT RATIO: 4:5 vertical (1080 x 1350 px), Instagram carousel.
KEEP the palette, grade and light identical to the other slides in this set.
```

**Slide 5 of 5 — Follow CTA (always the last slide)**
```
STYLE: Editorial, natural, grounded, documentary-meets-minimal. Premium but honest, not glossy or over-stylized. Earthy and calm.
PALETTE: undyed flax beige, natural linen cream, warm oat, soft clay/terracotta, muted sage green, raw umber, off-white. Low saturation, warm neutral tones.
LIGHT: soft natural daylight, gentle shadows, morning/golden diffused light.
TEXTURE: emphasise natural fibre texture — visible weave, slubs, raw edges, thread, plant matter, soil, grain of wood and cloth.
MOOD: quiet, curious, authentic, rooted, inviting. "Closer to the root."
COMPOSITION: clean, generous negative space for a bold call-to-action, rule-of-thirds, one clear subject.
CAMERA: full-frame look, 50mm or 85mm, shallow depth of field. Fine natural grain, no HDR, no plastic sheen.
CONSISTENCY: all images in this set share the same palette, light, and grade so they look like one story.
NEGATIVE: no garbled/random text or gibberish lettering, no watermark, no logos, no distorted hands, no cartoon look, no neon colours, no heavy vignette, no stocky posed smiles, no clutter. (The intentional headline/body under RENDER TEXT is wanted — only avoid unwanted/misspelled text.)
SUBJECT: a folded, undyed natural linen shirt resting on a warm neutral surface, calm and inviting, with generous empty space around it.
SETTING: neutral cream backdrop, warm light.
ACTION/DETAIL: simple, beautiful hero shot of the finished cloth — the payoff of the journey.
FRAMING: vertical, product with lots of negative space for the follow CTA.
TEXT-SAFE ZONE: lower-centre / bottom third (calm empty surface) — the "Follow @moolresha" CTA is overlaid here, directly on the photo.
TEXT LEGIBILITY: soft dark gradient scrim across the bottom so the white CTA text is crisp and prominent; text over the image, never on a plain block.
RENDER TEXT ON IMAGE: YES — draw this text directly onto the image in the bottom text-safe zone, bold clean modern serif for the CTA + smaller sans beneath, correct spelling, high contrast:
  HEADLINE: "Follow @moolresha for more"
  BODY: "For the story behind every fabric.  Closer to the Root."
ASPECT RATIO: 4:5 vertical (1080 x 1350 px), Instagram carousel.
KEEP the palette, grade and light identical to the other slides in this set.
```

**C. On-slide text (headline + body — the detailed, appealing, true format)**

1. **Headline:** "What is European Linen?"
   **Body:** The world's finest linen doesn't start in a mill — it starts as a pale blue flower. Here's the journey from a European field to the shirt on your back.
   *Micro-label:* THE QUESTION

2. **Headline:** "It begins as a flower"
   **Body:** Linen comes from flax, a slender plant with delicate blue flowers. The cool, damp coasts of France, Belgium and the Netherlands grow the best flax in the world.
   *Micro-label:* FLAX · ⚠️ verify "best in the world" phrasing before posting

3. **Headline:** "Hidden inside the stalk"
   **Body:** The plant is left in the field to "ret" — natural moisture loosens the stalk so the long, strong fibres inside can be separated. These fibres become linen thread.
   *Micro-label:* THE FIBRE

4. **Headline:** "Thread becomes cloth"
   **Body:** The fibres are spun into yarn and woven into fabric, then carried to India to become what you wear. Linen breathes, keeps you cool, and softens with every wash — exactly why we chose it.
   *Micro-label:* FIBRE → YARN → CLOTH

5. **Headline (Follow CTA — always the last slide):** "Follow @moolresha for more"
   **Body:** We trace every fabric back to its root — the fibre, the field, the reason it feels the way it does. Follow @moolresha for more fibre stories and insights into what you wear.
   *Micro-label:* Closer to the Root.
   *(On-image: render "Follow @moolresha" boldly over the scrim, with "for the story behind every fabric" smaller beneath, and "Closer to the Root." as the sign-off.)*

**D. Caption**
> European linen doesn't begin in a factory. It begins as a pale blue flower in the fields of Northern Europe. 🌾
>
> The flax plant is harvested, left to ret, then its long inner fibres are separated, spun into yarn, and woven into the cloth you know as linen. That cloth travels to India, where it becomes the shirts and everyday pieces we wear through warm months.
>
> Here's the part most people never hear: linen is one of the oldest fabrics known to humans, and a good linen shirt actually gets softer every time you wash it.
>
> We follow linen this far back for a reason — when you know where a fabric begins, you understand how it feels, why it breathes, and why we chose it.
>
> Save this for the next time you shop for linen, and follow @moolresha as we trace every fabric to its root. MoolResha — Closer to the Root.

**E. Hashtags (exactly 10, tiered for max reach)**
`#Linen #Cotton #Fashion #EuropeanLinen #NaturalFibres #SlowFashionIndia #FabricEducation #KnowYourClothes #MoolResha #CloserToTheRoot`

**F. Reel version (~10s per slide, ~50s total)**

- **Format:** vertical 9:16 preferred; the 4:5 images also work. Keep subtitles ON.
- **Hook overlay (first 3s, over Slide 1):** "This shirt started as a flower 🌸"
- **Audio:** calm acoustic / soft ambient — pick a low-key *trending* audio in-app for reach.

| Slide | Time | Motion | Voiceover (read aloud / TTS) |
|-------|------|--------|------------------------------|
| 1 | 0:00–0:10 | slow zoom-in on the flax field | "You've worn linen — but do you know where it begins? Not in a factory. It starts as a pale blue flower, in the fields of Northern Europe." |
| 2 | 0:10–0:20 | gentle push toward a single flower | "This is flax. The cool, damp coasts of France, Belgium and the Netherlands grow some of the finest flax in the world." |
| 3 | 0:20–0:30 | slow pan across drying stalks | "The stalks are left in the field to ret, loosening the long, strong fibres hidden inside — the fibres that become linen." |
| 4 | 0:30–0:40 | parallax over yarn → woven cloth | "Those fibres are spun into yarn, woven into fabric, and carried to India, where they become the pieces you actually wear." |
| 5 | 0:40–0:50 | soft fade to the folded shirt + "Follow @moolresha" CTA on screen, loop back to field | "That's the journey — from a flower in Europe to the shirt you wear. Follow @moolresha for the story behind every fabric. Closer to the root." |

**G. File updates** — see Section 7.

---

## 7. End-of-run file updates (ALWAYS output these)

After producing the carousel, output the exact text to append/change.

**Append to `memory.md`:**
```
| YYYY-MM-DD | European Linen | A (Fibre Origin Journey) | 5 | Posted/Draft |
```

**Change in `topics.md`:** set that topic's Status from `TODO` to `DONE` and add the date.

Then suggest the next 1–2 TODO topics so the user knows what's coming.

---

## 8. REEL SCRIPT archetype (for video posts)

> **Two Reel paths — don't confuse them:**
> - **Quick Reel (default, Part F of every run):** the 5 carousel photos animated at ~10s each (~50s). Already produced automatically with each carousel. Use this for the "turn my 5 photos into a Reel" workflow.
> - **Full Reel script (this §8):** a richer, faster shot-by-shot script (6–9 shots, mixes filmed footage + b-roll). Produce this ONLY when the user explicitly asks for "a Reel script" / "make a Reel" as its own deliverable.

When the user asks for a standalone Reel, produce a **shot-by-shot Reel script**. A Reel is 15–40 seconds, 6–9 shots, one topic, same brand voice and visual DNA.

### 8.1 What to output for a Reel

**A. Reel plan** — 1 line: topic, hook style, target length (sec), number of shots.

**B. Hook (first 2 seconds)** — the single most important part. Give 3 hook options (on-screen text + spoken/voiceover line). The user picks one. A hook must create a curiosity gap ("You've worn linen. But do you know it starts as a *flower*?").

**C. Shot list table** — the core deliverable:

| Shot | Time | Visual (what's on screen) | On-screen text | Voiceover / audio |
|------|------|---------------------------|----------------|-------------------|

- 6–9 shots, each 2–5 seconds.
- "Visual" must reuse the **Brand Visual DNA** (§5.1) — same palette, light, texture. So a Reel and a carousel on the same topic feel like siblings.
- Prefer real footage the user can film cheaply (fabric in hand, flax/plant b-roll, natural light) OR AI/stock clips — note which each shot suggests.
- End on the brand shot + "Closer to the Root."

**D. B-roll shot prompts** — for any shot that needs AI/stock generation, give a full image/video prompt using the §5 formula (Brand Visual DNA + shot content + `ASPECT RATIO: 9:16 vertical (1080 x 1920), Instagram Reel`).

**E. Voiceover script (clean)** — the full VO as one continuous paragraph the user can read into their phone or feed to a TTS tool. 40–70 words for a 30s Reel. MoolResha voice: calm, knowledgeable, honest.

**F. Caption + hashtags** — same as carousel (caption 80–150 words, 12–18 hashtags).

**G. Audio guidance** — suggest a mood (calm acoustic / soft ambient / gentle Indian instrumental) and remind the user to pick a *trending but low-key* audio from Instagram's library for reach; don't name specific copyrighted tracks.

**H. File updates** — append to `memory.md` with format `REEL` in the Archetype column, and flip the topic in `topics.md` (Section 7 rules apply).

### 8.2 Reel structure formula (Hook → Payoff → Loop)

1. **Hook (0–2s):** curiosity-gap question or bold statement + striking visual.
2. **Setup (2–6s):** frame the topic simply.
3. **Body (6–25s):** the journey/answer in 3–5 quick shots (Source → Fibre → Fabric → Feel).
4. **Payoff (25–30s):** the "so that's why it feels/breathes like this" reveal.
5. **Brand close + loop (last 2s):** "Closer to the Root." Optionally mirror the opening visual so the Reel loops smoothly (boosts watch-time).

### 8.3 WORKED EXAMPLE — Reel: "What is European Linen?" (30s, 7 shots)

**A. Plan:** European Linen · curiosity-gap hook · 30s · 7 shots.

**B. Hook options**
1. On-screen: *"This shirt started as a flower."* / VO: "You've worn linen — but do you know where it begins?"
2. On-screen: *"Linen doesn't come from a factory."* / VO: "The coolest fabric for summer starts in a field in Europe."
3. On-screen: *"From flower → to fibre → to you."* / VO: "Here's the journey your linen takes before it reaches you."

**C. Shot list**

| Shot | Time | Visual | On-screen text | Voiceover |
|------|------|--------|----------------|-----------|
| 1 | 0–2s | Wide flax field in pale blue bloom swaying at dawn | "This started as a flower." | "You've worn linen — but do you know where it begins?" |
| 2 | 2–6s | Macro of a single flax flower & slender stalk | "Meet flax." | "It starts as flax, grown in the fields of Northern Europe." |
| 3 | 6–11s | Harvested stalks in long rows on the ground (retting) | "Left in the field." | "The stalks are pulled and left to ret, loosening the fibres inside." |
| 4 | 11–16s | Hand splitting a stalk to reveal long fibres | "Inside: the fibre." | "Hidden in the stalk are long, strong fibres — this is what becomes linen." |
| 5 | 16–22s | Spools of linen yarn → close weave of linen cloth | "Fibre → yarn → cloth." | "The fibres are spun into yarn, then woven into fabric." |
| 6 | 22–27s | Folded natural linen shirt, hands feeling the weave | "Then it reaches India." | "That cloth travels to India, and becomes the pieces you actually wear." |
| 7 | 27–30s | Same flax field as shot 1 (loop) + brand line | "Closer to the Root." | "Now you know what you're wearing. MoolResha." |

**D. B-roll prompts** (for shots you generate instead of film)
> Shot 1 (video/still): [Brand Visual DNA §5.1] SUBJECT: wide field of pale blue-green flax in bloom swaying gently at dawn, low mist. FRAMING: wide landscape, slow push-in. ASPECT RATIO: 9:16 vertical (1080 x 1920), Instagram Reel.
> Shot 4: [Brand Visual DNA] SUBJECT: a hand splitting a dried flax stalk to reveal long pale fibres, macro, warm oat tones. FRAMING: close macro, vertical. ASPECT RATIO: 9:16 vertical.

**E. Voiceover (clean, ~55 words)**
> "You've worn linen — but do you know where it begins? It starts as flax, grown in the fields of Northern Europe. The stalks are left to ret, then the long fibres inside are separated, spun into yarn, and woven into cloth. That cloth reaches India and becomes the pieces you wear. Now you know. MoolResha — closer to the root."

**F. Caption**
> Every linen shirt starts somewhere far from your wardrobe — in a field of pale blue flax flowers in Northern Europe. 🌾
>
> Harvested, retted, spun, woven, and finally brought to India, linen travels a long way before it becomes something you wear. We follow it back to the root because knowing where a fabric begins is how you understand why it feels and breathes the way it does.
>
> Follow @moolresha for more fibre stories. Closer to the Root.

**G. Hashtags**
`#MoolResha #CloserToTheRoot #Linen #EuropeanLinen #FlaxToFabric #FibreStory #NaturalFibres #ReelsIndia #SlowFashionIndia #FabricEducation #KnowYourClothes #LinenClothing #TextileStory #IndianFashion #ConsciousClothing`

**H. Audio:** calm acoustic or soft ambient; pick a low-key trending audio from Instagram's library for reach.

**File update:** `| YYYY-MM-DD | European Linen | REEL | 7 shots | Draft |`

---

## 9. Cadence helper

Target: 2–3 posts/week. If the user says "give me this week's batch," run the skill on the top TODO topics, each as a separate full carousel (or Reel if requested), and update files for all of them. A good weekly mix: 2 carousels + 1 Reel.
