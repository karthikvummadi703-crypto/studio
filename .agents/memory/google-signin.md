---
name: Google Sign-In approach
description: How Google auth is wired in EcoPulse and what external config is needed
---

The app uses `signInWithPopup` (Firebase popup flow) for Google Sign-In.

**Why:** GIS (Google Identity Services) caused `origin_mismatch` error 400 because the Replit dev/prod domain must be registered in Google Cloud Console → OAuth client → Authorized JavaScript Origins. With `signInWithPopup`, Firebase routes OAuth through its own domain (`project.firebaseapp.com`), so only Firebase Console → Authentication → Authorized Domains needs the Replit domain — much simpler.

**How to apply:** When the app is deployed, add the `.replit.app` production URL to Firebase Console → Authentication → Authorized Domains. For dev, add the `.pike.replit.dev` domain too.
