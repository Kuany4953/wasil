# Wasil Mobile Apps - Quick Start Guide 🚀

## Prerequisites

Before you can test the app, you need to install:

### Required Software:
1. **Node.js** (v18+) - [nodejs.org](https://nodejs.org)
2. **Watchman** - `brew install watchman` (macOS)
3. **Xcode** (for iOS) - Mac App Store
4. **Android Studio** (for Android) - [developer.android.com](https://developer.android.com/studio)
5. **CocoaPods** (for iOS) - `sudo gem install cocoapods`

## Step 1: Initialize React Native Projects

The `rider-app` and `driver-app` folders contain the source code but need React Native to be initialized. Run:

```bash
cd /Users/kuany/wasil.ssd/wasil/wasil-mobile

# Create Rider App
npx react-native@latest init WasilRider --directory rider-app-init --skip-install

# Create Driver App  
npx react-native@latest init WasilDriver --directory driver-app-init --skip-install

# Copy our source files into the initialized projects
cp -r rider-app/src rider-app-init/
cp rider-app/App.js rider-app-init/
cp rider-app/package.json rider-app-init/

cp -r driver-app/src driver-app-init/
cp driver-app/App.js driver-app-init/
cp driver-app/package.json driver-app-init/
```

## Step 2: Install Dependencies

```bash
# Install shared package
cd shared
npm install
cd ..

# Install Rider App dependencies
cd rider-app-init
npm install
cd ios && pod install && cd ..

# Install Driver App dependencies
cd ../driver-app-init
npm install
cd ios && pod install && cd ..
```

## Step 3: Run the Apps

### Run on iOS Simulator:
```bash
# Rider App
cd rider-app-init
npm run ios

# Driver App (in another terminal)
cd driver-app-init
npm run ios
```

### Run on Android Emulator:
```bash
# Start Android emulator first from Android Studio
# Then run:

# Rider App
cd rider-app-init
npm run android

# Driver App
cd driver-app-init
npm run android
```

### Run on Physical Device:

**iOS:**
1. Open `rider-app-init/ios/WasilRider.xcworkspace` in Xcode
2. Select your device from the device dropdown
3. Click Run ▶️

**Android:**
1. Enable Developer Options on your phone
2. Enable USB Debugging
3. Connect phone via USB
4. Run `npm run android`

## Quick Alternative: Expo (Easier Setup)

If React Native CLI setup is too complex, you can convert to Expo:

```bash
# Install Expo CLI
npm install -g expo-cli

# Create new Expo project
npx create-expo-app WasilRider
cd WasilRider

# Copy source files
cp -r ../wasil-mobile/rider-app/src ./
cp ../wasil-mobile/rider-app/App.js ./

# Install dependencies and run
npm install
npx expo start

# Scan QR code with Expo Go app on your phone
```

## Troubleshooting

### iOS: "Unable to boot simulator"
```bash
sudo xcode-select --switch /Applications/Xcode.app
```

### Android: "SDK location not found"
Create `android/local.properties`:
```
sdk.dir=/Users/YOUR_USERNAME/Library/Android/sdk
```

### Metro bundler issues
```bash
npx react-native start --reset-cache
```

## What You'll See

When the app runs, you'll see:

1. **Welcome Screen** - Maroon branded "W" logo with "Get started" button
2. **OTP Screen** - Phone number verification
3. **Home Screen** - Map with ride options (Wasil Boda, Wasil X, Wasil Select)

## Next Steps After Testing

1. Set up Google Maps API key
2. Configure backend server (ride-service)
3. Set up Firebase for push notifications
4. Test full ride flow with backend

---

**Need help?** The source code is fully functional - you just need to set up the React Native development environment!
