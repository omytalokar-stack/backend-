# MongoDB Base64 Upload Guide ✅

## Configuration Status

### ✅ 1. Backend (server.js)
- **Body Size Limit**: 50MB (allows large videos)
- **URL Encoding Limit**: 50MB (supports video uploads)
- **CORS Policy**: Enabled for localhost:3000 and localhost:3001
- **Status**: ✅ READY

```javascript
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3001'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true
}));
```

### ✅ 2. Upload Endpoint (backend/routes/admin.js)
- **Endpoint**: POST `/api/admin/upload`
- **Middleware**: Multer (50MB file size limit)
- **Process**: File → Base64 String → JSON Response
- **Returns**: `{ url: "data:image/png;base64,..." }`
- **Status**: ✅ READY

```javascript
router.post('/upload', authenticateToken, ensureAdmin, upload.single('file'), async (req, res) => {
  const b64 = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
  res.json({ url: b64 });
});
```

### ✅ 3. Service Upload (src/admin/ServiceManager.tsx)
- **Method**: FormData → POST `/api/admin/upload` → Base64 → MongoDB
- **Image Field**: Stores Base64 string in `imageUrl`
- **Video Field**: Stores Base64 string in `videoUrl`
- **Data Save**: POST `/api/admin/services` with imageUrl + videoUrl
- **Status**: ✅ READY

```typescript
const uploadViaBackend = async (file: File) => {
  const fd = new FormData();
  fd.append('file', file);
  const r = await fetch(`${API_BASE}/api/admin/upload`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token!}` },
    body: fd
  });
  if (r.ok) {
    const d = await r.json();
    return d.url as string; // Returns Base64 string
  }
};
```

### ✅ 4. Reel Upload (src/admin/ReelsManager.tsx)
- **Method**: FormData → POST `/api/admin/upload` → Base64 → MongoDB
- **Video Field**: Stores Base64 string in `videoUrl`
- **Description**: Stored in `description`
- **Data Save**: POST `/api/admin/reels` with videoUrl + description
- **Status**: ✅ READY

### ✅ 5. MongoDB Models
**Service.js**:
```javascript
imageUrl: { type: String, default: '' },  // Stores Base64 image
videoUrl: { type: String, default: '' },  // Stores Base64 video
```

**Reel.js**:
```javascript
videoUrl: { type: String, default: '' },  // Stores Base64 video
```

## Testing Steps

### Test 1: Add Service with Image
1. Go to Admin Panel → Services
2. Click Hamburger Menu → Services
3. Fill form:
   - Name: "Test Service"
   - Description: "Test Description"
   - Duration: 60 min
   - Price: ₹100
4. Upload Image: Click "Choose File" button
5. Click Submit
6. Check Console: Should see success (no CORS, no 413 errors)
7. MongoDB: Service should have `imageUrl` with `data:image/...;base64,...` string

### Test 2: Add Service with Video
1. Same as Test 1 but also upload Video
2. Click Submit
3. MongoDB: Service should have both `imageUrl` and `videoUrl` with Base64 strings

### Test 3: Add Reel
1. Go to Admin Panel → Reels
2. Click Hamburger Menu → Reels
3. Click FAB Button (+) to add form
4. Upload Video: Click "Choose File"
5. Add Description: "Test Reel"
6. Click Submit
7. MongoDB: Reel should have `videoUrl` with `data:video/...;base64,...` string

## Expected Behavior

### On Upload Success
- ✅ No CORS errors
- ✅ No 413 Payload Too Large errors
- ✅ Base64 string returned from backend
- ✅ Data saved to MongoDB
- ✅ Form clears automatically
- ✅ List refreshes showing new item

### On Upload Error
- Console shows error message
- Form doesn't clear
- Data not saved

## Troubleshooting

### Error: "CORS policy: No 'Access-Control-Allow-Origin' header"
- **Fix**: Ensure `origin: ['http://localhost:3000']` in server.js CORS config
- **Status**: Already configured ✅

### Error: "413 Payload Too Large"
- **Fix**: Ensure `limit: '50mb'` in express.json()
- **Status**: Already configured ✅

### Error: "Failed to upload file"
- **Cause**: File too large (>50MB) or invalid format
- **Fix**: Use smaller files or reduce video resolution

### Images/Videos not displaying
- **Cause**: Base64 strings too large for UI rendering
- **Fix**: Compress images/videos before uploading

## File Sizes
- **Max Image Size**: ~5MB (Base64 becomes ~7MB)
- **Max Video Size**: ~50MB (upload limit)
- **Recommended Image**: <2MB (becomes <3MB Base64)
- **Recommended Video**: <20MB (becomes <27MB Base64)

## Architecture

```
Frontend (React)
    ↓
File Input
    ↓
FormData (binary file)
    ↓
POST /api/admin/upload (Multer processes)
    ↓
Backend converts to Base64
    ↓
Returns { url: "data:...;base64,..." }
    ↓
Frontend gets Base64 string
    ↓
POST /api/admin/services (with Base64 imageUrl/videoUrl)
    ↓
MongoDB stores Base64 string directly
    ↓
✅ Complete!
```

## Status Summary
- ✅ Firebase: REMOVED
- ✅ Cloudinary: REMOVED
- ✅ Base64 Conversion: WORKING
- ✅ MongoDB Storage: CONFIGURED
- ✅ CORS: ENABLED
- ✅ Body Limit: 50MB
- ✅ Ready for Testing

**Last Updated**: 2026-01-27
