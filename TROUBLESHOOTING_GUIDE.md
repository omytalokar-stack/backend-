# 🔧 TROUBLESHOOTING & ERROR SOLUTIONS

## Quick Reference: If Something Goes Wrong

---

## ❌ COMMON ERROR #1: "Failed to fetch"

### Symptoms
- Browser console shows: `Failed to fetch /api/bookings`
- Booking form won't submit
- Admin panel shows no orders

### Causes
1. Backend server not running
2. Wrong port (not 5000)
3. API_BASE incorrectly configured
4. Network connectivity issue

### Solutions
```bash
# 1. Check if backend is running
# Terminal should show:
# 🚀 Server running on port 5000
# ✅ MongoDB Connected

# If not, restart:
cd C:\Users\user\OneDrive\Desktop\princess\pastelservice---cute-booking-app\backend
node server.js

# 2. Verify port 5000 is available
# Run this in PowerShell:
Get-NetTcpConnection -LocalPort 5000 -ErrorAction SilentlyContinue

# 3. Check API_BASE in App.tsx is correct
# Should be: http://localhost:5000
```

---

## ❌ COMMON ERROR #2: CORS Error

### Symptoms
- Browser console: `CORS policy: No 'Access-Control-Allow-Origin'`
- Request blocked by browser
- Network tab shows red error

### Causes
1. Frontend origin not in CORS whitelist
2. CORS middleware not configured
3. Frontend on wrong port

### Solutions
```javascript
// CORS is already configured in backend/server.js (lines 48-54)
// Allows: http://localhost:3000, http://localhost:3001, http://127.0.0.1:3000

// If you get this error:
// 1. Check browser is on http://localhost:3000 (NOT 5000)
// 2. Restart backend server
// 3. Clear browser cache: Ctrl+Shift+Del

// If error persists, check backend CORS config:
// File: backend/server.js
const corsOptions = {
  origin: ['http://localhost:3000', 'http://localhost:3001', 'http://127.0.0.1:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};
```

---

## ❌ COMMON ERROR #3: "Invalid or expired token"

### Symptoms
- Booking form submits but gets 401 error
- Admin panel shows "unauthorized"
- Backend logs: `Invalid token`

### Causes
1. JWT token expired
2. Token not in localStorage
3. Token format incorrect
4. JWT_SECRET changed

### Solutions
```javascript
// 1. Clear token and login again
// In browser console:
localStorage.removeItem('token');
localStorage.removeItem('user');
// Then: F5 to refresh and login

// 2. Check token exists
// In browser console:
console.log(localStorage.getItem('token'));
// Should show a long string starting with eyJ...

// 3. Check token format in request
// Network tab → Find booking request → Headers
// Should show: Authorization: Bearer eyJ...
```

---

## ❌ COMMON ERROR #4: Booking Shows "Slot already booked"

### Symptoms
- Get 400 error: "Slot already booked"
- Can't book same service at same time

### Causes
1. Someone already booked that slot
2. You already have a booking at that time
3. Time overlap detected

### Solutions
```javascript
// This is EXPECTED behavior - prevents double-booking

// Solutions:
// 1. Try different time slot
// 2. Try different date
// 3. Try different service
// 4. Check available slots BEFORE selecting

// To see available slots:
GET http://localhost:5000/api/bookings/available?serviceId=ABC&date=2026-01-27
// Returns only non-conflicting slots
```

---

## ❌ COMMON ERROR #5: Booking succeeds but not in Admin Panel

### Symptoms
- Frontend shows success message
- No error in browser
- Admin Orders tab is empty

### Causes
1. Admin panel not refreshed
2. Admin account doesn't have permissions
3. Booking saved but fetch failed
4. Database query issue

### Solutions
```javascript
// 1. Refresh admin panel
// Press F5 on admin page

// 2. Check admin permissions
// User must have: admin: true in MongoDB User collection

// 3. Check backend logs
// Terminal should show:
// 📥 Fetching orders...
// ✅ Orders found: 1

// 4. Test API directly in browser
// Go to: http://localhost:5000/api/admin/orders
// Headers: Authorization: Bearer {your_token}
// Should return array of bookings

// 5. If completely stuck
// Restart both servers:
// Ctrl+C in backend terminal
// node server.js
```

---

## ❌ COMMON ERROR #6: Blank admin panel / No services loading

### Symptoms
- Admin panel shows no services
- Admin panel shows no orders
- Empty tables/lists

### Causes
1. Auth token missing/invalid
2. Admin account not authorized
3. Backend query failed
4. Database empty

### Solutions
```javascript
// 1. Check you're logged in as admin
// localStorage.getItem('user') should show admin account

// 2. Verify admin privileges
// In MongoDB:
// Users collection → Find your user → admin field should be: true

// 3. Check API response
// Network tab → GET /api/admin/services
// Status should be 200
// Response should be array (even if empty [])

// 4. If getting 500 error
// Check backend terminal for error message
// Restart backend: node server.js

// 5. Create test data if needed
// Add a service first in Service Manager
// Then try booking it
```

---

## ❌ COMMON ERROR #7: Form validation errors

### Symptoms
- "Book Now" button won't click
- Form shows error message
- Can't proceed with booking

### Causes
1. Required field empty (name, address, slot)
2. Invalid input format
3. Slot not selected

