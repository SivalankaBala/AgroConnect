# AgroConnect Deployment Guide

This guide walks you through deploying **AgroConnect**:
- **Backend (Node.js/Express + MongoDB)** ➔ **[Render](https://render.com/)**
- **Frontend (React + Vite SPA)** ➔ **[Vercel](https://vercel.com/)**

---

## 📋 Architecture & Prerequisites

Before deploying, ensure you have:
1. A **GitHub** account with this repository pushed: `https://github.com/SivalankaBala/AgroConnect`
2. A **[Render](https://render.com)** account (Free tier)
3. A **[Vercel](https://vercel.com)** account (Free tier)
4. A **[MongoDB Atlas](https://www.mongodb.com/cloud/atlas)** cluster

---

## 🗄️ Step 1: MongoDB Atlas Preparation

Render web services use dynamic IP addresses. Ensure your MongoDB Atlas cluster allows incoming connections from Render:

1. Log into **[MongoDB Atlas](https://cloud.mongodb.com/)**.
2. Go to **Network Access** (under *Security* on the left sidebar).
3. Click **Add IP Address**.
4. Choose **Allow Access from Anywhere** (`0.0.0.0/0`) and click **Confirm**.
5. Go to **Database Access** and verify you have a database user and password.
6. Click **Connect** on your Database Cluster ➔ **Drivers** (Node.js) ➔ Copy the connection string:
   ```text
   mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/AgroConnect?retryWrites=true&w=majority
   ```
   *(Replace `<username>` and `<password>` with your database credentials)*.

---

## 🚀 Step 2: Deploy Backend to Render

### Option A: Using Render Blueprints (`render.yaml` - Recommended)
1. Go to your **[Render Dashboard](https://dashboard.render.com/)**.
2. Click **New +** ➔ **Blueprint**.
3. Connect your GitHub repository: `SivalankaBala/AgroConnect`.
4. Render will read `render.yaml` automatically and configure:
   - **Service Name**: `agroconnect-backend`
   - **Root Directory**: `backend`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Health Check Path**: `/api/health`
5. Under Environment Variables:
   - Fill in `MONGODB_URI` with your MongoDB connection string.
   - `JWT_SECRET` is generated automatically, or you can supply your own secret string.
   - Leave `CLIENT_URL` blank for now (or fill in your Vercel URL once you have it).
6. Click **Apply**. Render will build and deploy your backend.

---

### Option B: Manual Web Service Setup on Render
If you prefer setting it up manually:
1. In Render Dashboard, click **New +** ➔ **Web Service**.
2. Select your repository: `SivalankaBala/AgroConnect`.
3. Configure the settings:
   | Setting | Value |
   |---|---|
   | **Name** | `agroconnect-backend` |
   | **Region** | Choose closest to your users (e.g., Singapore / Frankfurt) |
   | **Branch** | `main` |
   | **Root Directory** | `backend` |
   | **Runtime** | `Node` |
   | **Build Command** | `npm install` |
   | **Start Command** | `npm start` |
   | **Instance Type** | `Free` |
4. Scroll down to **Environment Variables** and add:
   - `NODE_ENV` = `production`
   - `MONGODB_URI` = `mongodb+srv://<username>:<password>@<cluster>.mongodb.net/AgroConnect?retryWrites=true&w=majority`
   - `JWT_SECRET` = `<any-long-random-string-or-existing-secret>`
   - `CLIENT_URL` = `*` (or your future Vercel URL)
5. Click **Create Web Service**.
6. Wait for the deploy logs to finish. Once live, test your backend URL:
   - Example: `https://agroconnect-backend.onrender.com/` (Should return `{"status":"online"}`)
   - Example: `https://agroconnect-backend.onrender.com/api/health` (Should return `{"success":true}`)
7. **Copy your Render backend URL** (e.g. `https://agroconnect-backend.onrender.com`). You will need it for Vercel in Step 3!

> [!NOTE]
> **Render Free Tier Sleep Policy**: Free web services sleep after 15 minutes of inactivity. The first request after sleep may take ~30-50 seconds to spin up.

---

## ⚡ Step 3: Deploy Frontend to Vercel

1. Log into **[Vercel](https://vercel.com/)**.
2. Click **Add New...** ➔ **Project**.
3. Import your GitHub repository: `SivalankaBala/AgroConnect`.
4. In the **Configure Project** screen:
   - **Project Name**: `agroconnect` (or any name you prefer)
   - **Framework Preset**: `Vite` (automatically detected)
   - **Root Directory**: Click **Edit** and select **`frontend`** ⚠️ *(CRITICAL! Do not leave it at repo root)*.
   - **Build Command**: `npm run build` (Default)
   - **Output Directory**: `dist` (Default)
   - **Install Command**: `npm install` (Default)
5. Expand **Environment Variables**:
   - Add:
     - **Key**: `VITE_API_URL`
     - **Value**: `https://agroconnect-backend.onrender.com` *(Your Render URL without trailing slash)*
6. Click **Deploy**.
7. Vercel will install dependencies, build the Vite app, and assign you a live domain (e.g., `https://agroconnect.vercel.app`).

---

## 🔒 Step 4: Update Backend CORS on Render (Optional but Recommended)

Now that your frontend is live:
1. Copy your Vercel domain (e.g., `https://agroconnect.vercel.app`).
2. Go to **Render Dashboard** ➔ Select your `agroconnect-backend` service.
3. Go to **Environment** tab.
4. Set or update:
   - `CLIENT_URL` = `https://agroconnect.vercel.app`
5. Render will automatically redeploy with restricted origin security.

---

## ✅ Step 5: Verification Checklist

- [ ] Open your Vercel frontend URL in the browser.
- [ ] Check if the crops list loads in Marketplace.
- [ ] Test User Authentication: Register/Sign in as Farmer or Buyer.
- [ ] Open Weather Advisory: Test fetching live weather for Andhra Pradesh mandals/districts.
- [ ] Test Creating a Crop listing as Farmer.
- [ ] Test Enquiry or Direct Messaging between Buyer and Farmer.

---

## 🛠️ Troubleshooting & Common Gotchas

| Issue | Cause | Solution |
|---|---|---|
| **CORS error in browser console** | `CLIENT_URL` mismatch or frontend calling localhost | Verify `VITE_API_URL` in Vercel settings matches your Render backend URL. Check that `CLIENT_URL` on Render includes your Vercel domain or is unset (allowing `*`). |
| **Backend 500 error / MongoDB connection failed** | MongoDB Atlas IP block or invalid credentials | Go to MongoDB Atlas ➔ Network Access ➔ Ensure `0.0.0.0/0` is added. Double check `MONGODB_URI` username and password. |
| **Initial load takes 30-50 seconds** | Render Free tier spin up | Normal behavior for free instances spinning down after 15m idle. Subsequent requests will be fast. |
| **404 when refreshing page on Vercel** | SPA routing rewrite missing | `frontend/vercel.json` is included in this repository to rewrite all routes to `/index.html`. |
