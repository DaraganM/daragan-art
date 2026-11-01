# Decision log

Why the site is built the way it is, and what each choice costs. Every decision has the same shape: context, options, decision, consequences.

Prices and limits were checked between August and October 2026 against vendor documentation or price-comparison data. They change, so re-check before relying on them.

## Principles

1. **Design for extension, build for today's scale, pay only for today's scale.** The architecture leaves room for a shop and for more artists. The infrastructure matches today's traffic and revenue.
2. **Cost is a requirement.** The target for fixed costs in the first 12 months is EUR 30-100 a year, with a hard cap of EUR 150. Payment fees, taxes and advertising are excluded. The only unavoidable recurring cost is the domain.
3. **Cost gate.** Before an external service is added, answer: why is it needed, can the project live without it, what is the free option and its limit, what usage triggers an upgrade, how would we migrate away, how locked in are we. No paid service is switched on without an explicit decision.
4. **No premature infrastructure.** No Kubernetes, message queues, search clusters, microservices, dedicated database servers or multi-region setups until a measured need exists. If a backend becomes necessary it starts as a modular monolith, and a service is split out only for a concrete reason: load, different scaling needs, team ownership, a security boundary or failure isolation.

## Summary

| Area | Choice | Fixed cost | Upgrade trigger | Lock-in |
|---|---|---|---|---|
| Domain | daragan.art at Porkbun | about $21 a year after the promotional first year | none | low, domains transfer between registrars |
| DNS, CDN, hosting | Cloudflare Workers Static Assets | $0 | more than 100,000 Worker requests a day (static files do not count) | medium |
| Commission e-mail | Cloudflare Email Routing | $0 | a need to e-mail customers (confirmations, receipts) | low |
| Spam protection | Cloudflare Turnstile plus a honeypot | $0 | more than 20 widgets, or 10 hostnames on a widget | low |
| Source and CI | GitHub, public repository | $0 | none | low |

## ADR-1: A static-first site with one Worker

**Context.** The site mostly shows images and text. The only dynamic need is a commission request form. Traffic is small and uneven.

**Options.** A managed site builder; a CMS on a server; a server-rendered framework with a database; a static site plus a single function for the form.

**Decision.** A static site plus one Worker. Pages are built ahead of time and served from the CDN. The Worker handles the form.

**Consequences.** Nothing runs when nobody visits, so there is no idle cost and the attack surface is small. Content changes need a rebuild and a deploy, which suits a portfolio. Orders, accounts and payments will need a database; that arrives with the shop stage and passes the cost gate then.

## ADR-2: Astro

**Options.** Astro, Next.js with static export, Hugo.

| | Astro | Next.js (static export) | Hugo |
|---|---|---|---|
| Image-heavy pages | ships almost no JavaScript by default | more client JavaScript unless managed | no JavaScript by default |
| Path to dynamic features | add server routes or an adapter without changing framework | smooth if planned from the start | needs a different stack |
| Learning curve | moderate | moderate to high | low, but Go templates are unfamiliar to most front-end developers |

**Decision.** Astro.

**Consequences.** Images are pre-sized WebP files (640 and 1200 px) served with `srcset`. The framework's build-time image pipeline can replace them later without touching the pages.

## ADR-3: Cloudflare Workers Static Assets for hosting

**Options.** Cloudflare Workers with static assets, Cloudflare Pages, Netlify, Vercel.

| Option | What matters | Fit |
|---|---|---|
| Workers Static Assets | Requests to static assets are free and unlimited. Worker code runs on 100,000 requests a day on the free plan | Static files and the form endpoint ship as one versioned deployment |
| Cloudflare Pages | Same static-asset terms, with the form endpoint as a separate Functions setup | Works, with two moving parts |
| Netlify | A usage-credit model and built-in form handling | Convenient forms, a different billing model |
| Vercel | The free Hobby plan is for non-commercial use | Not suitable for a business that sells commissions |

**Decision.** Workers Static Assets. The whole site and its one API route are a single deployment with versioned releases and an instant rollback. The custom domain is bound in the same configuration file.

**Consequences.** The static output is portable to any static host. The Worker (about 120 lines) uses a Cloudflare-specific e-mail binding, so moving away means replacing that one file.

