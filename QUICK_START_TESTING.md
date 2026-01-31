# 🚀 QUICK START TESTING GUIDE

## ✅ Both Servers Running

Frontend: **http://localhost:3000** ✅
Backend: **http://localhost:5000** ✅

---

## 1️⃣ TEST EDIT PROFILE (Name Change)

### Steps:
1. Go to **Profile** tab (bottom right)
2. Look for **✏️ edit icon** next to your name
3. Click the icon
4. Modal pops up with input field
5. Type new name (e.g., "Priya Singh")
6. Click **Save** button
7. Success alert appears ✅
8. Your name updates immediately

### What Happens Behind the Scenes:
- Frontend calls `PUT /api/auth/update-name`
- Backend updates MongoDB
- Response returns new name
- localStorage syncs
- Profile screen refreshes

---

## 2️⃣ TEST ADMIN NOTIFICATIONS (With Sound!)

### Steps:
1. Go to **Admin Panel** (Profile → Admin Panel button)
2. Click **Orders** in sidebar
3. See list of all bookings
4. Click any booking card
5. Modal opens with booking details
6. Click **🔔 Notify** button (blue)
7. **DING!** 🔊 Sound plays!
8. Success alert: "✅ Notification sent to [UserName]!"
9. Modal closes

### What Gets Sent:
```
Message: "Aap tayar ho jaiye, aapka service time aa gaya hai! Jaldi parlor mein aa jaiye. ✨"
Sound: 1000Hz sine wave (automatic web audio)
Stored In: MongoDB Notifications collection
Status: Marked as unread for user
```

### Verify It Worked:
- Open a **different user** account/window
- Go to their **Profile → Notifications** or click notification icon
- Notification appears in **Inbox** 📬
- Shows: Title, Message, Timestamp
- Has "Mark as Read" and "Delete" buttons
- Button to mark read **plays sound** 🔊

---

## 3️⃣ TEST INBOX/NOTIFICATIONS PAGE

### Open Inbox:
1. **Option A:** Profile tab → Click "Notifications" button
2. **Option B:** Profile tab → Menu → Click "Notifications"
3. **Option C:** When admin sends notification, user gets it instantly

### What You See:
- **Header:** "📬 Inbox" with unread count
- **Notification Cards:** Each shows:
  - Title (e.g., "Service Ready")
  - Message (user-friendly text)
  - Timestamp (in IST format)
  - "NEW" badge if unread
  - **Mark as Read** button (checkmark icon)
  - **Delete** button (trash icon)

### Actions Available:
1. **Mark as Read** ✅
   - Changes card appearance
   - Sound plays (Ding!)
   - Count decreases

2. **Delete** 🗑️
   - Removes notification
   - No confirmation (just deletes)
   - Count updates

3. **Delete All** 🗑️ (top button)
   - Confirmation dialog appears
   - Clears ALL notifications
   - Fresh empty state shows

### Empty State:
- Nice icon (🔔)
- Message: "No notifications yet!"
- Subtitle: "You'll get updates here"

### Auto-Refresh:
- Automatically fetches new notifications every **5 seconds**
- You'll see new admin notifications appear automatically
- No need to refresh page

---

## 4️⃣ VERIFY BOOKING SLOTS (Bonus Check!)

### Slots Always Show:
- **1 PM - 2 PM** ✅
- **2 PM - 3 PM** ✅
- **3 PM - 4 PM** ✅
- **4 PM - 5 PM** ✅
- **5 PM - 6 PM** ✅
- **6 PM - 7 PM** ✅

### Test at Different Times:
1. Try booking at **morning (4 AM)** → All slots show ✅
2. Try booking at **afternoon (2:30 PM)** → All slots show ✅
3. Try booking at **evening (8 PM)** → All slots show ✅
4. Try booking **tomorrow** → All slots show ✅

### Only Hidden When:
- Slot already booked by someone else
- That's it! No time restrictions!

---

## 🔧 API ENDPOINTS (For Reference)

### Notifications
```
GET  /api/notifications                  → Get all my notifications
POST /api/notifications/mark-read        → Mark one as read
POST /api/notifications/delete           → Delete one
POST /api/notifications/clear-all        → Delete all
POST /api/notifications/send (admin)     → Send notification
```

### Auth (Enhanced)
```
PUT /api/auth/update-name                → Update my name
POST /api/auth/setup-profile             → Setup profile (can include name)
```

