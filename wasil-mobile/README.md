# Wasil Mobile Apps 📱

React Native mobile applications for **Wasil** - a ride-hailing service for Juba, South Sudan.

## 🎯 Overview

This monorepo contains two mobile applications:
- **Wasil Rider** - For passengers to request rides
- **Wasil Driver** - For drivers to accept rides and earn money

Both apps share common components, services, and utilities through the `shared` package.

## 📂 Project Structure

```
wasil-mobile/
├── rider-app/              # Rider mobile app
│   ├── android/            # Android native code
│   ├── ios/                # iOS native code
│   └── src/                # React Native source
│       ├── screens/        # Screen components
│       ├── components/     # App-specific components
│       ├── navigation/     # Navigation configuration
│       └── store/          # Redux store
│
├── driver-app/             # Driver mobile app
│   ├── android/
│   ├── ios/
│   └── src/
│       ├── screens/
│       ├── components/
│       ├── navigation/
│       └── store/
│
└── shared/                 # Shared code between apps
    └── src/
        ├── api/            # API client (Axios)
        ├── services/       # Business logic services
        ├── constants/      # App constants
        ├── theme/          # UI theme (colors, fonts)
        └── locales/        # Translations (5 languages)
```

## 🚀 Getting Started

### Prerequisites

- Node.js >= 18.0.0
- npm or yarn
- React Native CLI
- Android Studio (for Android development)
- Xcode (for iOS development, macOS only)
- CocoaPods (for iOS)

### Installation

```bash
# Clone the repository
git clone https://github.com/your-repo/wasil.git
cd wasil/wasil-mobile

# Install dependencies
npm install

# For iOS, install pods
cd rider-app/ios && pod install && cd ../..
cd driver-app/ios && pod install && cd ../..
```

### Running the Apps

**Rider App:**
```bash
# Android
npm run rider:android

# iOS
npm run rider:ios

# Start Metro bundler
npm run rider:start
```

**Driver App:**
```bash
# Android
npm run driver:android

# iOS
npm run driver:ios

# Start Metro bundler
npm run driver:start
```

## 🎨 Features

### Rider App Features
- ✅ Phone OTP authentication
- ✅ Request rides (Boda Boda, Standard, Premium)
- ✅ Real-time driver tracking
- ✅ Multiple payment methods (Cash, MTN Money, Zain Cash, Card)
- ✅ Ride history
- ✅ Saved places (Home, Work)
- ✅ Rating & feedback
- ✅ SOS emergency button
- ✅ Multi-language support (English, Arabic, Dinka, Nuer, Bari)

### Driver App Features
- ✅ Go online/offline
- ✅ Accept/decline ride requests
- ✅ Navigation to pickup & dropoff
- ✅ Background location tracking
- ✅ Earnings dashboard
- ✅ Ride history
- ✅ Document verification
- ✅ Rating system

## 🌍 Localization

The apps support 5 languages commonly used in Juba, South Sudan:

| Code | Language | Native Name |
|------|----------|-------------|
| en | English | English |
| ar | Arabic (Juba) | العربية |
| din | Dinka | Thuɔŋjäŋ |
| nue | Nuer | Naath |
| bri | Bari | Bari |

Translations are located in `shared/src/locales/`.

## 💰 Pricing Configuration

All prices are in **South Sudanese Pound (SSP)**. Default rates:

| Ride Type | Base Fare | Per KM | Per Min |
|-----------|-----------|--------|---------|
| Boda Boda | 500 SSP | 200 SSP | 30 SSP |
| Standard | 500 SSP | 300 SSP | 50 SSP |
| Premium | 500 SSP | 500 SSP | 80 SSP |

**Minimum Fare:** 1,000 SSP

**Surge Pricing:**
- Morning rush (7-9 AM): 1.3x
- Evening rush (5-7 PM): 1.3x
- Night (10 PM - 5 AM): 1.5x + 500 SSP safety fee

**Rainy Season (April-October):** 1.5x multiplier

## 📱 Shared Services

### API Client (`shared/src/api/client.js`)
Axios-based HTTP client with:
- Automatic token injection
- Token refresh on 401
- Request/response logging
- Error handling

### Auth Service (`shared/src/services/AuthService.js`)
- Phone OTP verification
- Profile management
- Token storage

### Socket Service (`shared/src/services/SocketService.js`)
Real-time communication for:
- Driver location updates
- Ride status changes
- Chat messages

### Location Service (`shared/src/services/LocationService.js`)
- GPS tracking
- Distance calculation
- Service area validation (15km radius from Juba center)

### Ride Service (`shared/src/services/RideService.js`)
- Fare estimation
- Ride request/cancel
- Rating submission
- Saved places

## 🎨 Theme

Colors inspired by the South Sudan flag:
```javascript
primary: '#00A86B',     // Green
secondary: '#FFD700',   // Gold
accent: '#E31C23',      // Red
```

## 🔒 Safety Features

- **SOS Button**: Quick access to emergency contacts (Police: 777, Ambulance: 997)
- **Share Ride**: Share live ride status with trusted contacts
- **Night Safety Fee**: Additional fee and verification for night rides
- **Driver Verification**: National ID, license, and police clearance required

## 📦 Building for Production

### Android

```bash
# Rider App
cd rider-app
npm run build:android:apk

# Output: android/app/build/outputs/apk/release/app-release.apk
```

### iOS

1. Open `rider-app/ios/WasilRider.xcworkspace` in Xcode
2. Select "Generic iOS Device"
3. Product > Archive
4. Distribute App

## 🔧 Configuration

### Environment Variables

Create `.env` files in each app directory:

```env
API_URL=https://api.wasil.app
SOCKET_URL=https://socket.wasil.app
GOOGLE_MAPS_API_KEY=your_key_here
```

### Firebase Setup

1. Create Firebase project
2. Download `google-services.json` (Android) and `GoogleService-Info.plist` (iOS)
3. Place in respective app directories

### Google Maps

Add your API key:
- Android: `android/app/src/main/AndroidManifest.xml`
- iOS: `ios/AppDelegate.m`

## 📋 App Screens

### Rider App
1. Welcome & Language Selection
2. Phone Number Input
3. OTP Verification
4. Profile Setup
5. Home (Map with destination search)
6. Ride Type Selection
7. Fare Estimate
8. Finding Driver
9. Driver En Route
10. Ride In Progress
11. Ride Complete & Rating

### Driver App
1. Onboarding & Document Upload
2. Home (Online/Offline toggle)
3. Ride Request Modal
4. Navigation to Pickup
5. Waiting for Rider
6. Ride In Progress
7. Ride Complete
8. Earnings Dashboard

## 🧪 Testing

```bash
# Run tests
npm test

# Run linter
npm run lint
```

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## 📄 License

This project is proprietary software for Wasil ride service.

## 📞 Support

For support, contact the Wasil development team.

---

Built with ❤️ for Juba, South Sudan 🇸🇸
