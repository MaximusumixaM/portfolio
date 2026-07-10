# Max Nobell-Cluff — Portfolio

Max is an interaction designer, and this repo is his website — part personal site, part design portfolio. The current content and structure were imported from an old site and are throwaway scaffolding used to exercise the dev pipeline; expect the design and content to be substantially revamped rather than incrementally extended from what's here.

Stack: [Astro](https://astro.build), TypeScript, React (via `@astrojs/react`) for interactive pieces, Tailwind v4, and a token-based design system named **Peduncle**.

## Project structure

```text
/
├── src
│   ├── assets/images/       # project photos, thumbnails, social icons
│   ├── components
│   │   ├── peduncle/        # design system primitives (Button, Dialog, Tabs, Typography)
│   │   ├── app/             # app-specific components built on Peduncle (ProjectCard, SiteNav, ...)
│   │   └── lib/utils.ts     # `cn()` — clsx + tailwind-merge, token-aware
│   ├── data/                # project & site content, plus the astro:assets → React image resolver
│   ├── layouts/Layout.astro
│   ├── pages/index.astro    # resolves data, renders the PortfolioApp React island
│   ├── styles/tokens/       # base.css (raw values) → semantic.css (theme-aware) → global.css (Tailwind-facing)
│   └── types/
└── package.json
```

See [`.claude/rules/design-system.md`](.claude/rules/design-system.md) for the Peduncle token architecture and component conventions, and [`.claude/rules/code-style.md`](.claude/rules/code-style.md) / [`.claude/rules/typescript-conventions.md`](.claude/rules/typescript-conventions.md) for coding conventions.

## Commands

All commands are run from the root of the project, from a terminal:

| Command             | Action                                            |
| :------------------ | :------------------------------------------------ |
| `npm install`       | Installs dependencies                             |
| `npm run dev`       | Starts local dev server at `localhost:4321`       |
| `npm run build`     | Builds the production site to `./dist/`           |
| `npm run preview`   | Previews the build locally, before deploying      |
| `npm run check`     | Type-checks the project (`astro check`)           |
| `npm run lint`      | Lints the project with ESLint                     |
| `npm run format`    | Formats the project with Prettier                 |
| `npm run astro ...` | Runs CLI commands like `astro add`, `astro check` |

When running the dev server via an agent/CLI session, start it in background mode (`astro dev --background`) and manage it with `astro dev stop`, `astro dev status`, and `astro dev logs`.

## Documentation

Full documentation: <https://docs.astro.build>

Relevant guides:

- [Adding pages, dynamic routes, or middleware](https://docs.astro.build/en/guides/routing/)
- [Working with Astro components](https://docs.astro.build/en/basics/astro-components/)
- [Using React, Vue, Svelte, or other framework components](https://docs.astro.build/en/guides/framework-components/)
- [Adding or managing content](https://docs.astro.build/en/guides/content-collections/)
- [Adding styles or using Tailwind](https://docs.astro.build/en/guides/styling/)
- [Supporting multiple languages](https://docs.astro.build/en/guides/internationalization/)
