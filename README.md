# BINTI DESIGNS

Luxury maison site. Public floor is quiet. The private floor is not linked.

## Firebase

Configuration is read from Vercel / Vite env:

- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`
- `VITE_FIREBASE_MEASUREMENT_ID`

Enable Google sign-in. Authorized domains must include the live host.

Publish [`firestore.rules`](firestore.rules): public may read looks and create inquiries; only `bintidesigns442@gmail.com` may write looks.

## Private floor

Open `/atelier-studio`. Sign in with Google as `bintidesigns442@gmail.com`. Any other account is signed out.

## Media

Photographs may also use the R2 archive (`R2_*` env).
