# ParentMarry Aesthetic Tooling Reference

Updated: 2026-05-21

This project should feel like a quiet, trustworthy parent-facing utility, not a mascot-led dating app. The current design direction is minimal but not empty: clear hierarchy, careful spacing, restrained color, real workflow density, and no animal illustration system from WorthMatch.

## Design Rules From The Reference Post

- Avoid heavy shadows. Prefer borders, spacing, and surface contrast for hierarchy.
- Avoid complex gradients. Use solid colors first; use motion and type rhythm for polish.
- Keep the palette small: ink, warm paper, one trust accent, one attention accent, one info accent.
- Use motion only to clarify state changes: loading, selection, publish confirmation, recommendation transitions.
- Do not copy decorative effects blindly. Every borrowed component must be simplified and mapped into ParentMarry tokens.

## Tool Map

| Tool | Current status | Best use in this project | How to use later |
| --- | --- | --- | --- |
| [21st.dev Magic MCP](https://github.com/21st-dev/magic-mcp) | Official MCP exists. Requires a 21st.dev API key and is installed through `@21st-dev/cli` or manual MCP config. | Generate or refine isolated React components, especially onboarding cards, profile review panels, and recommendation cards. | `npx @21st-dev/cli@latest install <client> --api-key <key>` or add `@21st-dev/magic` to MCP config. Treat output as draft code, then adapt to our CSS tokens. |
| [Impeccable](https://github.com/pbakaus/impeccable) | Installable AI design skill plus standalone CLI detector. Not currently in this session's active skill list. | Run design critique/polish passes after major UI changes, especially to catch AI-looking defaults. | Download/copy the Codex bundle from the repo or `impeccable.style`: repo-local installs use `.agents/skills/` and `.codex/agents/`; user-wide installs use `~/.agents/skills/` and `~/.codex/agents/`. After installation, use `$impeccable` or the skill commands. For static checks: `npx impeccable detect . --fast --json`. |
| [Uiverse](https://uiverse.io/) | Web library; no official MCP/CLI found. Provides copyable HTML/CSS, Tailwind, React, and Figma elements. | Buttons, toggles, loaders, empty states, and micro-interaction ideas. | Browse, copy the smallest useful pattern, remove heavy effects, and rewrite into local class names. Use Kimi WebBridge if interactive browsing is needed. |
| [Coolors](https://coolors.co/) | Web palette generator; no official MCP/CLI found. | Explore palettes and contrast before committing tokens. | Use generator/export manually. Keep 4-5 tokens only; do not bring over a full palette. |
| [Swishy AI](https://www.swishy.ai/) | Web motion generator; no official MCP/CLI found. | Motion references for onboarding, publish success, and recommendation transitions. | Generate or inspect motion ideas, then rebuild as CSS/React transitions with reduced-motion support. |
| [Mobbin](https://docs.mobbin.com/) | Official remote MCP and REST API exist. MCP is for AI coding agents; API is for custom integrations. Access depends on plan. | Real app flow references: onboarding, profile editing, recommendation lists, admin tables. | If the account supports it, connect Mobbin MCP. Otherwise use browser/Kimi and collect screenshots/notes manually. |
| [Pinterest](https://help.pinterest.com/en/article/discover-ideas-on-pinterest) | Web search/inspiration; no useful project CLI/MCP found. | Broad mood discovery with queries like `minimal matchmaking app`, `family profile app`, `trust dashboard design`. | Use as a visual search surface, not a component source. Kimi WebBridge is useful when login/session matters. |
| [Godly](https://godly.website/) | Web gallery. | High-end web rhythm, typography, and section composition. | Use as reference for restraint and density; avoid copying cinematic effects into the app UI. |
| [Awwwards](https://www.awwwards.com/) | Web awards/gallery. | Creative references and interaction patterns. | Good for taste calibration; filter out heavy animation that hurts mobile utility. |
| [Supahero](https://supahero.io/) | Web hero-section library, now part of Screens Design. | Landing/first-screen structure references if ParentMarry later gets a marketing page. | Use structure only; current MVP should still open directly into the product workflow. |
| [UiPocket](https://uipocket.com/) | Web UI kit/free design resource; no official MCP/CLI found. | Mobile app kit references and screen structure ideas. | Use as rough inspiration only; many examples need simplification and accessibility review. |
| 60fps micro-animation references | No single canonical tool. | Interaction details: tap feedback, list item entrance, stepper progress. | Implement locally with CSS transitions around 160-240ms, no bounce by default, and respect `prefers-reduced-motion`. |
| [OpenCLI](https://github.com/jackwener/opencli) | Active GitHub project with CLI/browser bridge and agent skills. Not a design source, but useful for automating websites without clean APIs. | Turn browser-only reference sites into repeatable commands or adapters, especially for collecting inspiration data. | Requires Node >= 21 and Chrome/Chromium. Install `@jackwener/opencli`, then `npx skills add jackwener/opencli`; use browser commands or write adapters for recurring reference workflows. |
| Kimi WebBridge | Installed and verified healthy locally: daemon running, browser extension connected. | Fallback for authenticated or browser-only research sites. | Use `navigate`, `snapshot`, `screenshot`, and `network` through the local daemon. Close sessions after research. |

## Suggested Design Upgrade Loop

1. Pick one surface: login, profile wizard, AI review, recommendation detail, match list, or admin dashboard.
2. Collect 3-5 references from Mobbin/Godly/Awwwards/Supahero/Pinterest. Save source URL and note the specific pattern, not just the page.
3. Use Coolors to test a small token palette, then commit tokens in CSS before changing components.
4. Pull only narrow component ideas from 21st/Uiverse. Rewrite styles into our tokens and remove gradients, glow, deep shadows, nested cards, and tiny unreadable text.
5. Add one purposeful motion detail if it clarifies state. Use Swishy only as a motion sketch source.
6. Run an Impeccable polish/audit pass when available, then verify with screenshots at mobile and desktop widths.

## Current ParentMarry Visual Baseline

- Product name shown to users: `爸妈牵线`; `ParentMarry` stays as the English project name.
- Brand mark: Chinese character `牵`, not a character or animal mascot.
- Surfaces: native-app gray background, white cell groups, hairline borders.
- Accents: WeChat-style green for primary state, restrained orange for task labels, blue for explanation panels.
- Components: dense enough for real workflows; use cells and grouped panels over decorative cards.
- Motion target: subtle, mostly on state changes; no bounce or decorative loops.

## Research Pass: Chinese Parent-Facing Mobile UI

Updated: 2026-05-21

The first redesign still looked too much like an English SaaS mockup. For a parent-facing Chinese H5 or mini-program style app, the better baseline is closer to WeChat-native utility products than to gallery websites.

Useful references:

- [WeUI](https://github.com/Tencent/weui): WeChat official design team's mobile web library, built to match WeChat-like user experience. Use its mental model: cells, buttons, toasts, action sheets, dialogs, and progress.
- [WeUI for Mini Program](https://github.com/Tencent/weui-wxss): same direction for 小程序, useful for `rpx`/mobile density thinking.
- [Ant Design Mobile](https://mobile.ant.design/zh/): good reference for mobile-first form, list, tab, and feedback patterns in Chinese products.
- [TDesign](https://tencent.github.io/tdesign/): Tencent design system with mobile and WeChat MiniProgram component libraries; useful for Chinese enterprise/product utility tone.
- [Mobbin MCP & API](https://docs.mobbin.com/): still the best next step for real app flow references when account access is available.

Product direction after this research:

- Keep the visible app name Chinese: `爸妈牵线`. Leave `ParentMarry` as project/package name.
- Use a WeChat-like palette: neutral app background, white cell groups, hairline borders, WeChat green primary action.
- Prefer cells over decorative cards. Parent users should see obvious rows and next actions.
- Use smaller, calmer titles. Avoid oversized hero type and English labels like `Profile / AI / Match`.
- Write in parent-friendly Chinese: `孩子资料`, `公开介绍`, `今日推荐`, `沟通进展`.
- Avoid design-gallery patterns from Awwwards/Godly/Supahero inside the product shell; those are better for marketing pages, not this utility flow.

## Decision: Drop Showcase Mode, Ship Warm Light Production

Updated: 2026-05-21

The earlier "Showcase Mode" pass (cinematic dark stage, aurora background, glass surfaces, neon green/cyan/violet palette, rotating radar, floating profile cards, oversize 950-weight type, English eyebrows) looked impressive in a screenshot but felt nothing like a real app. For a parent-facing (40-65) Chinese matchmaking utility it read as cold and "not a serious product." We removed it.

The shipped user-app now uses a **warm light, trust-first** direction:

- Palette (tokens in `apps/user-app/src/styles.css`): warm paper background `#FAF8F4`, white surfaces, hairline borders `#ECE7E0`, ink text `#1F1B18`, single coral trust accent `#C8553D`, plus restrained gold (attention) and green (success) tints.
- Structure: WeChat/WeUI-style cell groups and grouped panels over decorative cards; clear rows, obvious next actions.
- Shadows kept very light (hairline border + faint shadow, never both heavy); no gradients on buttons; no glassmorphism, aurora, scanline, or sheen.
- Typography calmer: titles ~19-24px at weight 600-700, body 14-15px; all-Chinese labels, no English jargon.
- `framer-motion` retained but reduced to subtle fades and `whileTap` feedback; removed all infinite-loop animations; `prefers-reduced-motion` honored.

This realizes the "微信原生浅色工具风" baseline documented above. Galleries (Awwwards/Godly/Supahero) stay reserved for a future marketing page, not the product shell. Mobbin/TDesign/Ant Design Mobile/WeUI remain the right references for in-product flow work; Mobbin programmatic access may need a paid plan, so use Kimi WebBridge for browser-only reference collection.
