# smart-life-webapp

Simple web app to control Smart Life devices and scenes, deployed on Cloudflare Pages with Pages Functions for the Tuya Home Assistant API proxy.

Note: Only Smart Life accounts created with email and password are supported. Accounts linked to Google are not supported.

Important: Postfix your automation names with a trailing `#` if you want them treated as automations; otherwise they will be displayed as scenes. This works around Tuya API behavior.

## Tech stack
- Vue 3 + Vue Router 4 + Vuex 4
- Element Plus 2
- Cloudflare Pages + Pages Functions (Wrangler for local dev)
- Node.js 22+

## Requirements
- Node 22 or newer (engines.node ">=22"). Consider using nvm and a local `.nvmrc` with `22`.
- npm (uses package-lock.json)

## Local development
1) Install dependencies
   ```bash
   npm ci
   ```
2) Vite dev server (fast HMR)
   ```bash
   npm run dev
   ```
   Note: this serves the SPA only. API routes (/api/homeassistant/*) are provided by Cloudflare Pages Functions and are not available via the Vite dev server unless you proxy them manually.
3) Cloudflare Pages dev (SPA + Functions together)
   ```bash
   npm run serve
   ```
   This builds the SPA with Vite and runs `wrangler pages dev dist`, serving dist/ along with the functions under functions/.
4) Open http://127.0.0.1:8788

## Build
- Production build:
  ```bash
  npm run build
  ```

## Lint
- Lint with ESLint:
  ```bash
  npm run lint
  ```

## API proxy (Pages Functions)
- Requests to `/api/homeassistant/*` are proxied to Tuya upstream via Cloudflare Pages Functions located in `functions/api/homeassistant`.
- Query parameter `region` controls the upstream region (default: `eu`). The function strips `region` before forwarding.
- Simple permissive CORS headers are applied by the function for local/dev usage.

## Deploy with Cloudflare Pages (Git integration)
1) Push your branch to GitHub
2) Cloudflare Dashboard → Pages → Create project → Connect to Git → select this repository/branch
3) Build settings:
   - Build command: `npm ci && npm run build`
   - Build output directory: `dist`
   - Functions directory: auto-detected (`functions/`)
4) Deploy and test your site

## Updating dependencies
- Check outdated packages:
  ```bash
  npm outdated
  ```
- Upgrade interactively:
  ```bash
  npx npm-check-updates -u && npm install
  ```
- Then validate with lint/build/serve

## Notes
- The Node-based proxy under `api/homeassistant` has been replaced by Cloudflare Pages Functions and is no longer required.
- Icons: https://icons8.com/icons/set/clapperboard
- Tuya integration docs: https://www.home-assistant.io/integrations/tuya/

