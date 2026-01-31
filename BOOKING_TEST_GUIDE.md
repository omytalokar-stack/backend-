# 🎀 Complete Booking Flow Test Guide

## ✅ Current System Status

### Backend (Port 5000)
- **Status**: ✅ Running
- **MongoDB**: ✅ Connected
- **CORS**: ✅ Configured for localhost:3000
- **API Base**: http://localhost:5000

### Frontend (Port 3000)
- **Status**: ✅ Running
- **API Base URL**: http://localhost:5000 (correctly configured)

---

## 🔍 API Endpoints Reference

### Authentication
- `POST /api/auth/google-login` - Google login
- `GET /api/auth/me` - Get current user
- `POST /api/auth/mark-offer-used` - Mark offer as used

### Bookings
- `GET /api/bookings/available?serviceId=X&date=Y` - Get available time slots
- `POST /api/bookings` - Create a new booking
  - Required headers: `Authorization: Bearer {token}`
  - Required body: `{ serviceId, date, startHour, endHour }`

### Admin (requires admin auth)
- `GET /api/admin/orders` - Fetch all bookings
- `GET /api/admin/services` - Fetch all services
- `GET /api/admin/reels` - Fetch all reels
- `GET /api/admin/users` - Fetch all users
- `POST /api/admin/services` - Create service
- `POST /api/admin/upload` - Upload file

---

## 📋 Step-by-Step Booking Test

### 1️⃣ Login to App
```
URL: http://localhost:3000
1. Click Login
2. Use Google Sign-In or test credentials
3. Verify token stored in localStorage
```

### 2️⃣ View Services
```
1. Home screen should load services from /api/admin/services
2. Click on any service to view details
```

### 3️⃣ Check Available Slots
```
When booking form appears:
1. API call: GET /api/bookings/available?serviceId={id}&date={today}
2. Should return array of available time slots
3. If slots list shows: ✅ Available slots endpoint working
```

### 4️⃣ Submit Booking
```
Form fields:
- Name: Any name
- Address: Any address
- Time Slot: Select any slot
- COD: Toggle on/off

Click "Book Now"
↓
Frontend sends: POST /api/bookings
  Headers: { Authorization: Bearer {token} }
  Body: { serviceId, date, startHour, endHour }
↓
Backend response: { _id, userId, serviceId, date, ... }
↓
Success alert: "✅ Booking confirmed! Refresh Admin Panel Orders to see it"
```

### 5️⃣ Verify in Admin Panel
```
1. Go to Admin Panel (click admin icon)
2. Click "Orders" section
3. Should see the booking you just created
4. Booking shows: User name, Service name, Date, Status (Pending)
```

---

## 🧪 Testing Checklist

- [ ] Backend server running on port 5000
- [ ] Frontend running on port 3000
- [ ] MongoDB connected (check backend logs)
- [ ] Login works (Google or manual)
- [ ] Services load in home screen
- [ ] Available slots API returns data
- [ ] Booking form accepts input
- [ ] Booking POST request succeeds
- [ ] Order appears in Admin Panel
- [ ] Can see order details (user, service, date)

---

## 🐛 Troubleshooting

### Booking form doesn't appear
- Check: Is service loaded? Check console for service ID
- Fix: Refresh page

### "Failed to fetch" error
- Check: Backend running on port 5000?
- Fix: Start backend: `cd backend && node server.js`

### CORS error in console
- Check: Is API_BASE set to `http://localhost:5000`?
- Check: Backend CORS config includes `http://localhost:3000`
- Fix: Already configured in server.js

### Booking succeeds but doesn't appear in Admin Panel
- Check: Admin user has proper auth token
- Check: Booking data saved to MongoDB
- Fix: Refresh admin panel

### No services loading
- Check: Admin services endpoint: `GET http://localhost:5000/api/admin/services`
- Check: Auth token is valid
- Fix: Login with admin account

---

## 📊 Data Flow Diagram

```
User Form Input
      ↓
handleBookingConfirm() [App.tsx:202]
      ↓
POST /api/bookings
  - Headers: Authorization
  - Body: { serviceId, date, startHour, endHour }
      ↓
Backend: bookings.js (POST /)
  - Verify slot availability
  - Create Booking document
  - Save with userId from JWT
      ↓
Response: { _id, userId, serviceId, ... }
      ↓
Frontend: Update local state + show success
      ↓
User navigates to My Orders / Admin Panel
      ↓
GET /api/admin/orders
  - Populate user and service details
  - Return all bookings
      ↓
Admin Panel displays orders in Orders tab
```

---

## 🔧 Key Code Locations

| Component | File | Lines | Purpose |
|-----------|------|-------|---------|
| Booking Form | `BookingPage.tsx` | 1-160 | Collect booking details |
| Booking Submission | `App.tsx` | 202-250 | Send booking to backend |
| Backend Booking | `backend/routes/bookings.js` | 28-42 | Create booking in DB |
| Admin Orders Fetch | `backend/routes/admin.js` | 180-191 | Fetch all bookings |
| Admin Panel | `App.tsx` | 263-400+ | Display admin interface |

---

## ✅ Expected Behavior After Fix

1. **Booking Created** ✅
   - Data saved to MongoDB Booking collection
   - User ID automatically captured from JWT
   - Status: "Pending"

2. **Admin Sees Order** ✅
   - GET /api/admin/orders returns booking
   - Order details populated (user name, service name)
   - Displays in Orders tab

3. **Real-time Update** ✅
   - No page refresh needed (optional)
   - Data refreshes on tab change

---

## 📝 Notes

- **API Base URL**: Now correctly set to `http://localhost:5000` in all components
- **CORS**: Backend accepts requests from `http://localhost:3000`
- **Booking Model**: `{ userId, serviceId, date, startHour, endHour, status, createdAt, updatedAt }`
- **Auth**: JWT token stored in localStorage, passed in Authorization header
- **File Uploads**: Max 500MB, uploaded to `/backend/uploads/`

---

**Last Updated**: January 27, 2026
**Status**: ✅ Ready for Testing
