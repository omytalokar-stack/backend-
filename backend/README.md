# Pastel Service - Booking App Backend

## Setup Instructions

### 1. Update .env file
Edit `.env` file with your MongoDB Atlas connection string:
```
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/pastel-service?retryWrites=true&w=majority
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Run the Server
```bash
npm start
```

For development with hot reload:
```bash
npm run dev
```

---

## API Endpoints

### 1. Send OTP
**POST** `/api/auth/send-otp`

Request:
```json
{
  "phone": "9876543210"
}
```

Response:
```json
{
  "message": "OTP sent successfully",
  "isNew": true
}
```

---

### 2. Verify OTP
**POST** `/api/auth/verify-otp`

Request:
```json
{
  "phone": "9876543210",
  "otp": "123456"
}
```

Response:
```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "65a1b2c3d4e5f6g7h8i9j0k1",
    "phone": "9876543210",
    "role": "user",
    "isSetupComplete": false,
    "nickname": null,
    "avatarUrl": null
  }
}
```

---

### 3. Setup Profile
**POST** `/api/auth/setup-profile`

Headers:
```
Authorization: Bearer <JWT_TOKEN>
```

Request:
```json
{
  "nickname": "Priya",
  "avatarUrl": "https://example.com/avatar.jpg"
}
```

Response:
```json
{
  "message": "Profile setup completed",
  "user": {
    "id": "65a1b2c3d4e5f6g7h8i9j0k1",
    "phone": "9876543210",
    "nickname": "Priya",
    "avatarUrl": "https://example.com/avatar.jpg",
    "role": "user",
    "isSetupComplete": true
  }
}
```

---

## Features

✅ Phone + OTP Authentication
✅ JWT Token Generation (30 days validity)
✅ MongoDB Atlas Integration
✅ User Profile Setup
✅ Admin Role Assignment (Phone: 8767619160)
✅ Mock SMS OTP Display in Terminal
✅ Clean Architecture (Controllers, Routes, Models)

---

## Special Features

- **Admin Phone**: Number `8767619160` automatically gets admin role
- **OTP Validity**: 10 minutes
- **JWT Expiry**: 30 days
- **Mock SMS**: OTP is logged to terminal for testing
"# princess" 
"# princess" 
"# princess" 
