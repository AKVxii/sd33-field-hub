# Permanent public hosting — SD 33 Field Hub

## Option A — Render.com (recommended free permanent URL)

Works on any phone / network. Free tier sleeps after ~15 min idle, then wakes on first visit (first load can take ~30–60s).

### Steps (about 10 minutes, once)

1. Create a free account: https://render.com  
2. Create a free GitHub account if you don’t have one: https://github.com/join  
3. On your PC, push this folder to a new GitHub repo (see below).  
4. In Render: **New → Blueprint** (or **Web Service**) → connect the repo.  
5. After deploy, open the URL Render gives you, e.g.  
   `https://sd33-field-hub.onrender.com/review`  
6. In Render → Environment, add:  
   `PUBLIC_URL` = `https://YOUR-SERVICE.onrender.com`  
   (no trailing slash) → Save → redeploy.

### Push this project to GitHub (after Git is installed)

```bat
cd C:\Users\alana\Documents\sd33-litdrop
git init
git add .
git commit -m "SD 33 field hub permanent deploy"
gh repo create sd33-field-hub --public --source=. --remote=origin --push
```

Or create the repo on github.com and:

```bat
git remote add origin https://github.com/YOURUSER/sd33-field-hub.git
git branch -M main
git push -u origin main
```

### Deploy button (after repo is public)

Use Render “New Web Service” → connect GitHub → select `sd33-field-hub` → **Create**.

---

## Option B — Keep PC as host (not 24/7)

Use `start-public-tunnel.bat` for temporary `loca.lt` links, or same Wi‑Fi `http://192.168.x.x:3050`.

---

## After you have the permanent URL

Email / text:

```
Please review our SD 33 volunteer site:
https://YOUR-SERVICE.onrender.com/review
```

Update `PUBLIC_URL` on Render so Share buttons use that link.
