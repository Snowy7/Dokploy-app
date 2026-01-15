# Dokploy Mobile App

A comprehensive mobile application for managing your Dokploy deployments, built with Expo and React Native.

## Features

- **Dark Mode UI**: Beautiful, clean dark-themed interface
- **Push Notifications**: Real-time notifications for deployments and server events
- **Project Management**: Create, view, and manage projects and environments
- **Application Control**: Deploy, redeploy, start, stop, and delete applications
- **Container Monitoring**: View and manage Docker containers
- **Deployment Tracking**: Monitor deployment status and history
- **Database Management**: Manage PostgreSQL, MySQL, MariaDB, MongoDB, and Redis databases
- **Settings**: Configure app preferences and account settings

## Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Expo CLI (`npm install -g expo-cli`)
- iOS Simulator (macOS) or Android Emulator

## Installation

1. Navigate to the mobile directory:
```bash
cd mobile
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm start
```

4. Run on your platform:
   - Press `i` for iOS simulator
   - Press `a` for Android emulator
   - Scan QR code with Expo Go app on your physical device

## Configuration

### API Endpoint

Update the API URL in `src/services/api.ts`:

```typescript
const API_URL = 'https://your-dokploy-instance.com/api';
```

### Push Notifications

1. Create an Expo account at https://expo.dev
2. Update the `projectId` in `app.json`:
```json
{
  "expo": {
    "extra": {
      "eas": {
        "projectId": "your-project-id"
      }
    }
  }
}
```

## Project Structure

```
mobile/
├── src/
│   ├── components/       # Reusable UI components
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   ├── StatusBadge.tsx
│   │   └── TextInput.tsx
│   ├── navigation/      # Navigation configuration
│   │   └── AppNavigator.tsx
│   ├── screens/         # App screens
│   │   ├── LoginScreen.tsx
│   │   ├── HomeScreen.tsx
│   │   ├── ProjectsScreen.tsx
│   │   ├── ContainersScreen.tsx
│   │   ├── ApplicationDetailScreen.tsx
│   │   ├── DeploymentsScreen.tsx
│   │   └── SettingsScreen.tsx
│   ├── services/        # API and services
│   │   ├── api.ts
│   │   ├── auth.ts
│   │   └── notifications.ts
│   ├── stores/          # State management (Zustand)
│   │   ├── authStore.ts
│   │   ├── projectStore.ts
│   │   ├── applicationStore.ts
│   │   └── containerStore.ts
│   ├── theme/           # Theme configuration
│   │   ├── colors.ts
│   │   └── index.ts
│   └── types/           # TypeScript types
│       └── index.ts
├── App.tsx              # App entry point
├── app.json             # Expo configuration
├── package.json
└── tsconfig.json
```

## Key Technologies

- **Expo**: React Native framework
- **React Navigation**: Navigation library
- **Zustand**: Lightweight state management
- **Axios**: HTTP client for API calls
- **Expo Notifications**: Push notifications
- **Expo SecureStore**: Secure token storage
- **TypeScript**: Type safety
- **date-fns**: Date formatting

## Available Scripts

- `npm start`: Start Expo development server
- `npm run android`: Run on Android
- `npm run ios`: Run on iOS
- `npm run web`: Run in web browser

## Building for Production

### Android (APK/AAB)

```bash
eas build --platform android
```

### iOS (IPA)

```bash
eas build --platform ios
```

## Features Implementation Status

- ✅ Authentication (Login/Logout)
- ✅ Projects Management
- ✅ Applications Control (Deploy, Redeploy, Start, Stop)
- ✅ Docker Containers Monitoring
- ✅ Deployments Tracking
- ✅ Settings & Profile
- ✅ Push Notifications Setup
- ⏳ Database Management (Partial)
- ⏳ Environment Management
- ⏳ Domain Management
- ⏳ Backup Management

## API Integration

The app integrates with the Dokploy API documented at:
https://admin.snowydev.xyz/api

Authentication is handled via Bearer tokens stored securely using Expo SecureStore.

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

MIT License

## Support

For issues and questions, please open an issue in the GitHub repository.
