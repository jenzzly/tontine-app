# Tontine Management App (SCDT)

A comprehensive mobile application for managing tontine (group savings) operations built with Expo and Firebase.

## Features

### 1. Member Management
- Track up to 15 members with detailed profiles
- Add, update, and deactivate members
- View contribution history per member
- Search and filter members

### 2. Contribution Tracking
- Manual contribution recording (Cash, MoMo, Bank Transfer)
- Real-time total balance calculation
- Payment history with filtering options
- Highlight members with pending contributions

### 3. Loan Management
- Loan request submission by members
- Approval/rejection workflow for admin/management
- Track borrowed amounts and balances
- Repayment monitoring
- Overdue loan detection
- Automatic penalty calculation (5% per month)

### 4. Role-Based Access Control
- **Admin**: Full system access, member management, transaction approval
- **Management Team**: Loan approval, report viewing (no settings access)
- **Member**: View personal contributions/loans, submit loan requests

### 5. Reports & Export
- Total contributions summary
- Individual member contribution reports
- Active and completed loans overview
- System balance reports
- PDF export functionality
- CSV export (optional)

### 6. Notifications
- Push notifications via Firebase Cloud Messaging
- Contribution reminders
- Loan approval/rejection alerts
- Overdue loan notifications

## Tech Stack

- **Framework**: Expo SDK 54
- **Language**: TypeScript
- **Backend**: Firebase (Auth, Firestore, Storage)
- **State Management**: Zustand
- **Navigation**: Expo Router
- **UI Components**: React Native + Lucide Icons
- **Styling**: NativeWind + StyleSheet

## Project Structure

```
/workspace
├── app/                      # Expo Router pages
│   ├── (auth)/              # Authentication screens
│   │   └── login.tsx
│   ├── (tabs)/              # Main app tabs
│   │   ├── index.tsx        # Dashboard
│   │   ├── members.tsx
│   │   ├── reports.tsx
│   │   └── profile.tsx
│   └── _layout.tsx          # Root layout
├── src/
│   ├── components/          # Reusable UI components
│   ├── context/             # Auth context & state
│   ├── hooks/               # Custom React hooks
│   ├── services/            # Firebase services
│   │   ├── firebase.ts
│   │   ├── authService.ts
│   │   ├── memberService.ts
│   │   ├── contributionService.ts
│   │   ├── loanService.ts
│   │   ├── notificationService.ts
│   │   └── reportService.ts
│   ├── types/               # TypeScript definitions
│   └── utils/               # Utilities & theme
├── package.json
├── app.json
├── tsconfig.json
├── babel.config.js
└── .env.example
```

## Setup Instructions

### Prerequisites
- Node.js 18+
- npm or yarn
- Expo CLI
- Firebase account

### Installation

1. **Clone and Install Dependencies**
```bash
cd /workspace
npm install
```

2. **Firebase Setup**
   - Create a Firebase project at [console.firebase.google.com](https://console.firebase.google.com)
   - Enable Authentication (Email/Password)
   - Create Firestore Database
   - Copy your Firebase config values

3. **Environment Configuration**
```bash
cp .env.example .env
```

Edit `.env` with your Firebase credentials:
```
EXPO_PUBLIC_FIREBASE_API_KEY=your_api_key
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
EXPO_PUBLIC_FIREBASE_APP_ID=your_app_id
```

4. **Start Development Server**
```bash
npm start
```

5. **Run on Device**
   - Scan QR code with Expo Go app (iOS/Android)
   - Or press `a` for Android emulator, `i` for iOS simulator

## Build for Production

### Android
```bash
npm run build:android
```

### iOS
```bash
npm run build:ios
```

## Future Enhancements

- **MoMo Integration**: Mobile Money payment processing
- **Biometric Authentication**: Face ID / Fingerprint login
- **Offline Mode**: Local data synchronization
- **Multi-language Support**: French/English localization
- **Advanced Analytics**: Charts and graphs for financial insights

## Security Notes

- All sensitive data stored in Firebase Secure Store
- Role-based access control enforced on client and server
- Environment variables for API keys (never commit `.env`)
- Regular security audits recommended

## License

Proprietary - SCDT Internal Use Only

## Support

For technical support, contact the development team.
