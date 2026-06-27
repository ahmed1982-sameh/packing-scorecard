# Deployment Troubleshooting Checklist

## ✅ Verify Local Setup Works

Run these commands locally FIRST to ensure everything works:

```powershell
# Install dependencies
npm install

# Start server locally
npm start
```

**Expected output:**
```
✅ Server running on port 3000
📊 Dashboard: http://localhost:3000
📡 API: http://localhost:3000/data
```

**Test in browser:**
- http://localhost:3000 → Should show dashboard
- http://localhost:3000/data → Should return JSON data

---

## 🔍 Verify Files Are Committed to Git

### Step 1: Check Git Status
```powershell
git status
```

**Must show:**
- ✅ dashboard.html (tracked)
- ✅ server.js (tracked)
- ✅ package.json (tracked)

**Must NOT show:**
- ❌ node_modules/
- ❌ scorecard.db

If `dashboard.html` is NOT showing, you must add it:

```powershell
# Force add dashboard.html (override any excludes)
git add dashboard.html

# Commit
git commit -m "Add dashboard.html"

# Push
git push origin main
```

### Step 2: Verify on GitHub
1. Go to: https://github.com/YOUR_USERNAME/packing-scorecard
2. Check **Files** - should see:
   - ✅ dashboard.html
   - ✅ server.js
   - ✅ package.json
   - ✅ .gitignore

If `dashboard.html` is missing, it wasn't committed to Git!

---

## 🚀 Deploy to Render

### Step 1: Redeploy (Force Fresh Build)

If the homepage still doesn't load after committing dashboard.html:

1. Go to **Render Dashboard** → Your service
2. Click **Manual Deploy** → **Deploy latest commit**
3. Wait 2-3 minutes

### Step 2: Check Render Logs

1. In Render dashboard, click your service
2. Go to **Logs** tab
3. Look for:
   ```
   ✅ Server running on port XXXX
   ```

If you see an error about dashboard.html, it means:
- The file wasn't committed to Git
- Go back to "Verify Files Are Committed to Git" section

---

## 🧪 Test Deployment

### Test 1: Homepage loads
```
https://your-app-xxxx.onrender.com/
```
Should show the full dashboard with all charts

### Test 2: API returns data
```
https://your-app-xxxx.onrender.com/data
```
Should return JSON:
```json
{
  "prod": { "actual": [...], "budget": [...] },
  "oee": { "actual": [...], "budget": [...] },
  ...
}
```

### Test 3: Save new data
1. On the homepage, click **"➕ Add KPI Data"**
2. Fill in a KPI entry (e.g., Productivity - Jan - 85 actual, 85 budget)
3. Click **Save**
4. Verify the change persists after refresh

---

## ❌ Common Issues & Fixes

| Issue | Cause | Fix |
|-------|-------|-----|
| Homepage shows 404 error | dashboard.html not committed to Git | Run `git add dashboard.html && git commit -m "Add dashboard"` then push |
| "Route not found" error | File path issue | Ensure dashboard.html is in root directory with server.js |
| API works but homepage doesn't | Static file serving misconfigured | Use updated server.js with improved error handling |
| 500 server error | Database initialization failed | Check Render logs for SQLite error messages |
| Dashboard loads but no data | Database empty on Render | First time setup - app auto-initializes with sample data on first load |

---

## 📋 Project Structure (MUST BE)

```
packing-scorecard/
├── server.js                 ✅ Updated with error handling
├── dashboard.html            ✅ MUST be in root (NOT subdirectory)
├── package.json              ✅ Updated with node 18.x engine
├── .gitignore               ✅ Excludes node_modules, .env, scorecard.db
├── package-lock.json        ✅ Auto-generated
└── scorecard.db             ✅ Created on first server startup
```

**NOT like this (WRONG):**
```
packing-scorecard/
├── src/
│   └── dashboard.html       ❌ NO - must be in root
├── server.js
└── package.json
```

---

## 🔧 Updated Files

### server.js Changes:
✅ Environment variable PORT support  
✅ Better error handling for missing dashboard.html  
✅ 404 and error handler middleware  
✅ Improved logging for debugging  
✅ Production-ready SQLite configuration  

### .gitignore (Correct):
✅ Excludes node_modules/  
✅ Excludes scorecard.db (database file)  
✅ Does NOT exclude dashboard.html (it's allowed)  
✅ Excludes .env and build artifacts  

---

## 🎯 Final Deployment Steps

1. ✅ Run locally and verify it works
2. ✅ Ensure dashboard.html is committed to Git
3. ✅ Push to GitHub
4. ✅ Trigger manual deploy on Render
5. ✅ Check Render logs
6. ✅ Test homepage and API
7. ✅ Test saving data

---

## 📞 Need Help?

### Check Render Logs:
```
Dashboard → Your Service → Logs tab
```

### Check File Existence:
```
Dashboard → Your Service → Shell tab
ls -la /opt/render/project/src/
```
Should show: dashboard.html, server.js, package.json

### Common Git Commands:
```powershell
# Check what's staged
git status

# Add all changes
git add .

# See what will be committed
git diff --staged

# Commit
git commit -m "Fix: Ensure dashboard.html is deployed"

# Push
git push origin main
```

---

## ✨ Once Everything Works

Your live dashboard:
```
https://packing-scorecard-xxxx.onrender.com
```

Share this URL with your team! 🎉
