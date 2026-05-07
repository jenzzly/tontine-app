# Firebase Setup Guide

## Step 1: Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project" or "Create a project"
3. Enter project name (e.g., "tontine-app")
4. Follow the setup wizard
5. Enable Google Analytics (optional)

## Step 2: Register Your App

1. In Firebase Console, click on "Project Overview"
2. Click the web icon (`</>`) to add a web app
3. Register your app with nickname "Tontine App"
4. Copy the firebaseConfig object values

## Step 3: Enable Authentication

1. Go to Authentication in the left menu
2. Click "Get Started"
3. Enable "Email/Password" sign-in method
4. Click "Save"

## Step 4: Create Firestore Database

1. Go to Firestore Database in the left menu
2. Click "Create database"
3. Choose "Start in test mode" for development (we'll update rules later)
4. Select a location closest to your users
5. Click "Enable"

## Step 5: Configure Environment Variables

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Update `.env` with your Firebase config values from Step 2:
   ```
   EXPO_PUBLIC_FIREBASE_API_KEY=AIzaSy...
   EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
   EXPO_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
   EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
   EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
   EXPO_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abc123
   ```

## Step 6: Deploy Security Rules

1. Install Firebase CLI:
   ```bash
   npm install -g firebase-tools
   ```

2. Login to Firebase:
   ```bash
   firebase login
   ```

3. Initialize Firebase in your project:
   ```bash
   firebase init firestore
   ```
   - Choose "Use existing project"
   - Select your project
   - For rules file, enter: `firestore.rules`
   - For index file, you can skip (press Enter)

4. Deploy the security rules:
   ```bash
   firebase deploy --only firestore:rules
   ```

## Step 7: Create First Admin User

Since signup creates users with 'member' role by default, you need to manually create the first admin:

**Option A: Using Firebase Console**
1. Go to Authentication → Users
2. Add user manually with email/password
3. Note the User UID
4. Go to Firestore Database
5. Create a collection called `users`
6. Add a document with the User UID as document ID
7. Add fields:
   - `email`: (string) user's email
   - `fullName`: (string) user's full name
   - `phone`: (string) user's phone
   - `role`: (string) `admin`
   - `isActive`: (boolean) `true`
   - `createdAt`: (timestamp) current time
   - `updatedAt`: (timestamp) current time

**Option B: Using the App**
1. Sign up with your admin account
2. Use Firebase Console to manually change the role field to 'admin'

## Step 8: Test the App

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the development server:
   ```bash
   npm start
   ```

3. Scan QR code with Expo Go app or press 'a' for Android emulator, 'i' for iOS simulator

## Troubleshooting

### "Missing or insufficient permissions" Error
- Make sure you deployed the firestore.rules file (Step 6)
- Verify the user is authenticated before accessing data
- Check that the user document exists in Firestore with correct role

### App Crashes on Startup
- Verify all environment variables are set correctly in `.env`
- Check that Firebase project is properly configured
- Ensure all dependencies are installed

### Can't Login
- Verify Email/Password authentication is enabled in Firebase Console
- Check that user exists in both Authentication and Firestore
- Ensure user's `isActive` field is set to `true`

## Security Notes

- The provided `firestore.rules` implement role-based access control
- Admins have full access
- Management can create/update members, contributions, and approve loans
- Members can only view their own data and request loans
- Never commit `.env` file to version control
- Rotate your Firebase API keys periodically
