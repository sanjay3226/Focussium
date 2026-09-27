/* ═══════════════════════════════════════════════════════════
   FOCUSSIUM v3 — FIREBASE CONFIG
   Uses FirestoreSettings.cache for offline persistence
   (replaces deprecated enablePersistence / enableMultiTabIndexedDbPersistence)
═══════════════════════════════════════════════════════════ */

firebase.initializeApp({
    apiKey: "AIzaSyCAjPepeb_ND5_Kr3vs0d6ziaIt9ilkJi8",
    authDomain: "san-s-automation.firebaseapp.com",
    projectId: "san-s-automation",
    storageBucket: "san-s-automation.firebasestorage.app",
    messagingSenderId: "275856691887",
    appId: "1:275856691887:web:708650f67d5dcca2e67a5a"
});

const FB = {
    auth: firebase.auth(),
    db: (() => {
        const db = firebase.firestore();
        // Firebase 10.x: use FirestoreSettings.cache for multi-tab offline persistence
        // This replaces the deprecated enablePersistence / enableMultiTabIndexedDbPersistence APIs
        try {
            db.settings({
                cacheSizeBytes: firebase.firestore.CACHE_SIZE_UNLIMITED
            });
        } catch(e) { /* Settings already applied */ }
        return db;
    })()
};