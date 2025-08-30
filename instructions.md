# Deploy: Cloudflare Pages + Functions

This branch deploys the Vue SPA to Cloudflare Pages and serves the API via a Pages Function under /api/homeassistant/*.

- Branch: deploy/cloudflare
- Static site: Cloudflare Pages (build output dist/)
- API proxy: Pages Function at functions/api/homeassistant/[[path]].ts

## Prerequisites
- Cloudflare account
- Repo hosted on GitHub (recommended) and connected to Cloudflare Pages
- Node 22 locally (optional)
- Wrangler CLI for local dev: npm i -D wrangler (already in this branch)

## Local development
1) Install deps and build:
   - npm ci
   - npm run build
2) Start Pages dev (serves dist/ with functions):
   - npm run serve
3) Open http://127.0.0.1:8788 and use the app. It will call /api/homeassistant/* and the function will proxy to Tuya.

## Deploy with Cloudflare Pages (Git integration)
1) Push this branch to GitHub
2) Cloudflare Dashboard → Pages → Create project → Connect to Git → select this repository and branch deploy/cloudflare
3) Build settings:
   - Build command: npm ci && npm run build
   - Build output directory: dist
   - Functions directory: auto-detected (functions/)
4) Deploy and test your site. Requests to /api/homeassistant/* are handled by the function.

## Notes
- The function strips the region query parameter before calling upstream and applies minimal CORS for cross-origin dev.
- Default region is eu. The app appends ?region=eu automatically unless changed in the UI.
- You can add a custom domain to the Pages project in Cloudflare and enable HTTPS.

