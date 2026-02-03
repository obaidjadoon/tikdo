# 🚀 Deploy to Render.com - Step by Step Guide

## Prerequisites
- GitHub account (free)
- Render.com account (free)
- Your TikDo project files (already created)

---

## Step 1: Create GitHub Repository

### 1.1 Go to GitHub
1. Open browser and go to [github.com](https://github.com)
2. Click **Sign in** (or **Sign up** if you don't have an account)

### 1.2 Create New Repository
1. Click the **+** icon (top right)
2. Select **New repository**
3. Fill in:
   - Repository name: `tikdo` (or any name you want)
   - Description: `TikTok video downloader without watermark`
   - Select **Public** (required for Render free tier)
   - **DON'T** check "Initialize with README" (we already have files)
4. Click **Create repository**

### 1.3 Copy Repository URL
You'll see a page with setup instructions. Copy the repository URL that looks like:
```
https://github.com/YOUR-USERNAME/tikdo.git
```

---

## Step 2: Upload Your Code to GitHub

### 2.1 Open PowerShell in Your Project Folder
1. Open File Explorer
2. Navigate to `D:\tikdo`
3. Type `powershell` in the address bar and press Enter

### 2.2 Initialize Git and Push Code
Run these commands **one by one** in PowerShell:

```powershell
# Initialize git repository
git init

# Add all files
git add .

# Commit files
git commit -m "Initial commit - TikTok downloader"

# Add your GitHub repository (replace YOUR-USERNAME with your actual GitHub username)
git remote add origin https://github.com/YOUR-USERNAME/tikdo.git

# Push to GitHub
git branch -M main
git push -u origin main
```

**Note:** If git asks for credentials:
- Username: Your GitHub username
- Password: Use a **Personal Access Token** (not your password)
  - Get token at: GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic) → Generate new token
  - Select `repo` scope
  - Copy the token and paste it as password

### 2.3 Verify Upload
1. Go to your GitHub repository in browser
2. Refresh the page
3. You should see all your files (app.py, templates/, static/, etc.)

---

## Step 3: Deploy on Render.com

### 3.1 Create Render Account
1. Go to [render.com](https://render.com)
2. Click **Get Started** or **Sign Up**
3. Choose **Sign up with GitHub** (easiest option)
4. Authorize Render to access your GitHub

### 3.2 Create New Web Service
1. In Render dashboard, click **New +** button (top right)
2. Select **Web Service**

### 3.3 Connect Repository
1. You'll see a list of your GitHub repositories
2. Find `tikdo` (or whatever you named it)
3. Click **Connect**

**If you don't see your repository:**
- Click **Configure account**
- Grant access to the repository
- Go back and refresh

### 3.4 Configure Web Service

Fill in these settings:

**Basic Settings:**
- **Name**: `tikdo-downloader` (or any unique name)
  - This will be your URL: `https://tikdo-downloader.onrender.com`
- **Region**: Choose closest to your target audience (e.g., Oregon for USA)
- **Branch**: `main`
- **Root Directory**: (leave empty)
- **Runtime**: **Python 3** (should auto-detect)

**Build & Deploy Settings:**
- **Build Command**: 
  ```
  pip install -r requirements.txt
  ```
  (should be auto-filled)

- **Start Command**:
  ```
  gunicorn app:app
  ```
  (should be auto-filled)

**Instance Type:**
- Select **Free** (0.1 CPU, 512 MB RAM)
  - This is sufficient for moderate traffic
  - Spins down after 15 min of inactivity (restarts automatically)

### 3.5 Advanced Settings (Optional)

Click **Advanced** to expand:

**Environment Variables** (add these if needed):
- `PYTHON_VERSION`: `3.11.0` (optional, usually not needed)

**Auto-Deploy:**
- ✅ Keep "Auto-Deploy" enabled
- This means any GitHub push will automatically redeploy

### 3.6 Create Web Service
1. Click **Create Web Service** button at the bottom
2. Wait for deployment (3-5 minutes)

---

## Step 4: Monitor Deployment

### 4.1 Watch Build Logs
You'll see real-time logs showing:
```
==> Cloning from GitHub...
==> Installing dependencies...
==> Building...
==> Starting service...
==> Your service is live 🎉
```

### 4.2 Check for Errors
- **Green** = Success ✅
- **Red** = Failed ❌ (check logs for errors)

Common issues and fixes:
- **Missing dependencies**: Check requirements.txt
- **Port error**: Render uses PORT environment variable (gunicorn handles this automatically)
- **Import errors**: Check all files uploaded to GitHub

---

## Step 5: Access Your Website

### 5.1 Get Your URL
Once deployment succeeds, you'll see:
```
Your service is live at https://tikdo-downloader.onrender.com
```

### 5.2 Test Your Website
1. Click the URL or copy it
2. Open in browser
3. You should see your TikTok downloader!

### 5.3 Test Functionality
1. Paste a TikTok URL
2. Click Download
3. Select quality (480p, 720p, 1080p)
4. For HD: Wait 5 seconds for ad
5. Download should work!

---

## Step 6: Configure Custom Domain (Optional)

### 6.1 Add Custom Domain in Render
1. In Render dashboard, go to your service
2. Click **Settings** tab
3. Scroll to **Custom Domain**
4. Click **Add Custom Domain**
5. Enter your domain (e.g., `tikdo.com`)

### 6.2 Update DNS Records
If you have a domain (Namecheap, GoDaddy, etc.):
1. Go to your domain registrar
2. Add CNAME record:
   - **Name/Host**: `www` or `@`
   - **Value**: Your Render URL (without https://)
   - **TTL**: 3600

3. Wait for DNS propagation (5 min - 48 hours)

### 6.3 Enable HTTPS
Render automatically provides free SSL certificate once domain is verified!

---

## Step 7: Post-Deployment Configuration

### 7.1 Update Site URLs
Replace placeholder URLs in your code:

**In templates/index.html:**
- Line 20-24: Update `https://yourwebsite.com/` with your actual Render URL
- Example: `https://tikdo-downloader.onrender.com/`

**In static/sitemap.xml:**
- Replace all instances of `yourwebsite.com` with your domain

**In static/robots.txt:**
- Update sitemap URL

### 7.2 Update to GitHub
```powershell
# In your project folder
git add .
git commit -m "Update URLs"
git push
```
Render will automatically redeploy!

### 7.3 Add Analytics & Ads

**Google Analytics:**
1. Create property at [analytics.google.com](https://analytics.google.com)
2. Get Measurement ID (looks like: `G-XXXXXXXXXX`)
3. Replace `GA_MEASUREMENT_ID` in templates/index.html (line 30)
4. Push to GitHub

**Monetag Ads:**
1. Sign up at [monetag.com](https://monetag.com)
2. Create ad zones
3. Get zone IDs
4. Replace in templates/index.html:
   - `YOUR_ZONE_ID`
   - `YOUR_BANNER_ZONE_ID`
   - `YOUR_NATIVE_ZONE_ID`
   - `YOUR_INTERSTITIAL_ZONE_ID` (in static/js/main.js)
5. Push to GitHub

---

## Step 8: SEO Setup

### 8.1 Google Search Console
1. Go to [search.google.com/search-console](https://search.google.com/search-console)
2. Click **Add Property**
3. Choose **URL prefix**
4. Enter your Render URL
5. Verify ownership (HTML file upload or HTML tag)
6. Submit sitemap: `https://your-url.onrender.com/sitemap.xml`

### 8.2 Submit to Search Engines
- Google: Already done via Search Console
- Bing: [bing.com/webmasters](https://www.bing.com/webmasters)
- Submit URL for indexing

---

## 🎉 You're Live!

Your TikTok downloader is now:
- ✅ Deployed on Render.com
- ✅ Accessible worldwide
- ✅ Auto-deploys from GitHub
- ✅ Free hosting
- ✅ Free SSL certificate
- ✅ SEO-optimized

---

## 📊 Monitoring & Maintenance

### Daily/Weekly Tasks:
1. **Check Render logs** for errors
2. **Monitor Google Analytics** for traffic
3. **Check Monetag dashboard** for ad revenue

### Monthly Tasks:
1. **Update yt-dlp** (TikTok changes frequently):
   ```powershell
   # Update locally
   pip install --upgrade yt-dlp
   
   # Update requirements.txt
   pip freeze > requirements.txt
   
   # Push to GitHub
   git add requirements.txt
   git commit -m "Update yt-dlp"
   git push
   ```

2. **Check Google Search Console** for:
   - Indexing status
   - Search performance
   - Mobile usability

3. **Backup your code** (already on GitHub ✅)

---

## ⚠️ Important Notes

**Free Tier Limitations:**
- Service sleeps after 15 min inactivity
- First request may take 30-60 seconds to wake up
- 750 hours/month free (enough for most sites)
- Consider upgrading if you get high traffic

**Legal Compliance:**
- Users responsible for respecting copyrights
- Privacy policy & disclaimer included
- Use at your own risk

---

## 🆘 Troubleshooting

### Deployment Failed
- Check logs in Render dashboard
- Verify all files in GitHub
- Check requirements.txt syntax

### App Not Starting
- Check Start Command: `gunicorn app:app`
- Verify app.py has no syntax errors
- Check Python version compatibility

### Downloads Not Working
- Update yt-dlp to latest version
- Check TikTok hasn't changed their API
- Verify ffmpeg available (Render includes it)

### Site is Slow
- First load after sleep takes time (normal)
- Consider upgrading to paid plan for faster performance
- Optimize images, minimize CSS/JS

---

## 🚀 Next Steps

1. **Share your website** on social media
2. **Build backlinks** (submit to directories)
3. **Create blog content** to improve SEO
4. **Monitor and optimize** based on analytics
5. **Engage with users** and gather feedback

---

## 📞 Support Resources

- **Render Docs**: [render.com/docs](https://render.com/docs)
- **GitHub Docs**: [docs.github.com](https://docs.github.com)
- **Flask Docs**: [flask.palletsprojects.com](https://flask.palletsprojects.com)
- **yt-dlp Issues**: [github.com/yt-dlp/yt-dlp/issues](https://github.com/yt-dlp/yt-dlp/issues)

---

**Congratulations! Your TikTok downloader is now live! 🎊**
