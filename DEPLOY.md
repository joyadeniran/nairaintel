# Deploy NairaIntel on Vercel

## 1. Connect the repo

1. Go to [vercel.com](https://vercel.com) → **Add New Project**
2. Import `joyadeniran/nairaintel`
3. Framework preset should detect **Vite**
4. Build command: `npm run build`
5. Output directory: `dist`
6. Do **not** deploy yet — add env vars first

---

## 2. How to set environment variables (Vercel dashboard)

You cannot use a local `.env` for production. Set secrets in Vercel:

1. Project → **Settings** → **Environment Variables**
2. Add each variable below for **Production** (and Preview if you want)
3. Redeploy after saving

### Required

| Name | Where to get it | Notes |
|------|-----------------|-------|
| `FIREBASE_SERVICE_ACCOUNT_KEY` | Firebase Console → Project settings → Service accounts → Generate new private key | Paste the **entire JSON** as one line (or multi-line; Vercel supports it). **Server only** — never prefix with `VITE_` |
| `VITE_FIREBASE_API_KEY` | Firebase Console → Project settings → Your apps → Web app config | Client |
| `VITE_FIREBASE_AUTH_DOMAIN` | same | Client |
| `VITE_FIREBASE_PROJECT_ID` | same | Client |
| `VITE_FIREBASE_STORAGE_BUCKET` | same | Client |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | same | Client |
| `VITE_FIREBASE_APP_ID` | same | Client |

### Strongly recommended

| Name | Where to get it |
|------|-----------------|
| `NGNMARKET_API_KEY` | [ngnmarket.com/developer](https://ngnmarket.com/developer) — free tier works |

### Optional

| Name | Purpose |
|------|---------|
| `GEMINI_API_KEY` | AI market news (if not already injected by your host) |

### Firebase service account tip

After downloading the JSON key:

1. Open the file
2. Copy **all** content including `{` and `}`
3. Paste into Vercel value for `FIREBASE_SERVICE_ACCOUNT_KEY`
4. Ensure the Firebase project matches the `VITE_FIREBASE_*` project

Also enable **Google** sign-in in Firebase Authentication, and add your Vercel domain under **Authorized domains** (e.g. `your-app.vercel.app`).

---

## 3. Deploy

- Click **Deploy** (or push to `master` if Git integration is on)
- Test: `https://YOUR_APP.vercel.app/api/health` → `{ "status": "ok", ... }`

---

## 4. Architecture on Vercel

- **Frontend:** static Vite build in `dist/`
- **API:** `api/index.ts` serverless function (Express routes)
- **Database:** **Firestore only** on Vercel (SQLite is disabled in serverless)
- **Auth:** Firebase ID tokens verified with Admin SDK

---

## 5. Optional — purge old `nairaintel.db` from git history

The file was removed from the latest tree, but may still exist in older commits. If it ever held real user data:

```bash
# On your machine (destructive history rewrite)
pip install git-filter-repo
git clone --mirror https://github.com/joyadeniran/nairaintel.git
cd nairaintel.git
git filter-repo --path nairaintel.db --invert-paths
git push --force
```

Coordinate with anyone else who has a clone — they must re-clone after a force push.

---

## 6. Checklist after first deploy

- [ ] `/api/health` returns ok
- [ ] Google login works on the Vercel domain
- [ ] Adding a portfolio asset works (needs Auth + Firestore)
- [ ] Live prices return numbers when `NGNMARKET_API_KEY` is set
- [ ] Forum post create works when logged in