### Solutions
```javascript
// Required fields:
// ☐ Name: Must have value
// ☐ Address: Must have value  
// ☐ Time Slot: Must be selected (highlighted in pink)
// ☐ Date: Auto-filled, but must be valid

// Solutions:
// 1. Fill ALL fields before clicking Book Now
// 2. Make sure to SELECT time slot (not just view it)
// 3. Try different slot if validation fails
// 4. Clear form and try again

// Check which field is missing:
// Press F12 → Console
// You should see errors if any
```

---

## ❌ COMMON ERROR #8: MongoDB connection failed

### Symptoms
- Backend logs: `❌ MongoDB Connection Error`
- Services/orders API returns empty
- No data saved

### Causes
1. MongoDB URI incorrect
2. MongoDB Atlas down
3. Network/firewall blocking
4. Credentials wrong

### Solutions
```javascript
// 1. Check .env file has MongoDB URI
// File: backend/.env
// Should have: MONGODB_URI=mongodb+srv://...

// 2. Test connection string
// Copy from .env and paste in MongoDB Atlas Connection String
// Should work immediately

// 3. Check IP whitelist in MongoDB Atlas
// MongoDB Atlas → Network Access
// Must include: 0.0.0.0/0 (allow all) or your IP

// 4. Restart backend with new URI
// Update .env → Save
// Kill backend: Ctrl+C
// Restart: node server.js

// 5. Verify connection
// Should see: ✅ MongoDB Connected
```

---

## ❌ COMMON ERROR #9: File upload failed

### Symptoms
- Video/image won't upload
- "413 Payload Too Large" error
- Upload process hangs

### Causes
1. File too large (over 500MB limit)
2. Wrong file type
3. Server not accepting multipart/form-data

### Solutions
```javascript
// Limits are set in server.js:
// express.json limit: 500MB
// multer fileSize: 500MB

// But common issue is wrong file format

// Accepted formats:
// Images: jpg, jpeg, png, gif
// Videos: mp4, webm, mov

// Solutions:
// 1. Convert file to accepted format
// 2. Compress large videos before upload
// 3. Check file size: Right-click → Properties
// 4. Restart backend if limit changed
```

---

## ❌ COMMON ERROR #10: Booking timestamp wrong

### Symptoms
- Booking shows wrong date
- Time shows in UTC instead of local
- Timestamp mismatch

### Causes
1. Timezone difference
2. Server clock wrong
3. Frontend sending wrong date format

### Solutions
```javascript
// The system uses:
// Date format: YYYY-MM-DD (ISO format)
// Time stored as: startHour (number 0-23), endHour (number 0-23)

// Current implementation:
// Date: new Date().toISOString().slice(0, 10)
// This is correct

// If timestamp wrong:
// 1. Check system clock (Windows clock)
// 2. Check server time: new Date() in backend
// 3. MongoDB stores UTC, display converts to local

// No fix needed usually - this is working correctly
```

---

## ✅ VERIFICATION - System is Healthy When You See

### Backend Terminal
```
🚀 Server running on port 5000
✅ MongoDB Connected
(no red error messages)
```

### Admin Panel Logs
```
📥 Fetching orders...
✅ Orders found: 1
```

### Browser Console
```
(no red error messages)
(only warnings are okay)
```

### Network Tab
```
POST /api/bookings - Status: 200
GET /api/admin/orders - Status: 200
(blue success indicators)
```

---

## 🆘 EMERGENCY RESTART

If everything seems broken:

```powershell
# Step 1: Stop all processes
Get-Process -Name node | Stop-Process -Force

# Step 2: Clear cache
Remove-Item -Path "$env:TEMP\*" -Recurse -Force -ErrorAction SilentlyContinue

# Step 3: Restart backend
cd "C:\Users\user\OneDrive\Desktop\princess\pastelservice---cute-booking-app\backend"
node server.js

# Step 4: In another terminal, restart frontend
cd "C:\Users\user\OneDrive\Desktop\princess\pastelservice---cute-booking-app"
npm run dev

# Step 5: Clear browser cache
# Ctrl+Shift+Del → Select all → Clear

# Step 6: Go to http://localhost:3000
# Logout and login again
```

---

## 🔍 DEBUG MODE

To see detailed logs:

```javascript
// In App.tsx, add before fetch:
console.log('🔍 Sending booking:', {
  serviceId,
  date,
  startHour: newOrder.startHour,
  endHour: newOrder.endHour,
});

// In backend/routes/bookings.js, add in POST:
console.log('📥 Booking request:', {
  userId: req.user.userId,
  serviceId: req.body.serviceId,
  date: req.body.date,
  startHour: req.body.startHour,
  endHour: req.body.endHour,
});
console.log('✅ Booking saved:', b);
```

---

## 📞 GETTING MORE HELP

### Check These Files
1. COMPLETE_INTEGRATION_REPORT.md - Technical details
2. TESTING_QUICKSTART.md - Step-by-step guide
3. BOOKING_TEST_GUIDE.md - API reference

### Check These Locations
1. Browser Console (F12)
2. Backend Terminal
3. Network Tab (F12)
4. MongoDB Atlas

### Still Stuck?
1. Check all files are saved
2. Restart both servers
3. Clear all caches
4. Try with different browser
5. Check all prerequisites installed

---

## ✅ You'll Know It's Fixed When

- [x] No error messages in console
- [x] Backend shows success logs
- [x] Booking appears in Admin Panel
- [x] All details are correct
- [x] Can repeat process multiple times
- [x] No unexpected behaviors

---

**Last Updated**: January 27, 2026
**Covered Scenarios**: 10 most common errors
**Solutions Provided**: For each error

🎀 All systems working now! 🎀
