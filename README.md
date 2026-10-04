# bento.cat

[![Checks](https://github.com/tinsever/bento.cat/actions/workflows/checks.yml/badge.svg)](https://github.com/tinsever/bento.cat/actions/workflows/checks.yml)

A cat-inspired home for your links, photos, notes, and more. Build a personal page from rearrangeable tiles, claim a handle, and share your corner of the internet.

Built with SvelteKit, Svelte 5, Convex, Clerk, and Bun. The project is under active development.

## Features

- A visual tile editor with links, photos, video, maps, and interactive tiles.
- Personal pages with shareable handles and a community directory.
- Email-code and Google sign-in through Clerk.
- Media uploads with ownership checks, quotas, and cleanup.
- Revision checks and local recovery drafts for interrupted edits.
- Account export and deletion, including stored media cleanup.

## Local setup

Use **Bun 1.4.2** and **Node.js 24**. Bun installs dependencies and builds the app; Vitest runs on Node.js. You also need your own [Convex](https://www.convex.dev/) deployment and [Clerk](https://clerk.com/) application.

```sh
git clone https://github.com/tinsever/bento.cat.git
cd bento.cat
bun install --frozen-lockfile
cp .env.example .env.local
bun run convex
```

Keep Convex running. It generates the backend API files and writes the deployment URL to `.env.local`.

In Clerk, enable email codes and Google sign-in, then create the `convex` JWT template. Set `VITE_CLERK_PUBLISHABLE_KEY` in `.env.local` and configure the matching Convex deployment:

```sh
bunx convex env set CLERK_JWT_ISSUER_DOMAIN https://YOUR_CLERK_FRONTEND_API
```

In another terminal:

```sh
bun run dev
```

Use the local URL printed by Vite. Credentials and real environment files stay out of Git.

### Configuration

| Variable | Where to set it | Purpose |
| --- | --- | --- |
| `PUBLIC_CONVEX_URL` | `.env.local` or frontend build environment | Convex query and mutation endpoint, normally ending in `.convex.cloud`. |
| `PUBLIC_CONVEX_SITE_URL` | `.env.local` or frontend build environment | Optional HTTP action endpoint; required for custom or self-hosted deployments. Normally ends in `.convex.site`. |
| `VITE_CLERK_PUBLISHABLE_KEY` | `.env.local` or frontend build environment | Clerk's public browser key; use a development instance locally. |
| `PUBLIC_GOOGLE_SIGN_IN_ENABLED` | Frontend build environment | Set to `false` until production Google OAuth credentials are configured. Defaults to `true` locally. |
| `CLERK_JWT_ISSUER_DOMAIN` | Convex environment | Issuer for Clerk's `convex` JWT template. |
| `CLERK_SECRET_KEY` | Convex environment | Backend credential used for account deletion. |
| `CLERK_WEBHOOK_SIGNING_SECRET` | Convex environment | Verifies Clerk webhook signatures. |

Set the backend credentials on the Convex deployment with `bunx convex env set`. Configure Clerk's `user.deleted` webhook to point to `https://YOUR_DEPLOYMENT.convex.site/clerk-webhook`. Set both deletion credentials and the webhook before testing account deletion. Backend secrets must never become public frontend variables.

### Demo content

With Convex running, upload the included cat photos and create the example pages:

```sh
bun run seed
```

Seeding uses your configured Convex deployment. Running it again refreshes demo pages and replaces demo assets; it leaves real users' pages alone. Photo attribution is in [design/cats/CREDITS.md](design/cats/CREDITS.md).

## Checks

```sh
bun run check             # all tests and a production build
bun run test              # tests only
bun run check:production  # validate production frontend configuration
```

Tests use isolated Convex mocks and mocked Clerk requests. They do not upload to a real deployment, send email, or delete real accounts. CI runs the tests and build with placeholder public configuration, and scans Git history with Gitleaks. `check:production` validates frontend variables; it does not inspect remote Convex secrets.

## Project layout

| Directory | Contents |
| --- | --- |
| `src/routes/` | SvelteKit pages, login, editor, and public profiles. |
| `src/lib/engine/` | Tile rendering and editor behavior. |
| `src/lib/` | API, authentication, save queue, and shared components. |
| `convex/` | Schema, backend functions, media storage, and cleanup jobs. |
| `tests/` | Backend, privacy, save recovery, and configuration tests. |
| `scripts/` | Demo seeding and production configuration checks. |
| `design/cats/` | Demo photos and their attribution. |

## Hosting

### Page views and member visits

Public box loads count on the server, including client-side navigation. The
counter sends only the box ID to Convex and stores a running total per box, plus
a count per box and hour that the owner's Visits chart uses for 30 days. It
does not use browser storage, visitor identifiers, account information, IP
addresses or individual view timestamps. Data preloading is disabled so hovering
links does not count; code still preloads on hover. HEAD requests and explicit
prefetches are excluded. Counter failures do not prevent a box from loading.

These are page views, not unique visitors: repeat loads, owners and automated
requests can count. Existing totals include visits from the earlier opt-in
system. Totals remain until the box is deleted and also rank Explore results.

There is no consent banner. Signed-in people who have a box are recorded as
visitors (their box and the time, at most once per half hour per box, kept 30
days) so owners can see who from the community stopped by. It's on by default
and turned off with "Show my box when I visit" in page settings, which also
deletes that box's recorded visits. Nothing is recorded for anyone else beyond
the anonymous counts. Browsers that opted in under the earlier system erase
their old records once, then drop the key.

### Automatic production deployment

Pushes to `main` automatically deploy to [bento.cat](https://bento.cat) on PPH
after both CI checks pass. Pull requests and other branches run checks only.
The Checks workflow can also be run manually on `main` to retry a deployment.

GitHub's `production` environment holds `PPH_DEPLOY_KEY` and `PPH_KNOWN_HOSTS`.
The SSH key can invoke only the server's Bento deployment helper. Convex and Clerk
backend credentials stay on the server. The helper fetches the exact checked
commit from this public repository, skips superseded commits, builds release
images, verifies a database/media backup, deploys Convex, and replaces the frontend.
Deployments are serialized, and the frontend is restored to its previous image
if the new release fails health checks. Convex schema/function changes require
backward compatibility with the previous frontend; database changes are not
automatically reversed.

Server setup, private logs, backups, and rollback instructions are documented in
`~/Code/infra/services/bento.md`; the reviewed helper is in
`~/Code/infra/deployments/bento/deploy.py`. Production configuration is embedded
at build time from the server configuration.

### Other hosting

The app uses `@sveltejs/adapter-bun` and builds a Bun server in `build/`. Configure frontend variables before building; they are embedded in the build.

```sh
bun run check:production
bun run build
HOST=0.0.0.0 PORT=3000 bun build/index.js
```

For your own deployment:

1. Configure a production Clerk instance, email codes, Google OAuth, allowed domains, and the `convex` JWT template. Google sign-in returns to `/login/callback`.
2. Set the frontend production URLs and Clerk `pk_live_` publishable key. Set Convex's issuer, Clerk backend key, and webhook signing secret on the production deployment.
3. Run `bun run deploy:convex` and deploy the matching frontend together. Upload and profile revision APIs require the matching frontend.
4. Register the production Clerk webhook and verify a signed test delivery. Monitor Convex logs and scheduled-function failures; deletion failures retry with backoff.
5. With an account you control, test signup, handle claiming, editing, reload recovery, uploads, two-tab conflicts, sharing, export, and deletion.

For a fork, replace the operator details in `src/lib/legal.js` and review the imprint, privacy policy, and terms for your service. The included service text describes bento.cat. Accessibility, moderation UI, publishing controls, and server-rendered profile content are still evolving; a passing build is not a complete service launch review.

## Storage and saves

Uploads use the authenticated `/upload` HTTP action. Limits are 20 MB per file, 500 MiB and 500 files per account, and 120 new files per hour. SVG uploads are excluded. See `convex/mediaPolicy.js` and `convex/files.js` for the limits.

Removed or abandoned tracked uploads expire after 24 hours; referenced files remain. Account deletion removes owned media through batched jobs. Clerk deletion failures retry, and a deletion tombstone prevents a still-valid session from recreating the account.

Profile writes require the editor's revision so stale tabs cannot silently overwrite newer changes. Recovery drafts live in browser storage and can survive a reload. Conflicting drafts remain available for export and never automatically overwrite server data. Monitor storage warnings and deletion jobs when operating a deployment.

## Contributing and security

Read [CONTRIBUTING.md](CONTRIBUTING.md) before submitting changes. Report vulnerabilities privately using [SECURITY.md](SECURITY.md).

## License

Copyright (C) 2026 Tin Sever. The source code is licensed under the **GNU Affero General Public License, version 3 only** (`AGPL-3.0-only`); see [LICENSE](LICENSE). The software is provided without warranty.

The cat photos in `design/cats/` are separate works with their own licenses and attribution in [CREDITS.md](design/cats/CREDITS.md). Third-party dependencies retain their respective licenses.
