# Deployment runbook

## Requirements

- Node.js 22.12 or newer
- A Cloudflare account with `daragan.art` added as a zone
- Wrangler, which `npm ci` installs

## One-time setup

1. **Domain.** Register the domain, set Cloudflare's nameservers at the registrar and wait until the zone is active.
2. **Email Routing.** Enable Email Routing for the domain. Add the owner's mailbox as a destination address and confirm the verification e-mail. Create a rule that forwards `hello@daragan.art` to that mailbox.
3. **Turnstile.** Create a widget for `daragan.art`. Put its site key into `src/pages/commissions.astro` (the production value) and keep its secret key for the next step.
4. **Secrets.**

   ```bash
   npx wrangler login
   npx wrangler secret put TURNSTILE_SECRET   # the widget's secret key
   npx wrangler secret put NOTIFY_EMAIL       # the verified mailbox that receives requests
   npx wrangler secret list                   # both names should appear
   ```

`wrangler.jsonc` declares both secrets as required, so `wrangler deploy` stops with a message naming any that are missing.

## Release

```bash
npm ci
npm run build
npm run deploy        # astro build && wrangler deploy
```

## Verify

1. Open https://daragan.art in a private window.
2. Send a test commission request. The e-mail should arrive and the Turnstile check should pass.
3. Check that `/sitemap-index.xml` and `/robots.txt` respond.

## Roll back

```bash
npx wrangler rollback
```

This returns to the previous version. The dashboard offers the same under Workers & Pages, the `daragan` Worker, Deployments.

## Local development

```bash
cp .dev.vars.example .dev.vars
npm run cf:dev         # builds the site and runs the Worker on http://localhost:8787
```

`.dev.vars` is ignored by Git. Wrangler loads only the keys listed in `secrets.required`, so keep the names in `.dev.vars` identical to the ones above. The example file uses Cloudflare's public test secret for Turnstile, which accepts the matching test site key that development builds use.

## Optional: deploy from GitHub

Connect the repository with Workers Builds in the Cloudflare dashboard. Use `npm run build` as the build command and `npx wrangler deploy` as the deploy command. Secrets stay in Cloudflare.

## Troubleshooting

- **The form shows an error.** Run `npx wrangler secret list`; both secrets must exist. Check that the Turnstile widget allows the hostname and that the mailbox is verified in Email Routing.
- **Old content after a release.** Hard-refresh the page. Files in `/_astro/` are content-hashed, and `/works/` images are cached for up to seven days.
