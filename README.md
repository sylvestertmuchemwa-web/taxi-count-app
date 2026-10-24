# Taxi Count — GitHub Pages prototype

This is a static, phone-friendly prototype for the Taxi Count minibus taxi app. It has no build step or dependencies.

## Publish it with GitHub Pages

1. Create a GitHub repository for the app.
2. Extract the ZIP and upload **all included files directly into the repository root**. `index.html` must be at the root, alongside `styles.css` and `app.js`.
3. In the repository, open **Settings → Pages**.
4. Under **Build and deployment**, choose **Deploy from a branch**, select the `main` branch and `/(root)`, then save.
5. Open the Pages URL GitHub provides. It may take a short time for the first deployment to appear.

## Try the passenger flow

Choose a route, set pickup and destination, choose seats, then select **Request a taxi**. Confirm **Check in — I’m in the taxi**, then start the trip. Passenger status follows green request → yellow checked in → red travelling.

## Try the manual driver fare flow

1. Open **Driver desk** and go online.
2. Accept a request and start the trip.
3. Enter the **fare charged** in the driver's fare field.
4. Enter the **amount the passenger paid** in the cash received field. The prototype calculates change automatically.
5. Select **Record cash received**, then **Complete trip**. The trip history records the fare, payment received, and change.

## Important prototype limits

The website is a front-end prototype. Its sample routes, taxi locations, passenger location signals, and requests are demo data saved in the browser on that device. It does not alert real taxis or sync activity between phones. Card and wallet entries are demo-only and do not charge a payment method. The QR files identify a demo taxi; an app-install QR needs the public Pages URL after deployment. Live GPS, accounts, shared requests, QR scanning, and real payments need backend and service connections.
