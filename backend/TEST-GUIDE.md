# Pastel Service Backend - Quick Test Guide

## Testing the API

### Step 1: Update .env with your MongoDB Atlas credentials
Get your connection string from MongoDB Atlas dashboard and update `.env`:
```
MONGODB_URI=mongodb+srv://your-username:your-password@cluster0.xxxxx.mongodb.net/pastel-service?retryWrites=true&w=majority
```

### Step 2: Start the server
```bash
npm start
```

You should see:
```
✅ MongoDB Connected
🚀 Server running on port 5000
```

### Step 3: Test the endpoints

**Test 1: Send OTP**
```bash
curl -X POST http://localhost:5000/api/auth/send-otp \
  -H "Content-Type: application/json" \
  -d '{"phone":"9876543210"}'
```

**Test 2: Verify OTP** (use OTP from terminal output)
```bash
curl -X POST http://localhost:5000/api/auth/verify-otp \
  -H "Content-Type: application/json" \
  -d '{"phone":"9876543210","otp":"123456"}'
```

**Test 3: Setup Profile** (replace TOKEN with the JWT from step 2)
```bash
curl -X POST http://localhost:5000/api/auth/setup-profile \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TOKEN" \
  -d '{"nickname":"Priya","avatarUrl":"https://example.com/avatar.jpg"}'
```

**Test 4: Admin Role** (use phone 8767619160)
```bash
curl -X POST http://localhost:5000/api/auth/send-otp \
  -H "Content-Type: application/json" \
  -d '{"phone":"8767619160"}'
```

Then verify to get admin role token.

---

## Project Structure
```
backend/
├── server.js                 # Main Express server
├── package.json             # Dependencies
├── .env                      # Environment variables
├── .gitignore               # Git ignore file
├── models/
│   └── User.js             # MongoDB User schema
├── controllers/
│   └── authController.js    # Auth logic (OTP, JWT)
├── routes/
│   └── auth.js             # Auth routes
└── middleware/
    └── auth.js             # JWT authentication
```

---

## Key Features Implemented

✅ **Phone + OTP System**: 6-digit OTP generated and displayed in terminal
✅ **JWT Authentication**: 30-day expiry tokens
✅ **MongoDB Integration**: User model with all required fields
✅ **Profile Setup**: Nickname and avatar URL storage
✅ **Admin Role**: Auto-assigned to phone 8767619160
✅ **Clean Architecture**: Separated controllers, routes, models
✅ **Error Handling**: Proper validation and error responses

---

## Environment Variables (.env)

```
PORT=5000
MONGODB_URI=your-mongodb-connection-string
JWT_SECRET=your-jwt-secret-key
NODE_ENV=development
```
