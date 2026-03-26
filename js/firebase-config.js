/* ═══════════════════════════════════════════════════════════
   FOCUSSIUM v2 PRO — FIREBASE CONFIG
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
    db: firebase.firestore()
};

FB.db.enablePersistence().catch(() => { });
