---
name: project-demos (ejorr clear glass)
description: EJ Orr's portfolio page on GitHub Pages, on Ethan's ejorr brand. assets/tokens.css, components.css, blueprint.svg and the sky PNGs are unchanged copies from ~/.claude/skills/brand/assets.
---

## Overview

A one-page portfolio for internship recruiters (see PRODUCT.md), on the ejorr
brand: each section is a `.sky` panel with the baked cloud image, content sits
on frosted `.glass` cards, pictures are blueprint drawings on navy `.tile`s.
Headlines are Outfit 500; everything else is Fragment Mono (one weight).
DeepSeek blue is the only accent.

The brand skill is the source of truth for tokens and rules
(`~/.claude/skills/brand/SKILL.md` and `references/`). Don't restate values here.

## Page-specific decisions

- The sky image is set on `.sky` directly in index.html, not through
  `--sky-img`: Chrome resolves a `url()` inside a custom property against the
  stylesheet that uses it (`assets/components.css`), which breaks the path.
- Hero picture: `assets/hero.svg`, from
  `gen_pattern.py sheet --drawing node --project ~/cs/cirrocumulus --section Node --sheet 1/3`.
  Regenerate it when cirrocumulus moves on; the title block carries its commit.
- Icons: `i-cloud` (cirrocumulus), `i-database` (strata), `i-chip` (terrain).
- Favicons (`assets/icons/`) and `assets/og.png` come from `gen_pattern.py favicon` / `og`.

## Do's and Don'ts

- Don't use solid button fills; primary is `.btn--primary`, secondary `.btn--link`.
- Don't put `--dim` text straight on a sky panel; it goes on glass.
- Don't use bold or italic body text; emphasis is `--link` colour.
- Don't define a colour that isn't in `tokens.css`.
- Do fix shared CSS in the brand skill and re-copy it here.
