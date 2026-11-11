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
- Per-account balance visibility, in-app/push notification preferences, and
  device sign-in history.
- Transaction records generate account-specific in-app inbox notifications.
  Transaction-event push delivery is not configured; push remains available for
  admin-published announcements sent to opted-in devices.
- Admin tools for account suspension, audited indicative currency conversion,
  and notifications to opted-in push devices.
- Home, cards, history, profile, transfers, bill payment, savings, and account
  settings screens.
- Bank transfer picker with United States and European demo banks, plus a link
  to a public country-by-country SWIFT/BIC JSON directory.
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
   EXPO_PUBLIC_SUPABASE_KEY=YOUR_SUPABASE_PUBLISHABLE_OR_ANON_KEY
   # Optional until push notifications are configured:
   EXPO_PUBLIC_EAS_PROJECT_ID=YOUR_EAS_PROJECT_UUID
   ```

   Replace the placeholders with the URL and publishable/anon client key from your
   Supabase project. Do not put a Supabase `service_role` key, database password,
   or other server-side secret in this file. Expo embeds `EXPO_PUBLIC_*` values in
   the client app, so they are visible to users; protect data with Supabase Row
   Level Security (RLS) policies.

   `.env` is ignored by Git and should remain local. Do not commit it. The Android
   GitHub Actions workflow gets the two Supabase values from repository Actions
   secrets instead.

3. Apply the Supabase schema:

   Open the Supabase SQL Editor for your project and run the current `db.sql`.
   It creates or updates the app's RLS-protected tables, policies, triggers, and
   admin RPCs without dropping table data, and removes named legacy policies
   that granted overly broad profile/transaction access. It also creates an
   in-app notification for each positive-amount transaction. Back up the project
   first, especially if you have custom schema objects or policies.

4. Start the app:

   ```sh
   npm start
   ```

   Use the Expo CLI to open the app on a device/emulator, or run `npm run web` for
   the web experience.

### Email and authentication setup

Use these domain addresses:

- `no-reply@westcottreserve.com` as the verified sender for Supabase
  authentication and Brevo transactional emails. It can be a sender identity;
  it does not need to be a monitored mailbox.
- `support@westcottreserve.com` as a monitored mailbox or forwarding alias for
  customer-care replies.
- `support@westcott.com` as a monitored mailbox or forwarding alias for transfer
  restriction notices and replies.

Authenticate `westcottreserve.com` in Brevo by adding the DNS records Brevo
provides (including DKIM and its recommended SPF configuration). Verify
`no-reply@westcottreserve.com` as a Brevo sender. Do not overwrite existing SPF
records; merge provider includes as directed by your DNS host. Publish a DMARC
policy once the domain's sender records are correct.

For app-admin emails, add the following to GitHub Actions repository secrets
or variables. The APK workflow syncs them to the Vercel production project
before the website build and deployment:

- `BREVO_API_KEY`: Brevo API key; this must be a GitHub secret.
- `BREVO_SENDER_EMAIL`: `no-reply@westcottreserve.com`.
- `BREVO_SENDER_NAME`: `Westcott Reserve`.
- `BREVO_REPLY_TO_EMAIL`: optional; defaults to `support@westcottreserve.com`.

Also add `SUPABASE_SERVICE_ROLE_KEY` as a GitHub secret and the Supabase
URL/public key as either secrets or variables. Sender email/name and reply-to
are not credentials and may be GitHub variables. The workflow never passes
the service-role key or Brevo key into the APK build.

The admin email function sends customer-care replies and admin announcements
from the verified sender, with replies directed to customer care. The in-app
customer-care form stores a ticket in Supabase for the admin console. The
Contact Us screen opens the mail app for `support@westcottreserve.com`; its
message action opens the in-app form. That action is not a real-time chat.

To send Supabase Auth emails through Brevo, enable Custom SMTP in the Supabase
project's Authentication email/SMTP settings and enter the SMTP credentials
shown in Brevo (these are not the Brevo API key):

- Host: `smtp-relay.brevo.com`
- Port: `587` (STARTTLS)
- Username: the SMTP login shown in Brevo
- Password: the Brevo SMTP key
- Sender email: `no-reply@westcottreserve.com`
- Sender name: `Westcott Reserve`

In Supabase Auth email templates, use the `{{ .Token }}` variable for the
one-time code. The app uses the Confirmation template for sign-up verification
and the Password recovery template for password reset. Recovery calls
`resetPasswordForEmail`, verifies the submitted code as a `recovery` token, and
then updates the password. Enable email confirmation if you want new accounts
to verify their email before signing in. Set a suitable OTP expiry and
authentication email rate limits in Supabase, and ensure the project Site URL
and allowed redirect URLs are correct for your deployed website. SMTP credentials
belong only in Supabase's SMTP settings; never put them in the app or GitHub.

To turn on second-factor sign-in:

1. Enable the TOTP authenticator factor in the Supabase project's Auth
   multi-factor settings.
2. Apply the current `db.sql` so the app's `user_mfa_requirements` table and
   policies are present. For an existing database, run only the final
   **TOTP MFA migration** section at the end of `db.sql`.
3. Sign in, open **Settings → Security → Two-factor authentication**, and enroll
   an authenticator app. Keep access to that authenticator safe: a self-service
   lost-authenticator recovery flow is not implemented yet.

After TOTP is enabled, app and admin sign-in require the password followed by a
current authenticator code. The database policies also require the higher
assurance session for accounts that enabled MFA. Email OTP is used for sign-up
confirmation and password recovery, not as the sign-in second factor.

### Push notification setup

Push delivery requires an Expo EAS project and Android Firebase Cloud Messaging
configuration; without them, the APK still builds, but push enrollment reports
that setup is incomplete.

1. Create/link an EAS project and set `EXPO_PUBLIC_EAS_PROJECT_ID` to its project
   UUID in your local `.env` and as a GitHub Actions repository secret. The
   dynamic Expo config embeds this identifier in native builds.
2. Register the Android package `com.westcottreservebank.simulator` in Firebase,
   download its `google-services.json`, and place it at
   `android/app/google-services.json` locally. Keep this file out of Git.
3. Configure the Firebase FCM v1 service-account credentials for the EAS project
   and store a base64-encoded copy of `google-services.json` in the GitHub
   Actions secret `FIREBASE_ANDROID_CONFIG_BASE64` so workflow-built APKs can
   register device tokens. On Linux, create the value with
   `base64 -w 0 android/app/google-services.json` and paste its output into the
   secret (do not add the JSON file to Git).
4. Rebuild and install the APK, sign in, and enable Push Notifications. The OS
   permission prompt must be accepted. Admin-published notifications remain in
   the in-app inbox; push delivery is sent separately to opted-in, active
   accounts.

Currency estimates use dated ECB reference rates through Frankfurter, are
indicative only, and update the selected simulated account balance/currency
through an admin-only audited database function. They are not payment or
settlement rates.

## Android APK

The repository includes its Android native project. The Android workflow builds
from those checked-in files directly; it does not run `expo prebuild --clean`.
The Expo configuration and SDK-compatible dependencies were updated for reliable
native builds, including the splash-screen and font setup. The release Gradle
variant embeds the JavaScript bundle, so the APK runs without a Metro server.

### Vercel hosting

The web experience is a static Expo web export hosted on Vercel. The same
GitHub Actions workflow builds the signed APK, stages it at
`public/downloads/westcott-reserve.apk`, builds the Vercel deployment, and
deploys both the website and APK to production. The landing page's **Get the
app** link opens `/download-app`, where users can review the listing and download
the APK as `Westcott Reserve.apk`.

To enable deployment, create/import the Vercel project for this repository and
add these GitHub repository settings:

- Secret `VERCEL_TOKEN`: a Vercel access token with permission to deploy to the
  project.
- Repository variable `VERCEL_ORG_ID`: the Vercel team/user ID that owns the
  project.
- Repository variable `VERCEL_PROJECT_ID`: the Vercel project ID.

The project should use the repository's [vercel.json](./vercel.json) settings
(`npx expo export`, output directory `dist`). The workflow uses `vercel pull`
and a prebuilt production deployment, so the Expo build runs in GitHub Actions
with the configured Supabase secrets; no `.env` file is needed in Vercel or Git.
Each manual workflow run updates the production website and APK together. The
APK is not committed to the repository.

### GitHub Actions build

The workflow is manually triggered at **Actions → Build Westcott Reserve APK →
Run workflow**. In addition to the Vercel settings above, add these repository
secrets under **Settings → Secrets and variables → Actions**:

- `EXPO_PUBLIC_SUPABASE_URL`
- `EXPO_PUBLIC_SUPABASE_KEY` (or the legacy `EXPO_PUBLIC_SUPABASE_ANON_KEY`)
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
embedded JavaScript bundle and has a valid APK signature, then publishes it as
`Westcott Reserve.apk` in the `Westcott Reserve APK` workflow artifact. It also
deploys the site and downloadable APK to Vercel. The run fails if any required
Supabase, signing, or Vercel settings are missing.

### Local production build

For a local production build, export `EXPO_PUBLIC_SUPABASE_URL`,
`EXPO_PUBLIC_SUPABASE_KEY` (or the legacy `EXPO_PUBLIC_SUPABASE_ANON_KEY`), and
the production signing settings below. Keep the keystore outside the repository:

```sh
export ANDROID_KEYSTORE_PATH=/absolute/path/to/westcott-release.p12
export ANDROID_KEYSTORE_PASSWORD='your-keystore-password'
export ANDROID_KEY_ALIAS='westcott-release'
export ANDROID_KEY_PASSWORD='your-key-password'

