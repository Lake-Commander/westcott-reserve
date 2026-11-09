# Westcott Reserve

Westcott Reserve is an educational digital-banking simulation built with React
Native and Expo. It demonstrates a banking-style mobile experience, including
account access, dashboard and account screens, transaction history, transfers,
cards, settings, and a responsive web landing page. It is a prototype only: it is
not a bank, and it does not conduct real financial transactions.

## Features

- React Native app for Android and iOS, with a web landing page.
- Email/password authentication and account profile data backed by Supabase.
- Persistent session storage on mobile.
- Home, cards, history, profile, transfers, bill payment, savings, and account
  settings screens.
- Redux-based app state and theme support.
- Landing-page sign-in and account actions enter the app's existing authentication
  flow.

## Requirements

- Node.js 20
- npm
- Android Studio/Android SDK and Java 17 for local Android builds
- A Supabase project for configured authentication and profile storage

## Local setup

1. Install dependencies:

   ```sh
   npm ci
   ```

2. Create a `.env` file in the repository root with your Supabase project URL and
   client key:

   ```dotenv
   EXPO_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
   EXPO_PUBLIC_SUPABASE_ANON_KEY=YOUR_SUPABASE_PUBLISHABLE_OR_ANON_KEY
   ```

   Replace the placeholders with the URL and publishable/anon client key from your
   Supabase project. Do not put a Supabase `service_role` key, database password,
   or other server-side secret in this file. Expo embeds `EXPO_PUBLIC_*` values in
   the client app, so they are visible to users; protect data with Supabase Row
   Level Security (RLS) policies.

   `.env` is ignored by Git and should remain local. Do not commit it. The Android
   GitHub Actions workflow gets the two Supabase values from repository Actions
   secrets instead.

3. Start the app:

   ```sh
   npm start
   ```

   Use the Expo CLI to open the app on a device/emulator, or run `npm run web` for
   the web experience.

## Android APK

The repository includes its Android native project. The Android workflow builds
from those checked-in files directly; it does not run `expo prebuild --clean`.
The Expo configuration and SDK-compatible dependencies were updated for reliable
native builds, including the splash-screen and font setup. The release Gradle
variant embeds the JavaScript bundle, so the APK runs without a Metro server.

### GitHub Actions build

The workflow is manually triggered at **Actions → Build Android Release APK →
Run workflow**. Add these repository secrets under **Settings → Secrets and
variables → Actions**:

- `EXPO_PUBLIC_SUPABASE_URL`
- `EXPO_PUBLIC_SUPABASE_ANON_KEY`
- `ANDROID_KEYSTORE_BASE64`
- `ANDROID_KEYSTORE_PASSWORD`
- `ANDROID_KEY_ALIAS`
- `ANDROID_KEY_PASSWORD`

Create a new production signing key locally and keep it private:

```sh
keytool -genkeypair -v -storetype PKCS12 -keystore westcott-release.p12 \
  -alias westcott-release -keyalg RSA -keysize 2048 -validity 10000
```

Use the alias and passwords entered during key creation for the matching GitHub
secrets. Encode the keystore as a single-line Base64 value for
`ANDROID_KEYSTORE_BASE64`:

```sh
base64 -w 0 westcott-release.p12
```

On macOS, use `base64 < westcott-release.p12 | tr -d '\n'`. Never commit or share
the keystore or its passwords. Keep a secure backup: all future app updates must
be signed with the same key. This new production key will not update installations
signed with the debug key.

The workflow builds an ARM64 and ARMv7 release APK, verifies that it contains the
embedded JavaScript bundle and has a valid APK signature, then uploads it as the
`WestcottReserve-Release-APK` workflow artifact. It fails if required secrets are
missing.

### Local production build

For a local production build, export the Supabase variables above and the
production signing settings below. Keep the keystore outside the repository:

```sh
export ANDROID_KEYSTORE_PATH=/absolute/path/to/westcott-release.p12
export ANDROID_KEYSTORE_PASSWORD='your-keystore-password'
export ANDROID_KEY_ALIAS='westcott-release'
export ANDROID_KEY_PASSWORD='your-key-password'

./android/gradlew -p android :app:assembleRelease \
  -PreactNativeArchitectures=arm64-v8a,armeabi-v7a
```

The APK is written to
`android/app/build/outputs/apk/release/app-release.apk`. Release builds require
production signing credentials and will not silently use the debug key. Install
on a connected Android device with:

```sh
adb install -r android/app/build/outputs/apk/release/app-release.apk
```

## Security and configuration notes

- Keep `.env`, keystores, passwords, and other private credentials out of Git.
- `EXPO_PUBLIC_*` values are client-side configuration, not private secrets.
- Never use a Supabase service-role key in the app; use the publishable/anon key
  with appropriate RLS policies.
- Removing `.env` from the current Git version does not erase it from older Git
  history. If it contained a credential that should not have been public, rotate
  that credential and consider removing it from repository history.
- The app is for educational and prototype use only. Do not use it to manage real
  money or sensitive financial accounts.
