---
name: project-demos (ejorr on black)
description: EJ Orr's portfolio page on GitHub Pages, on Ethan's ejorr brand. assets/tokens.css, components.css, blueprint.svg and the sky PNGs are unchanged copies from ~/.claude/skills/brand/assets.
---

## Overview

A one-page portfolio for internship recruiters (see PRODUCT.md), on the ejorr
brand forced to dark with a pure black ground (`data-theme="dark"` plus a
token override in index.html): white text, DeepSeek blue accents, no sky
panels, glass cards or theme toggle. Each project is a name, a GitHub button
and one demo in a 16:10 frame with a blue hairline.
Headlines are Outfit 500; everything else is Fragment Mono (one weight).
DeepSeek blue is the only accent.

The brand skill is the source of truth for tokens and rules
(`~/.claude/skills/brand/SKILL.md` and `references/`). Don't restate values here.

## Page-specific decisions

- terrain's demo is an inline SVG diagram so it picks up the page fonts and tokens;
  swap it for a recording once one exists.
- Favicons (`assets/icons/`) and `assets/og.png` come from `gen_pattern.py favicon` / `og`.

## Do's and Don'ts

- Don't use solid button fills; primary is `.btn--primary`, secondary `.btn--link`.
- Don't use bold or italic body text; emphasis is `--link` colour.
- Don't define a colour that isn't in `tokens.css`.
- Do fix shared CSS in the brand skill and re-copy it here.