### Admin
```
POST /api/admin/notify                   → Send notification to user
```

---

## 🧪 Test Scenarios

### Scenario 1: Complete User Journey
```
1. Login/Create account
2. Edit your name (Profile → ✏️)
3. Verify name saved
4. Open Notifications/Inbox (should be empty)
5. Have someone (or use admin) send you notification
6. See it appear in Inbox
7. Mark as read (sound plays!)
8. Delete it
```

### Scenario 2: Admin Power Flow
```
1. Login as admin (omrtalokar146@gmail.com)
2. Go to Admin Panel
3. Navigate to Orders
4. Select a booking
5. Click "Notify" button
6. Sound plays instantly
7. Switch to user account
8. Open Inbox
9. See notification appear (auto-refresh)
10. Mark read
11. Delete
```

### Scenario 3: Multiple Notifications
```
1. Admin sends 5 notifications
2. Inbox shows all 5 with "NEW" badges
3. Unread count = 5
4. Mark some as read
5. Count decreases
6. Delete some
7. Inbox updates in real-time
```

---

## 🎨 UI Visual Checks

### Edit Name Modal
- [ ] Appears as popup overlay
- [ ] Has semi-transparent backdrop
- [ ] Input field is focused
- [ ] Placeholder text visible
- [ ] Cancel & Save buttons visible
- [ ] Click outside closes? (No, click Cancel)

### Inbox Page
- [ ] Header shows "📬 Inbox"
- [ ] Unread count displays
- [ ] Notifications sorted newest first
- [ ] "Delete All" button visible
- [ ] Cards are nicely styled
- [ ] Spacing and colors match design

### Notification Card
- [ ] Title bold and clear
- [ ] Message readable
- [ ] Timestamp formatted nicely
- [ ] "NEW" badge colors right
- [ ] Buttons responsive
- [ ] Active state on button press

---

## 🔊 Sound Testing

### Should Hear:
- **Ding! 🔔** - When admin clicks Notify
- **Ding! 🔔** - When user marks as read
- No sound when deleting (by design)

### If No Sound:
1. Check browser volume (not muted)
2. Check device volume (not muted)
3. Try marking notification as read again
4. Web Audio API works on all modern browsers

---

## ✅ Success Criteria

- [ ] Edit name works and saves
- [ ] Name appears everywhere after editing
- [ ] Admin can send notification
- [ ] Sound plays when sending
- [ ] User sees notification in Inbox
- [ ] Notifications auto-refresh
- [ ] Mark as read works
- [ ] Delete works
- [ ] Delete all works
- [ ] Booking slots show 1-7 PM
- [ ] Can book at any time

---

## 🆘 Troubleshooting

### Issue: Edit Modal doesn't appear
**Solution:** Refresh page, make sure you're logged in

### Issue: Notification not showing for user
**Solution:** Check if user is logged in, refresh Inbox (or wait 5 secs for auto-refresh)

### Issue: No sound playing
**Solution:** Check browser volume, try different browser, check console for errors

### Issue: Slots not showing
**Solution:** Make sure API returns data, check Network tab in DevTools

### Issue: Name not updating
**Solution:** Check network response in DevTools, check token is valid

---

## 📊 What's Behind Each Feature

### Edit Name
- Frontend: Modal popup component
- Backend: PUT /api/auth/update-name endpoint
- Database: Updates user.name field
- Storage: Syncs to localStorage

### Notifications
- Frontend: Real-time polling every 5 seconds
- Backend: CRUD endpoints for notifications
- Database: Notification model with userId ref
- Sound: Web Audio API (no external files)

### Inbox
- Frontend: NotificationsScreen component
- Display: Ordered by newest first
- Actions: Mark read, delete individual, clear all
- Status: Unread count badge

---

## 🎯 Final Checklist

Before declaring success:

- [ ] Frontend runs without errors
- [ ] Backend runs on port 5000
- [ ] Can login and reach Profile
- [ ] Can edit name successfully
- [ ] Admin can send notifications
- [ ] Users receive notifications
- [ ] Inbox page works
- [ ] Sound plays correctly
- [ ] Booking slots show correctly
- [ ] No console errors

---

**Ready to test? Go to http://localhost:3000 and start exploring! 🚀**

**Questions? Check the THREE_FEATURES_COMPLETE.md file for detailed technical info!** 📚
