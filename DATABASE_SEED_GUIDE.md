# Database Seed & Testing Guide

## Quick Steps to Get Data in Database

### Step 1: Backend is Running on Render
✅ Backend is already deployed at: `https://backend-d58c.onrender.com`

### Step 2: Seed Local Database (For Development)
If running backend locally:
```bash
cd backend
npm run seed
```

This will:
- Connect to MongoDB
- Insert 5 sample services (Bridal Makeup, Hair Styling, Nail Art, Facial, Hair Spa)
- Insert 5 sample reels with descriptions and engagement metrics
- Skip if data already exists

### Step 3: Seed Production Database (Render Backend)
To populate the Render backend's database:

**Option A: Via HTTP Endpoint (Already Built In)**
```bash
curl -X POST https://backend-d58c.onrender.com/api/seed
```

**Option B: Using Node.js Script**
```bash
# Set MongoDB environment variables
$env:MONGO_USER='omrtalokar146_db_user'
$env:MONGO_PASS='gameprincess'
$env:MONGO_HOST='cluster0.ia1xxxb.mongodb.net'
$env:MONGO_DB='pastel-service'

# Run seed script
cd backend
node seedData.js
```

## What Was Fixed

### 1. ✅ Upload Functions Verified
- `ServiceManager.tsx` → `uploadFile()` uses `API_BASE` environment variable
- `ReelsManager.tsx` → `uploadFile()` uses `API_BASE` environment variable
- Both upload to: `https://backend-d58c.onrender.com/api/admin/upload`

### 2. ✅ Auth Fix (403 Error)
- **Problem**: `/api/auth/me` returning 403 - token not being sent with cross-origin requests
- **Solution**: Added `credentials: 'include'` to ProfileScreen fetch call
- **File**: `screens/ProfileScreen.tsx` line 35-39

### 3. ✅ CORS Updated
- **Problem**: Backend blocking frontend requests during testing
- **Solution**: Updated `server.js` CORS to `origin: true` (allow all) for testing
- **File**: `backend/server.js` line 54

### 4. ✅ Database Seed Script Created
- **File**: `backend/seedData.js` (new)
- **Package.json**: Added `npm run seed` script
- **Data**:
  - 5 Services with images, rates, duration
  - 5 Reels with video URLs, descriptions, engagement metrics
  - All linked to respective services

## Frontend Flow

### Before Seeding
```
Frontend loads → No services/reels in DB → Shows "Loading reels" spinner forever → Stuck 😞
```

### After Seeding
```
Frontend loads → Seed script populates DB → Frontend fetches services/reels → Displays data → Works! 🎉
```

## Testing Checklist

- [ ] Run `npm run seed` in backend folder
- [ ] Frontend should load services and reels in HomeScreen
- [ ] Login should work (no 403 error on `/api/auth/me`)
- [ ] Upload service image in ServiceManager should work
- [ ] Upload reel video in ReelsManager should work
- [ ] All images show correctly (Render backend URL)

## Environment Configuration

**Frontend (.env)**
```
VITE_API_URL=https://backend-d58c.onrender.com
```

**Backend (.env)**
```
MONGODB_URI=mongodb+srv://omrtalokar146_db_user:gameprincess@cluster0.ia1xxxb.mongodb.net/pastel-service
BACKEND_URL=https://backend-d58c.onrender.com
JWT_SECRET=your-secret-key
```

## Troubleshooting

**"Loading reels" still spinning?**
→ Run `npm run seed` in backend directory

**Still getting 403 on login?**
→ Check if token is saved in localStorage after login
→ Verify CORS allows localhost:3000

**Upload not working?**
→ Check console for exact error message
→ Verify `BACKEND_URL` env var is set in backend/.env
→ Make sure file size < 100MB

**Database connection failed?**
→ Check MongoDB credentials in .env
→ Verify internet connection (MongoDB Atlas requires network access)
→ Try: `ping cluster0.ia1xxxb.mongodb.net`