./android/gradlew -p android :app:assembleRelease \
  -PreactNativeArchitectures=arm64-v8a,armeabi-v7a
```

The APK is written to
`android/app/build/outputs/apk/release/app-release.apk` by Gradle. The GitHub
Actions workflow additionally publishes the same signed APK as
`Westcott Reserve.apk`. Release builds require production signing credentials
and will not silently use the debug key. Install on a connected Android device
with:

```sh
adb install -r android/app/build/outputs/apk/release/app-release.apk
```

### Web admin console

The browser admin console is available at `/admin` on the deployed website. It
uses the existing Supabase sign-in and only grants access to user IDs explicitly
allowlisted in `public.admin_users`; creating a normal customer account does not
grant administrative access.

1. Apply the appended admin and app UI configuration sections in `db.sql` to
   the Supabase project after the existing profiles and transactions schema is
   installed. On a fresh project, apply the full SQL file once. If the base
   schema has already been applied, run only the appended sections to avoid
   recreating the original policies. The migration does not grant admin access
   to any account automatically.
2. Create the intended administrator account through Supabase Auth, then grant
   it from the Supabase SQL editor (replace the example address):

   ```sql
   SELECT public.admin_grant_access('admin@example.com');
   ```

   To revoke access, run:

   ```sql
   SELECT public.admin_revoke_access('admin@example.com');
   ```

   These functions can only be executed by the database administrator through
   SQL Editor, write to `admin_audit_log`, and prevent revoking the last admin.
   Never add a self-service admin sign-up or expose the `admin_users` table.
3. Add these values to GitHub Actions. The APK workflow syncs them to the
   Vercel production environment before building and deploying the website:
   - Secrets: `SUPABASE_SERVICE_ROLE_KEY`, `BREVO_API_KEY`; Android signing
     values and `VERCEL_TOKEN` are also secrets.
   - Secrets or variables: `EXPO_PUBLIC_SUPABASE_URL`,
     `EXPO_PUBLIC_SUPABASE_KEY` (or the legacy
     `EXPO_PUBLIC_SUPABASE_ANON_KEY` secret), `BREVO_SENDER_EMAIL`, and
     `BREVO_SENDER_NAME`.
   - Optional secret or variable: `BREVO_REPLY_TO_EMAIL`; the email API
     defaults to `support@westcottreserve.com`.

   Service-role, Brevo API, Android signing, and Vercel tokens remain
   server-side or in the build environment and are never passed into the APK
   as app credentials. Never commit `.env` or `.env.local`; local environment
   files are not uploaded to GitHub or Vercel.

The console can suspend or reactivate accounts, flag transactions, mark them
paused, answer
customer-care messages, publish in-app notifications, send Brevo emails, and
toggle the seeded Cards, Savings, Bill payments, and Transfers feature gates.
In **Accounts**, admins can also block outgoing transfers for one account. The
app then rejects transfer attempts with a support message, and the admin action
sends the customer an email directing them to `support@westcott.com`. Configure
that address as a working customer-support mailbox or forwarding alias.
Admin mutations are restricted to database functions and recorded in
`admin_audit_log`. A user's notification bell opens the in-app notification
feed. Brevo delivery is handled by the server-only
`/api/admin/send-email` function and requires the server variables above.

The **App appearance** section publishes a constrained server-driven
configuration for the home welcome/promotion cards, quick actions, brand accent
and background/card colors, and the sample bank list. The mobile app renders
only built-in components and allowlisted actions; administrators cannot upload
or execute code. Apply the app UI configuration SQL section before using these
editor controls. Published settings are fetched by signed-in users and refreshed
through Supabase Realtime when available.

This remains a prototype, not a financial operations system. Transaction amounts
are read-only in the console and emails; administrative emails cannot substitute
a different amount for the saved transaction amount. A transaction's `paused`
status is a review label, not a reversal or cancellation of a completed
transaction. Feature switches gate the app's corresponding screens (and the
transfer service), but are not a replacement for server-side controls in a
production financial system.

The bank picker includes sample United States and European options. Its link to
the [country-by-country SWIFT/BIC JSON directory](https://github.com/smowtion/swiftcode/tree/master/AllCountries)
opens an external dataset for reference; it is not an integrated or verified
payment-routing service. Transfers remain simulated and no real bank network is
connected.

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
