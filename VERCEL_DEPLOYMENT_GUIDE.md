# Deploying Your Survey Dashboard to the Web (Vercel)

This guide shows you how to deploy the **University Life Management Survey Web Dashboard** to the live web via **Vercel** for free.

---

## Method 1: Deploy with Vercel CLI (Fastest — 2 Minutes)

You can deploy directly from your computer terminal without even opening GitHub:

1. Open PowerShell or Command Prompt in this folder:
   ```powershell
   cd "c:\Users\SWARAY\Downloads\gifty forms"
   ```
2. Run:
   ```powershell
   npx vercel
   ```
3. Follow the on-screen prompts:
   - **Set up and deploy?** Press `y` and hit Enter.
   - **Which scope?** Press Enter (selects your personal account).
   - **Link to existing project?** Press `n` (No).
   - **What's your project's name?** Hit Enter (defaults to `university-life-survey-dashboard` or type your preferred name).
   - **In which directory is your code located?** Hit Enter (`./`).
   - **Want to modify these settings?** Press `n` (No — settings are auto-detected via Next.js).
4. Vercel will upload and build your project. In under 60 seconds, it will print your **live production URL** (e.g. `https://university-life-survey-dashboard.vercel.app`)!

---

## Method 2: Deploy via GitHub + Vercel Dashboard (Best for Team Sharing & Auto-Updates)

If you prefer using GitHub:

1. Initialize git and commit your files (if not already done):
   ```powershell
   git init
   git add .
   git commit -m "Initial commit: University Life Management Survey & Web Dashboard"
   ```
2. Create a new repository on [GitHub](https://github.com/new).
3. Push your repository:
   ```powershell
   git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
   git branch -M main
   git push -u origin main
   ```
4. Log into [vercel.com](https://vercel.com):
   - Click **Add New...** > **Project**.
   - Click **Import** next to your GitHub repository.
   - Click **Deploy**.
5. Every time you push a commit to GitHub, Vercel will automatically rebuild and update your live site!

---

## How Live Google Sheets Sync Works on Vercel

When your site is live on Vercel:
1. Anyone visiting your URL can click the **Connect Google Sheet** button in the top navigation bar.
2. Paste your Google Sheet sharing URL (set to *"Anyone with the link can view"*).
3. Click **Connect & Load Responses**:
   - The web app fetches the newest responses in real-time.
   - All 6 KPI cards, 6 charts, demographic filters, and student quotes immediately recompute live in the browser!
   - Visitors can click **Download Clean Excel (.xlsx)** to download a complete formatted multi-tab Excel file directly to their computer.
