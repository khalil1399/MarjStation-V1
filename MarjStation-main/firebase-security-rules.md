# Firebase Security Rules

## Realtime Database Rules

```json
{
  "rules": {
    ".read": false,
    ".write": false,
    
    "users": {
      "$uid": {
        ".read": "$uid === auth.uid",
        ".write": "$uid === auth.uid",
        ".validate": "newData.hasChildren(['email', 'name', 'createdAt', 'updatedAt'])"
      }
    },
    
    "restaurants": {
      ".read": true,
      "$restaurantId": {
        ".write": "auth != null"
      }
    },
    
    "categories": {
      ".read": true,
      "$categoryId": {
        ".write": "auth != null"
      }
    },
    
    "menuItems": {
      ".read": true,
      "$itemId": {
        ".write": "auth != null"
      }
    },
    
    "orders": {
      "$orderId": {
        ".read": "auth != null && (data.child('userId').val() === auth.uid || root.child('users').child(auth.uid).child('isAdmin').val() === true)",
        ".write": "auth != null && (!data.exists() || data.child('userId').val() === auth.uid || root.child('users').child(auth.uid).child('isAdmin').val() === true)"
      }
    }
  }
}
```

## Firebase Storage Rules

```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Helper function to check if user is authenticated
    function isAuthenticated() {
      return request.auth != null;
    }
    
    // Helper function to check if file is an image
    function isImage() {
      return request.resource.contentType.matches('image/.*');
    }
    
    // Helper function to check file size (max 5MB)
    function isValidSize() {
      return request.resource.size < 5 * 1024 * 1024;
    }
    
    // Restaurant images
    match /restaurants/{imageId} {
      allow read: if true;
      allow write: if isAuthenticated() && isImage() && isValidSize();
      allow delete: if isAuthenticated();
    }
    
    // Menu item images
    match /menu-items/{imageId} {
      allow read: if true;
      allow write: if isAuthenticated() && isImage() && isValidSize();
      allow delete: if isAuthenticated();
    }
    
    // Category images
    match /categories/{imageId} {
      allow read: if true;
      allow write: if isAuthenticated() && isImage() && isValidSize();
      allow delete: if isAuthenticated();
    }
    
    // User profile images
    match /profiles/{userId}/{imageId} {
      allow read: if true;
      allow write: if isAuthenticated() && 
                     request.auth.uid == userId && 
                     isImage() && 
                     isValidSize();
      allow delete: if isAuthenticated() && request.auth.uid == userId;
    }
  }
}
```

## How to Apply These Rules

### Realtime Database Rules:
1. Go to Firebase Console
2. Select your project (marjstation-49e10)
3. Navigate to **Realtime Database** → **Rules** tab
4. Copy and paste the JSON rules above
5. Click **Publish**

### Storage Rules:
1. Go to Firebase Console
2. Select your project
3. Navigate to **Storage** → **Rules** tab
4. Copy and paste the Storage rules above
5. Click **Publish**

## Security Features

### Database:
- **Users**: Only readable/writable by the user themselves
- **Restaurants/Categories/Menu Items**: Readable by everyone, writable by authenticated users
- **Orders**: Readable by order owner or admin, writable by order owner or admin

### Storage:
- **Public Read**: All uploaded images are publicly readable
- **Authenticated Write**: Only authenticated users can upload images
- **Image Validation**: Only image files allowed
- **Size Limit**: Maximum 5MB per file
- **User Profiles**: Users can only upload/delete their own profile pictures
