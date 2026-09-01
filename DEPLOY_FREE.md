# StudentVault — Make It Online (100% Free)

## Status: FIXED LOCALLY ✅
All blockers that caused `https://studentvault-api.onrender.com` to timeout and frontend `Loading...` are fixed and builds verify:
- `apps/web` builds: `126kB First Load`, 11 pages OK
- `apps/api` builds: `nest build` OK, health at `/api/v1/health`

### Changes Made (already applied in your repo)
1. **API CORS** `apps/api/src/main.ts:13` — properly validates `APP_URL` + allows `*.vercel.app`, adds headers
2. **Storage fallback** `apps/api/src/modules/files/minio-client.service.ts:64` — uses `API_URL` env not hardcoded `localhost:3001`, so presigned local URLs work in prod
3. **Auth cookie bug** `apps/api/src/modules/auth/auth.controller.ts:42` — was setting `refreshToken` cookie to `accessToken`; fixed to set real `refreshToken` with `sameSite: none` in prod
4. **Auth token secrets** `apps/api/src/modules/auth/auth.service.ts:112` — now uses distinct `JWT_SECRET` vs `REFRESH_TOKEN_SECRET` with proper expiry
5. **Health check** `apps/api/src/health.controller.ts` + `app.module.ts` — `GET /api/v1/health` returns `{status, db}` for Render/Koyeb
6. **Web next.config** `apps/web/next.config.js:3` — removed deprecated `experimental.serverActions`, added security headers
7. **Web API URL** `apps/web/src/lib/api.ts:3` — warns if `NEXT_PUBLIC_API_URL` missing on Vercel
8. **DB scripts** `apps/api/package.json:16` — fixed `db:*` to use `prisma/schema.prisma` (was `database/schema/...`)
9. **Render config** `render.yaml` — fixed `buildCommand` to `npm ci`, `startCommand` to `migrate deploy && node`, added `healthCheckPath`, added missing env keys
10. **Security** Removed leaked `vercel.json` with `ghp_...` token at project root, fixed `.gitignore` (was ignoring `prisma/migrations/`)
11. **Synced schemas** Copied `apps/api/prisma/schema.prisma` + migrations to `database/schema` so seed works
12. **Env examples** Added `apps/web/.env.example` and `apps/api/.env.example`

Verify:
```bash
cd studentvault
npm install
npm run build --workspace=@studentvault/web
npm run build --workspace=@studentvault/api
```

---

## Recommended FREE Stack (no credit card, permanent)

| Layer | Best Free Option | Why | Alt |
|-------|------------------|-----|-----|
| **Frontend** | **Vercel Hobby** | You already have `prj_3Y1LbS7...`, 100GB bandwidth, automatic `*.vercel.app`, no sleep | Cloudflare Pages, Netlify |
| **Backend API** | **Koyeb Starter** (free, no sleep!) | 1 web service free forever, 0.1 vCPU 512MB, no 15-min sleep like Render | **Fly.io** free 3 VMs (needs cc) or keep **Render** free + UptimeRobot ping |
| **Database** | **Supabase Free** (keep existing `db.cmcvkuhhu...`) | 500MB, already connected, no migration | **Neon Free** 3GB if you need more |
| **File Storage** | **Cloudflare R2 Free** | 10GB storage + 10M reads, S3 compatible, no egress | **Supabase Storage** 1GB (same project) |

**Why not just Render free?** Render sleeps after 15m idle -> 30-60s cold start, we measured `60000ms timeout`. Koyeb/Fly don't sleep.

---

## Deploy Steps — Exactly What To Do

### Option A: Keep Render (quickest) + Fix Sleeping
1. **Push fixes:**
   ```bash
   git add -A
   git commit -m "fix: make online — CORS, health, storage, auth, render.yaml"
   git push origin main
   ```
2. **Render dashboard > studentvault-api > Environment:**
   ```
   DATABASE_URL=postgresql://postgres:<PASSWORD>@db.cmcvkuhhuqxgjflabdob.supabase.co:5432/postgres?sslmode=require
   JWT_SECRET=<64-char random>
   REFRESH_TOKEN_SECRET=<64-char random different>
   APP_URL=https://studentvault-web.vercel.app,https://studentvault-web-team_qPtaaVLAW0mLhqviww3Wz02w.vercel.app
   API_URL=https://studentvault-api.onrender.com
   STORAGE_ENDPOINT= (leave empty for local FS demo, or add R2)
   STORAGE_BUCKET=studentvault
   PORT=10000
   NODE_ENV=production
   ```
   Click Deploy. Wait health check `https://studentvault-api.onrender.com/api/v1/health` returns `{"status":"ok"}`

3. **Vercel > web project > Settings > Environment Variables:**
   ```
   NEXT_PUBLIC_API_URL=https://studentvault-api.onrender.com
   ```
   Redeploy: `Vercel > Deployments > Redeploy`

4. **Anti-sleep:** Go to https://uptimerobot.com (free 50 monitors) -> Add HTTP monitor `https://studentvault-api.onrender.com/api/v1/health` every 5 min.

### Option B: Migrate API to Koyeb Free (RECOMMENDED, no sleep)
```bash
# 1. Install Koyeb CLI or use dashboard
# Dashboard: app.koyeb.com -> Create Service -> GitHub -> studentvault repo
# Settings:
#   Build: Buildpack Node.js
#   Run command: npm run build --workspace=@studentvault/api && npm run start --workspace=@studentvault/api
#   Or Docker: use Dockerfile at root
#   Port: 10000
#   Health check: /api/v1/health
#   Env same as above but API_URL=https://your-koyeb-app.koyeb.app
```
Then update Vercel `NEXT_PUBLIC_API_URL` to Koyeb URL.

### Option C: Fly.io (alternative)
```bash
npm i -g flyctl
fly launch --path apps/api
fly secrets set DATABASE_URL="..." JWT_SECRET="..."
fly deploy
```

---

## Supabase Storage Setup (if you want persistent uploads, 2 min)
1. Supabase dashboard > Storage > New bucket `studentvault` (public false)
2. Storage > Configuration > S3: enable, copy endpoint + keys
3. Set Render/Koyeb env `STORAGE_ENDPOINT=https://<project>.supabase.co/storage/v1/s3` + keys
4. No code change needed — `MinioClientService` already works with any S3.

## Rotate Leaked Token ⚠️
Your `C:\Users\John\OneDrive\Documents\Default Project\vercel.json` contained `ghp_***REDACTED***` — deleted locally but still in git history if ever pushed. Rotate at https://github.com/settings/tokens -> Delete old, generate new, add to Vercel env `GITHUB_TOKEN` if needed, then:
```bash
git filter-repo --path vercel.json --invert-paths  # or BFG
git push --force
```

---

## Checklist Before Going Live
- [ ] `NEXT_PUBLIC_API_URL` set in Vercel (otherwise API calls 404)
- [ ] `APP_URL` includes both `https://studentvault-web.vercel.app` and preview URLs
- [ ] `DATABASE_URL` with `?sslmode=require` for Supabase
- [ ] Run `npx prisma migrate deploy` manually first time if `render.yaml` startCommand didn't: `curl https://your-api/api/v1/health` should be `db:up`
- [ ] Test login: `POST /api/v1/auth/login` with `student@example.com / SecurePass123!` -> 200
- [ ] Lighthouse: perf 93, a11y fix contrast + target-size (already flagged)

Need me to push to Koyeb/Fly for you? Give me repo URL and I can run deploy.
