# Deployment Guide: Render Deployment for Packing Scorecard

## Summary of Changes Made:
✅ **server.js** - Updated to use `process.env.PORT || 3000` instead of hardcoded port  
✅ **package.json** - Updated start script to use `node server.js` (not nodemon) with dev script for local development  

---

## Step 1: Prepare Your Project (LOCAL)

### 1.1 Verify Files
Ensure these files exist in your project root:
- ✅ server.js (updated)
- ✅ package.json (updated)
- ✅ dashboard.html
- ✅ scorecard.db

### 1.2 Create .gitignore File
Run this command to create a `.gitignore` file:

```bash
# Windows PowerShell
@'
node_modules/
.env
*.log
npm-debug.log*
.DS_Store
scorecard.db
'@ | Out-File -Encoding UTF8 .gitignore
```

---

## Step 2: Initialize Git Locally

Run these commands in your project folder (using PowerShell):

```bash
# Initialize git repository
git init

# Add all files to git
git add .

# Create initial commit
git commit -m "Initial commit: Packing scorecard project ready for deployment"

# Verify git status
git status
```

Expected output: "On branch master, nothing to commit, working tree clean"

---

## Step 3: Create GitHub Repository & Push Code

### 3.1 Create New Repository on GitHub
1. Go to https://github.com/new
2. **Repository name**: `packing-scorecard` (or any name you prefer)
3. **Description**: "Packing Scorecard Dashboard with Express and SQLite"
4. Select **Public** (needed for Render's free tier)
5. **DO NOT** initialize with README/gitignore/license (we have our own)
6. Click **Create repository**

### 3.2 Connect Local Repository to GitHub
Copy and run these commands (replace `YOUR_USERNAME` with your GitHub username):

```bash
# Add remote repository
git remote add origin https://github.com/YOUR_USERNAME/packing-scorecard.git

# Rename branch to main (Render prefers this)
git branch -M main

# Push code to GitHub
git push -u origin main
```

### 3.3 Verify on GitHub
- Go to your repository URL: `https://github.com/YOUR_USERNAME/packing-scorecard`
- Confirm all files are uploaded (should see server.js, package.json, dashboard.html, etc.)

---

## Step 4: Deploy on Render

### 4.1 Sign Up for Render (Free)
1. Visit https://render.com
2. Click **Sign up** → Choose "Sign up with GitHub"
3. Authorize Render to access your GitHub account
4. Complete registration

### 4.2 Create New Web Service
1. In Render dashboard, click **New** → **Web Service**
2. Select **Connect a repository**
3. Find and select **packing-scorecard** repository
4. Click **Connect**

### 4.3 Configure Deployment Settings
Fill in these settings:

| Field | Value |
|-------|-------|
| **Name** | packing-scorecard |
| **Environment** | Node |
| **Region** | Select closest to you |
| **Build Command** | `npm install` |
| **Start Command** | `node server.js` |

### 4.4 Environment Variables
- **No additional variables needed** (SQLite uses local file storage)
- If needed later: Click **Environment** tab to add variables

### 4.5 Deploy
1. Click **Create Web Service**
2. Wait for deployment (1-2 minutes)
3. You'll see a URL like: `https://packing-scorecard-xxxx.onrender.com`

---

## Step 5: Verify Deployment

### 5.1 Test Your Live App
1. Click the URL in Render dashboard
2. Your dashboard should load (all charts visible)
3. Try updating a value - verify it saves to the database

### 5.2 Check Server Logs
In Render dashboard:
- Click your service
- Go to **Logs** tab
- Should see: `Server running on port XXXX`

### 5.3 Test API Endpoints

**Test GET /data:**
```
https://packing-scorecard-xxxx.onrender.com/data
```
Should return JSON with all KPI data

---

## Step 6: Push Updates (Future Changes)

When you update code:

```bash
# Make your changes locally
# Then:
git add .
git commit -m "Update: [describe changes]"
git push origin main
```

**Render automatically redeploys** when you push to GitHub!

---

## Troubleshooting

### ❌ "Build failed" error
**Fix**: Run locally first to check for errors
```bash
npm install
npm start
```

### ❌ "Port already in use"
**Fix**: This won't happen on Render (dynamic port allocation)

### ❌ "Cannot find module"
**Fix**: Make sure all dependencies are in package.json
```bash
npm install express sqlite3
```

### ❌ Database not persisting
**⚠️ IMPORTANT**: SQLite on Render uses ephemeral storage (resets on redeploy)  
**Solution**: Use PostgreSQL for persistent data (upgrade needed)

---

## Your Public URL
Once deployed, your app will be accessible at:
```
https://packing-scorecard-xxxx.onrender.com
```

Share this URL with your team!

---

## Quick Command Reference

```bash
# Local development
npm run dev           # Uses nodemon (auto-reload)

# Production
npm start             # Uses node directly

# Git operations
git status            # Check changes
git add .             # Stage all files
git commit -m "msg"   # Create commit
git push origin main  # Push to GitHub
```

---

## Code Changes Summary

### server.js
```javascript
// BEFORE:
app.listen(3000, () => console.log("Server running on http://localhost:3000"));

// AFTER:
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
```

### package.json
```json
// BEFORE:
"scripts": { "start": "nodemon server.js" }

// AFTER:
"scripts": {
  "start": "node server.js",
  "dev": "nodemon server.js"
}
```

---

## Need Help?
- Render Docs: https://render.com/docs
- Express Docs: https://expressjs.com
- SQLite Docs: https://www.sqlite.org
