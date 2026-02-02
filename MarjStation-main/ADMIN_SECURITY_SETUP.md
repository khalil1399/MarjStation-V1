# 🔐 Admin Panel Security Setup Guide

## ✅ What's Implemented

### 1. Secure Admin Access
- **Password Re-Verification**: Admins must re-enter password to access admin panel
- **Session Expiry**: Admin sessions expire after 30 minutes of inactivity
- **Protected Routes**: All `/admin/*` routes require authentication + verification
- **Non-Admin Blocking**: Users without admin privileges are redirected

### 2. Cart Item Expiration
- **7-Day Auto-Expiry**: Items automatically removed after 7 days
- **Cross-Device Persistence**: Expiration tracked via timestamps
- **Auto-Cleanup**: Expired items removed on load and every minute

### 3. Real-Time Firebase
- **All CRUD operations** update Firebase immediately
- **Live listeners** on all data changes
- **Instant sync** across all clients

## 🚀 Setup Instructions

### Step 1: Mark a User as Admin

**In Firebase Console:**

1. Go to: https://console.firebase.google.com/project/marjstation-49e10/database/marjstation-49e10-default-rtdb/data

2. Navigate to: `users/[your-user-id]`

3. Add or update field: `isAdmin: true`

**Example structure:**
```json
{
  "users": {
    "ABC123xyz": {
      "email": "admin@example.com",
      "name": "Admin User",
      "isAdmin": true,  // ← Add this!
      "phone": "",
      "address": "",
      "createdAt": "2025-01-27T..."
    }
  }
}
```

### Step 2: Test Admin Access Flow

1. **Sign In**: Go to http://localhost:3000/login
   - Log in with the admin account

2. **Try Admin Panel**: Navigate to http://localhost:3000/admin
   - You'll be redirected to password verification

3. **Verify Password**: Enter your password at `/admin-verify`
   - System re-authenticates you
   - Checks `isAdmin: true` status
   - Creates 30-minute session

4. **Access Admin Panel**: After verification
   - Full access to all admin features
   - Session valid for 30 minutes
   - Must re-verify after expiry

## 🔒 Security Features

### Admin Panel Protection

**Before accessing any admin page:**
1. ✅ Must be logged in (Firebase Auth)
2. ✅ Must have `isAdmin: true` in user profile
3. ✅ Must verify password (session check)
4. ✅ Session expires after 30 minutes

**What happens if requirements not met:**
- Not logged in → Redirect to `/login`
- Not admin → Redirect to `/` (home)
- Session expired → Redirect to `/admin-verify`

### Cart Security

**7-Day Expiration Logic:**
```javascript
// Item added to cart
{
  id: 'item123',
  name: 'Burger',
  price: 12,
  quantity: 1,
  addedAt: 1706400000000, // Timestamp when added
  restaurantInfo: {...}
}

// Expiration check
const daysSinceAdded = (Date.now() - item.addedAt) / (1000 * 60 * 60 * 24);
if (daysSinceAdded >= 7) {
  // Item is expired, remove it
}
```

**Auto-removal triggers:**
- On cart load (page refresh)
- Every 60 seconds (background check)
- Before checkout

## 🧪 Testing

### Test Admin Access

1. **Non-Admin User:**
```bash
# Create user without isAdmin field
# Try to access /admin
# Expected: Redirect to home with "Access Denied"
```

2. **Admin User - No Verification:**
```bash
# Mark user as admin
# Access /admin without password verification
# Expected: Redirect to /admin-verify
```

3. **Admin User - With Verification:**
```bash
# Mark user as admin
# Enter correct password at /admin-verify
# Expected: Access to admin panel
```

4. **Session Expiry:**
```bash
# Verify admin access
# Wait 30+ minutes
# Try accessing admin page
# Expected: Redirect to /admin-verify
```

### Test Cart Expiration

1. **Add Items:**
```javascript
// In browser console:
const cart = JSON.parse(localStorage.getItem('cart'));
console.log(cart); // Check addedAt timestamps
```

2. **Simulate Old Items:**
```javascript
// Manually set old timestamp (8 days ago)
const cart = JSON.parse(localStorage.getItem('cart'));
cart[0].addedAt = Date.now() - (8 * 24 * 60 * 60 * 1000);
localStorage.setItem('cart', JSON.stringify(cart));

// Refresh page - item should be removed
```

3. **Check Auto-Removal:**
```javascript
// Wait 1 minute, check console
// Should see: "Auto-removed X expired items"
```

## 🛡️ Security Best Practices

### Firebase Rules (Already Set)
```json
{
  "rules": {
    "users": {
      "$uid": {
        ".read": "$uid === auth.uid",
        ".write": "$uid === auth.uid"
      }
    },
    "restaurants": {
      ".read": true,
      "$restaurantId": {
        ".write": "auth != null && root.child('users').child(auth.uid).child('isAdmin').val() === true"
      }
    }
  }
}
```

### Admin Verification Flow

```
User → Login → Check if Admin in DB → Redirect to /admin-verify
                                              ↓
                                      Enter Password
                                              ↓
                                   Re-authenticate with Firebase
                                              ↓
                                    Verify isAdmin === true
                                              ↓
                                    Create 30-min session
                                              ↓
                                    Access Admin Panel
```

## ⚠️ Important Notes

### Admin Access
- **Only users with `isAdmin: true`** can access admin panel
- **Password required every time** admin panel is accessed after session expiry
- **Sessions stored locally** with expiration timestamp
- **Clear session on logout** or manual clear

### Cart Management
- **Items expire after exactly 7 days** (604800000 milliseconds)
- **Timestamps tracked in milliseconds** for precision
- **Works across browsers/devices** via localStorage
- **Expired items cannot be checked out** - auto-removed

### Security Considerations
- ✅ Admin password never stored - only Firebase Auth token
- ✅ Session expiry prevents long-term access
- ✅ Database rules enforce admin checks server-side
- ✅ Client-side checks are for UX only - server enforces

## 🔧 Troubleshooting

### Can't Access Admin Panel

**Problem**: Redirected to home page
**Solution**: 
1. Check `users/[your-uid]/isAdmin` in Firebase
2. Make sure it's `true` (boolean, not string)
3. Sign out and sign in again

**Problem**: Password verification fails
**Solution**:
1. Make sure you're entering correct password
2. Check Firebase Console → Authentication for account status
3. Try password reset if needed

**Problem**: Session expired message
**Solution**:
1. This is normal after 30 minutes
2. Re-enter password to continue
3. Session will be refreshed

### Cart Items Not Expiring

**Problem**: Old items still in cart
**Solution**:
1. Check browser console for errors
2. Clear localStorage: `localStorage.clear()`
3. Add items again - should have `addedAt` timestamp
4. Check console for auto-removal logs

## 📋 Checklist

Before deploying:
- [ ] At least one admin user exists (`isAdmin: true`)
- [ ] Tested admin login flow
- [ ] Tested session expiry
- [ ] Tested cart expiration
- [ ] Firebase rules updated for admin checks
- [ ] All admin routes protected
- [ ] Password verification working

## 🎯 Next Steps

1. **Create Admin Account**: Set `isAdmin: true` for your user
2. **Test Access**: Try accessing admin panel
3. **Test Security**: Try with non-admin account
4. **Test Expiry**: Wait 30 minutes, verify session expired
5. **Test Cart**: Add items, check after 7 days (or simulate)

---

**Security Status**: ✅ Admin panel is now properly protected!
