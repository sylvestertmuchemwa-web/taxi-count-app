# Taxi Count — Front-end prototype

Taxi Count is a mobile-first prototype for South African minibus taxi drivers. This version uses HTML, CSS, JavaScript and browser `localStorage`.

## Files

Keep all seven files together in one folder:

- `index.html` — page structure and controls
- `style.css` — responsive styling
- `script.js` — passenger counter, status, fare, trip and local-save behaviour
- `README.md` — this guide
- `manifest.json` — installable web-app metadata
- `service-worker.js` — caches the app shell for offline reopening after first load
- `icon.svg` — Taxi Count app icon

## Run it locally

1. Download all four files into the same folder named `taxi_count` (or any folder name you prefer).
2. Open `index.html` in a modern browser such as Chrome, Edge, Firefox or Safari.
3. For a phone test, copy the folder to a computer and serve it using a simple local web server, or host the files on a static host such as GitHub Pages.
4. Try adding and removing passengers, setting a passenger capacity, changing taxi status, adding fares, starting a shift and ending a trip.
5. Refresh the page. Data saved in that same browser should remain.

The app imports the DM Sans and Manrope fonts from Google Fonts when internet access is available. If the fonts cannot load, it uses fallback fonts.

The extra `manifest.json`, `service-worker.js`, and `icon.svg` files make this an installable Progressive Web App (PWA) when served from HTTPS (such as GitHub Pages). After opening the hosted app once, the app shell can be cached for offline reopening. Browser storage is still local to each device; offline caching does not create shared accounts or synchronization.

## What works in this prototype

- Responsive dashboard for mobile and desktop layouts.
- Manual passenger boarding and exiting counter.
- Passenger count cannot fall below zero.
- Optional capacity limit (1–100) and full indicator.
- Manual Available, Boarding and Travelling status controls.
- Taxi ID setting.
- Manual fare entry in South African Rand and automatic total calculation.
- Fare history with a confirmation before removing a fare.
- Shift start timestamp.
- End-trip confirmation, saved trip summary, and passenger counter reset.
- Confirmation before resetting a non-zero count.
- Browser-local persistence using `localStorage`.
- Nearby-taxi preview clearly marked **DEMO DATA**.
- Basic empty/error feedback and local/offline messaging.

## What does not work yet

This is a **front-end-only demo**. It is not yet a production app and it does not connect drivers to each other.

- No driver registration, sign-in or account recovery.
- No shared database or real-time taxi status updates.
- No actual nearby-taxi discovery, GPS or maps.
- No live vehicle verification or association/fleet administration.
- No cloud backup or synchronization between phones.
- No secure separation of different drivers' earnings, because this version has no user accounts.
- No route management, payment processing, expenses or profit calculation.
- The demo taxi entries are examples, not real registered taxis.
- Shift fares and trip history are local to one browser profile.

**Important:** browser local storage is not a secure private account store. Anyone with access to the same browser profile may be able to view or clear its data. Do not use this prototype for sensitive production information.

## Testing on two devices

### Current prototype

1. Open the prototype on Phone A and Phone B.
2. Change the passenger count or status on Phone A.
3. Notice that Phone B does not update automatically. Each device has its own browser storage.
4. This is expected: this prototype does not have a shared backend.

### Required test after backend setup

To support real multi-user tests, add authentication and a shared backend such as Supabase or Firebase. Then:

1. Create two separate driver accounts.
2. Register a different taxi under each account.
3. Sign in to Phone A as Driver A and Phone B as Driver B.
4. Change Taxi A's status on Phone A and verify that Phone B receives the database update.
5. Add fares for Driver A, then verify Driver B cannot read or modify those fares.
6. Turn off Phone A's internet connection and confirm that live data is shown as unavailable or stale; reconnect and verify recovery.
7. Test database authorization rules directly. Hiding buttons in the UI is not security.

Do not claim multi-phone synchronization until it is implemented and verified.

## Suggested next technical phase

Use one shared backend. Supabase is a reasonable option because it provides authentication, a hosted database and real-time features. The backend phase should include:

- `drivers` and `taxis` tables linked to authenticated user IDs.
- `trips` and `fares` tables with ownership enforced by database policies.
- Shared taxi status updates with timestamps and stale-status handling.
- Row-level security (RLS) so a driver can only read/write their own private records.
- Carefully limited read access to shared taxi status fields.
- Loading, error and reconnect states.
- A clear privacy/consent flow before any optional location sharing.

Never place a Supabase service-role key or other private server credential in front-end JavaScript. Public client configuration may be used only alongside correctly configured database policies and authentication.

## Hosting

The prototype can be hosted as a static website (for example, GitHub Pages) because it does not require a server to run. Hosting the front end does **not** add accounts, a shared database or real-time synchronization.
