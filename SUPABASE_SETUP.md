# Supabase Setup Guide for FinShadow

## Step 1: Create Supabase Project

1. Go to [https://supabase.com](https://supabase.com)
2. Sign up (free tier is sufficient for development)
3. Create a new project:
   - Project name: `finshadow` (or your choice)
   - Database password: Choose a strong password
   - Region: Choose closest to you
4. Wait for project to provision (2-3 minutes)

## Step 2: Get Your Connection String

1. In Supabase dashboard, go to **Settings** → **Database**
2. Find the **Connection string** section
3. Select **URI** tab (if not already selected)
4. Copy the connection string that looks like:
   ```
   postgresql://postgres.[PROJECT_ID]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?sslmode=require
   ```
5. Replace `[PASSWORD]` with the password you set during project creation

## Step 3: Update .env File

Replace the DATABASE_URL in `.env` with your Supabase connection string:
```
DATABASE_URL=postgresql://postgres.[PROJECT_ID]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?sslmode=require
```

## Step 4: Deploy Schema

After updating .env, run:
```bash
npm run db:push
```

This will create all 11 tables on your Supabase database automatically.

## Step 5: Verify Connection

Start your app:
```bash
npm run dev
```

You should see:
```
✅ Database connection healthy
serving on 0.0.0.0:5000
```

---

**Notes:**
- Supabase free tier: 500MB storage (plenty for development)
- All your existing schema from `shared/schema.ts` will be created automatically
- Session storage will persist to Supabase automatically
- No code changes needed - just the connection string!
