## About this project

Max Nobell-Cluff is an interaction desginer, and this is his website — part personal site, part design portfolio. See `.claude/rules/` for the coding conventions being layered in as the project grows.

The current content/structure (imported from an old site) is throwaway scaffolding used to exercise the dev pipeline — expect it to be substantially revamped, don't treat it as a model to preserve or extend from.

Target stack: Astro, TypeScript, React (via `@astrojs/react`) for interactive pieces, Tailwind, and a token-based design system named **Peduncle** (see `.claude/rules/design-system.md` — none of it exists yet; that file documents the target architecture to build toward).

## Development

When starting the dev server, use background mode:

```
astro dev --background
```

Manage the background server with `astro dev stop`, `astro dev status`, and `astro dev logs`.

## Documentation

Full documentation: https://docs.astro.build

Consult these guides before working on related tasks:

- [Adding pages, dynamic routes, or middleware](https://docs.astro.build/en/guides/routing/)
- [Working with Astro components](https://docs.astro.build/en/basics/astro-components/)
- [Using React, Vue, Svelte, or other framework components](https://docs.astro.build/en/guides/framework-components/)
- [Adding or managing content](https://docs.astro.build/en/guides/content-collections/)
- [Adding styles or using Tailwind](https://docs.astro.build/en/guides/styling/)
- [Supporting multiple languages](https://docs.astro.build/en/guides/internationalization/)