## ADR-4: E-mail through Cloudflare Email Routing

**Options.** Cloudflare Email Routing with a send binding; a transactional e-mail provider (Resend, Mailgun, SendGrid); a hosted form service.

**Decision.** Email Routing. The Worker sends each request to a mailbox that is verified in the Cloudflare account. The binding may send to any verified destination and only from `commissions@daragan.art`. The mailbox address is stored as the `NOTIFY_EMAIL` secret.

**Consequences.** No extra account, API key or monthly fee, and sending to a verified mailbox is free. The limit is deliberate: the Worker cannot send automatic confirmations to customers, because customers are not verified destinations. When confirmations or receipts are needed, the cost gate is run again for a transactional provider.

## ADR-5: Spam protection with Turnstile and a honeypot

**Options.** No protection; Google reCAPTCHA; hCaptcha; Cloudflare Turnstile.

**Decision.** Turnstile, verified on the server inside the Worker, plus a hidden honeypot field. The free plan includes unlimited challenges, up to 20 widgets and 10 hostnames per widget. The secret key is a Worker secret. The site key is public by design.

**Consequences.** No puzzles for visitors and no advertising trackers. One more Cloudflare dependency, replaceable by another CAPTCHA provider by changing the widget script and one request in the Worker.

## ADR-6: Domain at Porkbun

**Context.** `.art` domains are cheap in the first year and more expensive to renew.

**Data.** Renewal prices in an August 2026 comparison: Porkbun about $21, Namecheap about $33, GoDaddy about $40. First-year promotions are roughly $2-4 at most registrars.

**Decision.** Porkbun as registrar, DNS at Cloudflare.

**Consequences.** The fixed cost to plan for is the renewal price, not the promotion.

## ADR-7: Secrets and personal data in a public repository

**Decision.**

- Secrets (`TURNSTILE_SECRET`, `NOTIFY_EMAIL`) exist only in Cloudflare's secret store and, for development, in the untracked `.dev.vars`. `wrangler.jsonc` lists them as required, so a deploy fails with a clear message if one is missing.
- The public contact address is a role address (`hello@daragan.art`) that forwards to the owner's mailbox. The real mailbox is never committed.
- Commits use GitHub's no-reply address, so the owner's e-mail is not embedded in the history.
- CI scans every push and pull request for secrets with gitleaks. GitHub's own push protection blocks known token formats but cannot recognise every kind of secret, so it is a second layer.
- Artwork is published as web-sized files under a separate all-rights-reserved notice ([LICENSE-ARTWORK.md](../LICENSE-ARTWORK.md)).

## ADR-8: CI and releases

**Decision.** CI runs on every push and pull request: build, a Worker bundle dry run that validates `wrangler.jsonc`, and a secret scan. Dependabot proposes npm updates weekly and GitHub Actions updates monthly. Deployment is manual (`npm run deploy`), so no cloud credentials are stored in GitHub.

**Consequences.** One manual step per release. Revisit if more people publish changes.

## ADR-9: Visual Thinking and Lab as data-driven sections

**Context.** The site began as an art portfolio with a commission form. It now also has to show technical competence and visual communication to employers, without turning into a generic developer portfolio.

**Options.** One long portfolio page; a separate developer site; two new sections on the existing site.

**Decision.** Two sections on the existing site. Visual Thinking presents selected drawings as short case studies. Lab presents Python, data and AI experiments, each marked as own project, exploration or fork. Both are driven by JSON files and one card component each, so adding an entry means adding data and image files ([content guide](content-guide.md)).

**Consequences.** Honest labelling is enforced by the build: it fails when a fork has no upstream credit, when ownership is missing or when an image is missing. The Lab launches with one clearly labelled open-source study and says so, and grows as original projects exist. No new framework, service or dependency.

## Growth path

| Stage | Scope | Gate to enter |
|---|---|---|
| 1 (live) | Portfolio and commission requests | none |
| 2 | Online orders, payments, customer area, prints and originals | steady commission volume |
| 3 | A platform for several artists | demand from other artists |
| 4 | A marketplace | a proven business model |

When a backend arrives it starts as one modular application with clear boundaries (users, artworks, commissions, orders, payments, messaging, reviews). Services are split out only under the conditions in principle 4.
