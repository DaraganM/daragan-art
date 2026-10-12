# DARAGAN

[![CI](https://github.com/DaraganM/daragan-art/actions/workflows/ci.yml/badge.svg)](https://github.com/DaraganM/daragan-art/actions/workflows/ci.yml)
[![Code: MIT](https://img.shields.io/badge/code-MIT-blue.svg)](LICENSE)
[![Artwork: all rights reserved](https://img.shields.io/badge/artwork-all%20rights%20reserved-lightgrey.svg)](LICENSE-ARTWORK.md)

Portfolio and commissions website for the artist Mykhailo Daragan, live at **[daragan.art](https://daragan.art)**.

<p>
  <img src="docs/img/home-desktop.webp" alt="The home page on a desktop screen" width="640">
  <img src="docs/img/home-mobile.webp" alt="The home page on a phone" width="190">
</p>

## The brief

An artist with a physics background needed a professional online presence that shows the work, turns visitors into commission requests, and can grow into a shop later, with fixed running costs close to the price of a domain name.

## What was built

A static-first site served from Cloudflare's edge, plus **one** small Worker for the commission form. There is no database, no always-on server and no third-party mail or form service.

| Layer | Choice |
|---|---|
| Site | [Astro](https://astro.build) with static output, hand-written CSS, no client-side framework |
| Hosting | Cloudflare Workers Static Assets on a custom domain |
| Commission form | One Worker: validation, honeypot, Cloudflare Turnstile, delivery by e-mail through Cloudflare Email Routing |
| Domain and DNS | Porkbun registrar, Cloudflare DNS |
| Quality gates | GitHub Actions (build, Worker dry run, secret scan) and Dependabot |
| Fixed cost | About $21 a year (the domain renewal). Hosting, e-mail and spam protection run on free tiers |

```mermaid
flowchart LR
  V[Visitor] -->|pages, CSS, images| A[Cloudflare edge: static assets]
  V -->|POST /api/commission| W[Worker]
  W -->|verifies the token| T[Turnstile]
  W -->|send_email binding| R[Email Routing]
  R --> M[Owner mailbox]
```

## Design principles

- **Design for extension, build for today's scale, pay only for today's scale.**
- **Cost gate.** No external service is added without answering why it is needed, what the free option and its limit are, what triggers an upgrade, how to migrate away and how locked in the project would be. Every choice is recorded in [docs/decisions.md](docs/decisions.md).
- **No premature infrastructure.** No databases, queues or microservices until a measured need exists.
- **Secrets stay out of Git.** They live in the Worker secret store, and the owner's mailbox never appears in the repository.

## Features

- Home page with hero, selected work, categories, commission process and about section.
- Commissions page with a request form: server-side validation, honeypot, Turnstile check, delivery by e-mail.
- Responsive from 320 px, visible keyboard focus, reduced-motion preference respected.
- SEO basics: canonical URLs, Open Graph and Twitter cards, sitemap, robots.txt.
- Security headers, including a restrictive Content Security Policy ([`public/_headers`](public/_headers)).
- One stylesheet of about 500 lines ([`src/styles/global.css`](src/styles/global.css)) with no `!important` and non-overlapping viewport ranges.

## Run it locally

Requires Node.js 22.12 or newer.

```bash
npm ci
npm run dev            # the site only; the form needs the Worker

cp .dev.vars.example .dev.vars
npm run cf:dev         # site and Worker together, with the form
```

## Deploy

[docs/deploy.md](docs/deploy.md) covers the one-time Cloudflare setup, secrets, releases and rollback.

## Content

- **Works:** add web-sized WebP files to `public/works/`, an entry to `src/data/works.json` and a `.work-card-<slug>` rule (grid area) to `src/styles/global.css`. Delete files that are no longer used, because everything in `public/` is deployed.
- **Social links:** `src/data/social.json`.

## Repository layout

```text
.
├── src/
│   ├── pages/              home, commissions, thanks, 404
│   ├── layouts/Base.astro  page shell, meta tags, footer
│   ├── components/         SocialLinks
│   ├── data/               works.json, social.json
│   └── styles/global.css   the only stylesheet
├── public/                 static files: works/ (WebP), _headers, robots.txt, icons
├── worker/index.js         the only server-side code: POST /api/commission
├── docs/                   decision log, deploy runbook, screenshots
├── wrangler.jsonc          Cloudflare configuration (no secrets)
└── .github/                CI workflow, Dependabot
```

## Roadmap

- [ ] German, Ukrainian and Russian versions
- [ ] Online orders and payments for prints and originals
- [ ] Lighthouse and accessibility checks in CI

## Licence and credits

Code: [MIT](LICENSE). Artwork, photographs and the DARAGAN name: Copyright (c) 2026 Mykhailo Daragan, all rights reserved ([details](LICENSE-ARTWORK.md)). Social icons: [Simple Icons](https://simpleicons.org), CC0.
